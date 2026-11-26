#!/usr/bin/env node
/**
 * Antigravity Native Hook Enforcement — v8.0.1
 * Enforces intake receipts, CWD-resilient project resolution, TTY/self-check safety,
 * segmented command safety, schema/git protections, .env read/secret-bypass guards,
 * native subagent authorization, and friction telemetry.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { bootstrapRole } from './agentapi.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const HOOK_VERSION = (() => { try { return fs.readFileSync(path.join(path.dirname(SCRIPT_DIR), 'VERSION'), 'utf8').trim(); } catch { return '8.3.0'; } })();
const AGY = path.join(SCRIPT_DIR, 'agybot.mjs');
const rawArgs = process.argv.slice(2);
const event = String(rawArgs.find(x => !x.startsWith('-')) || '').toLowerCase();
const selfCheckFlag = rawArgs.includes('--self-check') || rawArgs.includes('--ping');
const sha = s => crypto.createHash('sha256').update(String(s || '')).digest('hex');
const now = () => new Date().toISOString();

async function readStdin() {
  if (selfCheckFlag || process.stdin.isTTY) return { _selfCheck: true };
  return new Promise(resolve => {
    let settled = false;
    const chunks = [];
    let gotData = false;
    const finish = val => {
      if (settled) return;
      settled = true;
      clearTimeout(idleTimer);
      clearTimeout(maxTimer);
      try {
        process.stdin.off('data', onData);
        process.stdin.off('end', onEnd);
        process.stdin.off('error', onErr);
        process.stdin.pause();
        process.stdin.unref?.();
      } catch {}
      resolve(val);
    };
    const onData = chunk => { gotData = true; clearTimeout(idleTimer); chunks.push(chunk); };
    const onEnd = () => {
      const s = Buffer.concat(chunks).toString('utf8').trim();
      if (!s) return finish({});
      try { finish(JSON.parse(s)); } catch (e) { finish({ _hookInputError: String(e?.message || e) }); }
    };
    const onErr = () => finish({});
    // If host left stdin open without sending any bytes (e.g. direct shell/.bat), avoid hanging forever
    const idleTimer = setTimeout(() => { if (!gotData) finish({}); }, 150);
    const maxTimer = setTimeout(onEnd, 5000);
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onErr);
    process.stdin.resume();
  });
}
function out(v) { process.stdout.write(JSON.stringify(v)); }
function readJson(p, d = null) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } }
function atomicJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); const q = `${p}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(q, JSON.stringify(v, null, 2) + '\n', 'utf8'); fs.renameSync(q, p); }

function normalizeWorkspaceCandidate(w) {
  let s = String(w || '').trim();
  if (!s) return null;
  if (/^file:\/\//i.test(s)) {
    try { s = fileURLToPath(s); } catch {}
  }
  let resolved = path.resolve(s);
  for (let i = 0; i < 2; i++) {
    const base = path.basename(resolved).toLowerCase();
    if (base === '.agents' || base === '.slices') {
      const parent = path.dirname(resolved);
      if (parent && parent !== resolved) resolved = parent;
    }
  }
  return resolved;
}

function workspace(input) {
  const wp = input.workspacePaths || input.workspace_paths || (input.cwd ? [input.cwd] : null);
  const raw = (Array.isArray(wp) && wp.length ? wp[0] : null) || process.env.AGY_PROJECT_ROOT || process.cwd();
  return normalizeWorkspaceCandidate(raw) || process.cwd();
}

function slicesDir(root) {
  if (process.env.SLICE_GOVERNOR_ROOT) return path.resolve(process.env.SLICE_GOVERNOR_ROOT);
  return path.join(root, '.slices');
}
function governorCfg(root) { return readJson(path.join(slicesDir(root), 'SLICE_GOVERNOR.json'), {}) || {}; }
function orchestrationTransport(root) {
  const c = governorCfg(root);
  return String(c.agyBot?.orchestrationTransport || 'NATIVE_SUBAGENTS').toUpperCase();
}
function registry(root) { return readJson(path.join(slicesDir(root), 'AGY_SWARM_REGISTRY.json'), { swarms: [] }) || { swarms: [] }; }

function roleForConversation(root, cid, input) {
  const tPath = input.transcriptPath || input.transcript_path || '';
  const prompt = latestUserPrompt(tPath);
  const boot = bootstrapRole({ slices: slicesDir(root), root, conversationId: cid, prompt });
  for (const s of registry(root).swarms || []) {
    for (const role of ['ARCHITECT', 'BUILDER', 'QA', 'AUDITOR']) {
      if (cid && String(s.roles?.[role] || '') === String(cid)) return role;
    }
  }
  if (boot) return boot;
  if (orchestrationTransport(root) === 'AGENTAPI_ONLY') {
    if (/^AGY_ROLE_BOOTSTRAP\b/.test(prompt)) return 'BOOTSTRAP_UNVERIFIED';
    const pending = path.join(slicesDir(root), 'agentapi-bootstrap');
    if (!prompt && fs.existsSync(pending) && fs.readdirSync(pending).filter(n => /^[a-f0-9]{48}\.json$/.test(n)).some(n => { const r = readJson(path.join(pending, n)); return r?.status === 'PENDING' && r.expiresAt > Date.now(); })) return 'BOOTSTRAP_UNVERIFIED';
  }
  return 'COORDINATOR';
}

function teamAndActive(root, cid) {
  for (const s of registry(root).swarms || []) {
    const roles = s.roles || {};
    if (Object.values(roles).map(String).includes(String(cid)) || String(roles.COORDINATOR || s.coordinatorSessionId || '') === String(cid)) {
      const active = [...(s.activeTasks || [])].reverse().find(t => !['RETURNED_TO_COORDINATOR', 'COMPLETED', 'CANCELLED', 'FAILED'].includes(String(t.phase || '')));
      return { team: s, active };
    }
  }
  return { team: null, active: null };
}

function statePath(root) { return path.join(slicesDir(root), 'AGY_HOOK_STATE.json'); }
function loadState(root) { return readJson(statePath(root), { schemaVersion: 1, governorVersion: HOOK_VERSION, conversations: {} }) || { schemaVersion: 1, governorVersion: HOOK_VERSION, conversations: {} }; }
function saveState(root, s) { s.schemaVersion = 1; s.governorVersion = HOOK_VERSION; s.updatedAt = now(); atomicJson(statePath(root), s); }
function contentOf(obj) { if (!obj || typeof obj !== 'object') return ''; for (const k of ['content', 'text', 'message', 'prompt']) if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k]; return ''; }
function extractUserRequest(text) { const s = String(text || ''); const m = s.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/i); return (m ? m[1] : s).trim(); }

function collectTurnPrompts(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return { latest: '', composite: '', count: 0 };
  let lines = [];
  try { lines = fs.readFileSync(transcriptPath, 'utf8').split(/\r?\n/).filter(Boolean).slice(-400); } catch { return { latest: '', composite: '', count: 0 }; }
  const userPrompts = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    let x; try { x = JSON.parse(lines[i]); } catch { continue; }
    const type = String(x.type || x.kind || '').toUpperCase(), source = String(x.source || x.role || '').toUpperCase();
    const isModel = source.includes('MODEL') || type.includes('PLANNER_RESPONSE') || source.includes('ASSISTANT');
    if (isModel && userPrompts.length > 0) break;
    if (type.includes('USER') || source.includes('USER')) {
      const c = extractUserRequest(contentOf(x));
      if (c) userPrompts.unshift(c);
    } else {
      const c = contentOf(x);
      if (c && /<USER_REQUEST>/i.test(c)) {
        const req = extractUserRequest(c);
        if (req) userPrompts.unshift(req);
      }
    }
  }
  const count = userPrompts.length;
  return { latest: userPrompts[count - 1] || '', composite: userPrompts.join('\n\n---\n\n'), count };
}

function latestUserPrompt(transcriptPath) { const turn = collectTurnPrompts(transcriptPath); return turn.composite || turn.latest; }
function extractBatchDirective(text) {
  const s = String(text || '');
  const m = s.match(/\b([A-Z0-9]+-[A-Z0-9]+)\b/) || s.match(/--directive\s+["']?([^"'\s]+)["']?/);
  return m ? m[1] : 'CURRENT_BATCH';
}
function isDeclaredExecutionBatch(text) {
  const s = String(text || '');
  return /(?:MODE\s*=\s*EXECUTE|DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|GIT_COMMIT\s*=\s*(?:YES|TRUE|ALLOWED)|VPS_DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|EXECUTE\s*=\s*YES|AUTORIZADO\s*=\s*SIM)/i.test(s);
}

// Quote-aware chained command splitter (ignores separators inside single/double quotes)
function splitCommandSegments(cmd) {
  const s = String(cmd || '');
  const segs = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === '\\' && quote === '"' && i + 1 < s.length) {
        cur += s[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (two === '&&' || two === '||' || two === '\r\n') {
      if (cur.trim()) segs.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    if (ch === ';' || ch === '|' || ch === '&' || ch === '\n') {
      if (cur.trim()) segs.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) segs.push(cur.trim());
  return segs;
}

function isDestructiveCommand(cmd) {
  return splitCommandSegments(cmd).some(seg =>
    /^(?:git\s+(?:reset\b|clean\s+-[a-z]*f|push\s+--force|checkout\s+(?:[^-\s]|--)|restore\b|stash\b)|rm\s+-(?:rf|fr)\b|rmdir\s+\/s\s+\/q\b)/i.test(seg)
  );
}

function isEnvReadCommand(cmd) {
  return splitCommandSegments(cmd).some(seg => {
    if (!/\.env(\b|\.)/i.test(seg)) return false;
    if (/\.env\.(example|sample|template|dist)\b/i.test(seg) && !/\b(cat|type|head|tail|less|more|Get-Content)\s+["']?\.env(\.(local|prod|production|dev|development|staging|test))?["']?\b/i.test(seg)) return false;
    return /\b(cat|less|more|head|tail|bat|grep|rg|sed|awk|scp|type|Get-Content|Select-String)\b[^;|&]*\.env(?:\.(local|prod|production|dev|development|staging|test))?\b/i.test(seg)
      || /<\s*["']?\.env(?:\.(local|prod|production|dev|development|staging|test))?["']?/i.test(seg);
  });
}

function isNoVerifyCommit(cmd) {
  return splitCommandSegments(cmd).some(seg =>
    /\bgit\b.*\bcommit\b.*(?:--no-verify|\s-[a-z]*n[a-z]*(?:\s|$))/i.test(seg)
  );
}

function isRemoteOrDeployCommand(cmd) {
  const s = String(cmd || '').trim();
  return /^(ssh\b|scp\b|rsync\b|docker\b|docker\s+compose\b|podman\b|kubectl\b|npx\s+wrangler\b|wrangler\b)/i.test(s);
}
function isWorktreeCommand(cmd) { return /^git\s+worktree\b/i.test(String(cmd || '').trim()); }

function isSingleSegmentReadOnly(seg) {
  const s = String(seg || '').trim();
  if (!s) return false;
  if (/>\s*[^&]|\b(?:Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|Rename-Item|New-Item|rm|del|mv|cp|mkdir|rmdir)\b/i.test(s)) return false;
  return /^(?:git\s+(?:status|diff|log|show|branch|rev-parse|grep|ls-files|remote|tag|describe|worktree\s+list)\b|rg\b|grep\b|find\b|findstr\b|cat\b|type\b|head\b|tail\b|ls\b|dir\b|pwd\b|echo\b|Write-Output\b|Write-Host\b|Get-Content\b|Select-String\b|Get-ChildItem\b|Test-Path\b|Resolve-Path\b|Get-Item\b|Get-Location\b|Select-Object\b|Where-Object\b|Sort-Object\b|Measure-Object\b|Format-Table\b|Format-List\b|ConvertFrom-Json\b|ConvertTo-Json\b|node\s+(?:--check|-v|--version)\b|npm\s+-v\b|npx\s+tsc\s+--noEmit\b)/i.test(s)
    || /\b(?:agybot|slice-governor|antigravity-hook|agy-hook|secret-scan|design-lint)\.mjs["']?\s+(?:--help|-h|status|list|inspect|doctor|setup-check|runtime-status|brain-status|qualify|report|orchestration-report|swarm-health|hawd|project-probe|lifecycle-probe|bootstrap|test-integrity|scope-check|todo\s+(?:list|status)|requirements(?:-reconcile)?|source-register|sources-refresh|secret-scan|design-lint|handoff-verify|--tracked|--changed|--dir|--json)\b/i.test(s);
}

function isBenignPreamble(seg) {
  const s = String(seg || '').trim();
  return /^(?:cd\s+|Set-Location\s+|Write-Output\s+|Write-Host\s+|\$env:[A-Za-z0-9_]+\s*=)/i.test(s) || isSingleSegmentReadOnly(s);
}

function readOnlyCommand(cmd) {
  const segs = splitCommandSegments(cmd);
  return segs.length > 0 && segs.every(isSingleSegmentReadOnly);
}

function isIntakeOrBootstrapCommand(cmd) {
  const segs = splitCommandSegments(cmd);
  if (!segs.length) return false;
  const targetIdx = segs.findIndex(s =>
    /(?:^|\s)(?:"[^"]*node(?:\.exe)?"|node(?:\.exe)?)\s+.*?(?:(?:agybot|slice-governor)\.mjs["']?\s+(?:--help|-h|intake|setup|bootstrap|project-probe|lifecycle-probe|status|runtime-status|brain-status|qualify|hawd|doctor|learn|browser-config|design-taste-init|scaffold-constitution|promote-rule|record|test-integrity|scope-check|source-register|sources-refresh|requirements-reconcile)\b|(?:agy-hook|antigravity-hook)\.mjs["']?\s+(?:session-start|pre-invocation|pre-tool-use|stop)\b)/i.test(s)
  );
  if (targetIdx < 0) return false;
  return segs.slice(0, targetIdx).every(isBenignPreamble) && segs.slice(targetIdx + 1).every(isBenignPreamble);
}

function actionableDenialMessage(root, prefixReason, directive = 'CURRENT_BATCH', cid = '') {
  const absAgy = path.join(slicesDir(root), 'agybot.mjs').replaceAll('\\', '/');
  const coordFlag = cid ? ` --coordinator "${cid}"` : '';
  const cmdHint = fs.existsSync(absAgy) ? `node "${absAgy}" intake --directive "${directive}"${coordFlag}` : `node .slices/agybot.mjs intake --directive "${directive}"${coordFlag}`;
  return `BLOQUEADO_POR_INTAKE: ${prefixReason}\nPara liberar este comando, execute:\n  ${cmdHint}\n(ou declare no cabeçalho do lote: MODE = EXECUTE / DEPLOY = YES).\nNUNCA leia o código-fonte do hook para descobrir por que um comando foi negado; execute o intake acima.`;
}

function isInternalPrompt(text) { return /AGY_SWARM_IPC_v7|AGY_ROLE_BOOTSTRAP|AGY_SPECIALIST_MODE=TRUE|SPECIALIST_CHAIN_COMPLETE|HEALTH_CHECK/.test(String(text || '')); }
function extractLastJson(stdout) { const s = String(stdout || '').trim(); for (let i = s.lastIndexOf('{'); i >= 0; i = s.lastIndexOf('{', i - 1)) { try { return JSON.parse(s.slice(i)); } catch {} } return null; }
function runIntake(root, prompt, cid) {
  const args = [AGY, 'intake', '--text', prompt, '--coordinator', cid, '--hook-enforced', '--skip-hook-sync'];
  const p = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, env: { ...process.env, AGY_PROJECT_ROOT: root, AGY_CURRENT_CONVERSATION_ID: cid, SLICE_GOVERNOR_ROOT: slicesDir(root) } });
  const parsed = extractLastJson(p.stdout);
  if (parsed) return { ok: true, result: parsed, status: p.status };
  return { ok: false, status: p.status, error: (p.stderr || p.stdout || 'intake failed').trim().slice(-4000) };
}
function injection(message, metadata = {}) { return { injectSteps: [{ systemMessage: { systemMessage: message, metadata: { source: 'agybot-v8-hooks', ...metadata } } }] }; }
function targetFile(args = {}) { return String(args.TargetFile || args.targetFile || args.AbsolutePath || args.Path || args.path || '').replaceAll('\\', '/'); }
function commandLine(args = {}) { return String(args.CommandLine || args.commandLine || args.command || ''); }
function controlPlanePath(p) {
  const x = String(p).toLowerCase();
  return x.includes('/slice-orchestration-governor/') || x.includes('\\.gemini\\config\\skills\\slice-orchestration-governor');
}
function obviouslyMutatingCommand(cmd) {
  const s = String(cmd).toLowerCase();
  return /(^|[\s;&|])(rm|del|erase|rmdir|mv|move|cp|copy|touch|mkdir|sed\s+-i|perl\s+-pi|git\s+(reset|clean|checkout|switch|restore|commit|push|merge|rebase|cherry-pick)|prisma\s+(migrate|format|db\s+pull)|psql\b.*\b(insert|update|delete|alter|drop|create)\b)/i.test(s) || />\s*[^&]/.test(s) || /set-content|add-content|out-file/i.test(s);
}
function nativeCollaborationTool(name) { return ['invoke_subagent', 'define_subagent', 'send_message', 'manage_subagents'].includes(String(name)); }
function activePhaseRole(active) { const m = String(active?.phase || '').match(/^DISPATCHED_TO_(ARCHITECT|BUILDER|QA|AUDITOR)$/); return m ? m[1] : null; }
function receiptFor(root, cid) { const s = loadState(root); return { state: s, entry: s.conversations?.[cid] || null }; }

function recordFriction(root, rule, toolName) {
  try {
    const p = path.join(slicesDir(root), 'FRICTION_LOG.jsonl');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, JSON.stringify({ ts: now(), rule: String(rule).slice(0, 140), tool: toolName }) + '\n', 'utf8');
  } catch {}
}

function denyWithFriction(root, reason, toolName) {
  recordFriction(root, reason, toolName);
  out({ decision: 'deny', reason });
  process.exit(0);
}

const input = await readStdin(), root = workspace(input), cid = String(input.conversationId || input.conversation_id || input.sessionId || input.session_id || '');
const tPath = input.transcriptPath || input.transcript_path || '';
let role = 'BOOTSTRAP_UNVERIFIED';
try {
  if (input._selfCheck && event === 'stop') {
    out({ decision: 'allow', selfCheck: true, version: HOOK_VERSION });
    process.exit(0);
  }
  role = roleForConversation(root, cid, input);
  const transport = orchestrationTransport(root);
  const gCfg = governorCfg(root);
  const trackingSummary = gCfg.tracking ? `TODO_LEDGER=${gCfg.tracking.todoPath || '.slices/TODO.md'} TRACKING_MODE=${gCfg.tracking.mode || 'GOVERNOR_MANAGED'}` : 'TODO_LEDGER=.slices/TODO.md';

  if (role === 'BOOTSTRAP_UNVERIFIED') {
    if (event === 'pre-tool-use') out({ decision: 'deny', reason: 'AGENTAPI_BOOTSTRAP_UNVERIFIED: wait for the project-bound specialist bootstrap; no tools or Coordinator intake are authorized.' });
    else if (event === 'stop') out({ decision: 'allow' });
    else out(injection('AGY_HOOK_ROLE=BOOTSTRAP_UNVERIFIED\nMUTATION_BUDGET=ZERO\nDo not run Coordinator intake, tools or project work. Wait for the verified specialist bootstrap and registry binding.', { event, blocked: true }));
    process.exit(0);
  }

  if (event === 'session-start') {
    const { team, active } = teamAndActive(root, cid);
    const bCfg = gCfg.browserTesting || {};
    const bMode = bCfg.mode || 'CHROME_DEVTOOLS_OR_PLAYWRIGHT';
    const chromeReady = bCfg.chromeRemoteDebuggingConfirmed ? 'CONFIRMED' : 'UNCONFIRMED';
    const autoLearnState = readJson(path.join(slicesDir(root), 'AUTO_LEARNINGS.json'), null);
    const pendingLearnings = Array.isArray(autoLearnState?.items) ? autoLearnState.items.filter(x => x.status !== 'PROMOTED').length : 0;
    const hasManifest = ['package.json', 'pyproject.toml', 'requirements.txt', 'Cargo.toml', 'go.mod'].some(f => fs.existsSync(path.join(root, f))) || fs.existsSync(path.join(root, 'src'));
    const lifecycle = hasManifest ? 'BROWNFIELD' : 'GREENFIELD';
    const hasTaste = fs.existsSync(path.join(root, '.slices', 'DESIGN_TASTE.md')) || fs.existsSync(path.join(root, '.unslop-ui', 'taste.md'));
    const autoMeta = `LIFECYCLE=${lifecycle} DESIGN_TASTE=${hasTaste ? 'PRESENT' : 'MISSING'} AUTO_CHANGELOG=${gCfg.tracking?.autoUpdateChangelog !== false} BROWSER_MODE=${bMode} CHROME_DEBUGGING=${chromeReady} (chrome://inspect/#remote-debugging) AUTO_REPAIR_MAX_ROUNDS=${gCfg.agyBot?.autoRepairMaxRounds || 3}${pendingLearnings ? ` AUTO_LEARNINGS_PENDING=${pendingLearnings}` : ''}`;
    out(injection(`AGY_HOOKS_V8_ACTIVE=TRUE\nAGY_HOOKS_V7_ACTIVE=TRUE\nAGY_HOOK_ROLE=${role}\nAGY_ORCHESTRATION_TRANSPORT=${transport}\n${trackingSummary}\n${autoMeta}\n${role === 'COORDINATOR' ? 'Human turns are intake-gated by PreInvocation. Use native subagents (invoke_subagent/research) according to Class A/B/C/D. Browser/MCP tools (browser, chrome_devtools) are NOT blocked by PreToolUse.' : 'This is a governed specialist conversation. Process only assigned phase envelopes.'}\n${active ? `ACTIVE_TASK=${active.taskId} PHASE=${active.phase}` : 'ACTIVE_TASK=NONE'}`, { event: 'SessionStart', role, team: team?.teamKey || null }));
    process.exit(0);
  }

  if (event === 'pre-invocation') {
    const { active } = teamAndActive(root, cid);
    const turn = collectTurnPrompts(tPath);
    const prompt = turn.composite || turn.latest;
    if (role !== 'COORDINATOR') {
      out(injection(`AGY_HOOK_ROLE=${role}\nAGY_SPECIALIST_MODE=TRUE\nDo not run Coordinator intake. ${active ? `Active task ${active.taskId}; current phase ${active.phase}.` : ''} Complete only the assigned phase and report through swarm-complete.`, { event: 'PreInvocation', role }));
      process.exit(0);
    }
    if (!prompt) {
      out(injection(`AGY_HOOKS_V8_ACTIVE=TRUE\nAGY_HOOK_ROLE=COORDINATOR\nAGY_ORCHESTRATION_TRANSPORT=${transport}\n${trackingSummary}\nNo new human request was found in the persistent transcript. Do not invent an intake.`, { event: 'PreInvocation', role }));
      process.exit(0);
    }
    if (isInternalPrompt(prompt)) {
      out(injection('AGY_HOOK_INTERNAL_EVENT=TRUE\nDo not run a new human-request intake for this Agy IPC/control message. Reconcile the persisted task lifecycle only.', { event: 'PreInvocation', role }));
      process.exit(0);
    }
    const h = sha(prompt), st = loadState(root), prev = st.conversations?.[cid] || {};
    if (prev.lastPromptHash === h && prev.intakeReceipt) {
      out(injection(`AGY_HOOK_INTAKE_RECEIPT=${prev.intakeReceipt}\nAGY_HOOK_REQUEST_FINGERPRINT=${h}\nAGY_ORCHESTRATION_TRANSPORT=${transport}\n${trackingSummary}\nThis invocation belongs to the already-intaked current human turn. Do not run intake again.`, { event: 'PreInvocation', role, receipt: prev.intakeReceipt }));
      process.exit(0);
    }

    // Single-receipt guarantee for multiple human messages / addenda in the same turn
    if (turn.count > 1 && prev.intakeReceipt && prev.intakeResult && String(prev.intakeResult.mutationBudget) === 'SCOPED') {
      const updatedEntry = { ...prev, lastPromptHash: h, lastPromptAt: now(), addendaCount: (prev.addendaCount || 0) + 1 };
      st.conversations = st.conversations || {};
      st.conversations[cid] = updatedEntry;
      saveState(root, st);
      out(injection(`AGY_HOOK_INTAKE_RECEIPT=${prev.intakeReceipt}\nAGY_HOOK_REQUEST_FINGERPRINT=${h}\nTURN_ADDENDUM_ATTACHED=TRUE\nThis message is an addendum attached to existing intake receipt ${prev.intakeReceipt}. Preserving authorized execution state.`, { event: 'PreInvocation', role, receipt: prev.intakeReceipt }));
      process.exit(0);
    }

    const ran = runIntake(root, prompt, cid);
    const entry = { ...prev, role: 'COORDINATOR', lastPromptHash: h, lastPromptAt: now(), intakeReceipt: ran.result?.intakeReceipt || `HOOK_BLOCKED_${Date.now()}`, intakeResult: ran.result || { action: 'ORCHESTRATION_BLOCKED', mutationBudget: 'ZERO', error: ran.error }, stopContinueCount: 0 };
    st.conversations = st.conversations || {};
    st.conversations[cid] = entry;
    saveState(root, st);
    if (!ran.ok) {
      out(injection(`AGY_HOOK_INTAKE_FAILED=TRUE\nAGY_HOOK_INTAKE_RECEIPT=${entry.intakeReceipt}\nProject mutation is blocked. Intake failed: ${ran.error}`, { event: 'PreInvocation', role, blocked: true }));
      process.exit(0);
    }
    const r = ran.result;
    out(injection(`AGY_HOOK_INTAKE_RECEIPT=${r.intakeReceipt}\nAGY_HOOK_REQUEST_FINGERPRINT=${r.requestFingerprint}\nREQUEST_INTENT=${r.requestIntent}\nMUTATION_BUDGET=${r.mutationBudget}\nRISK_CLASS=${r.riskClass}\nORCHESTRATION_MODE=${r.mode}\nREQUIRED_ROLES=${JSON.stringify(r.requiredRoles || [])}\nACTION=${r.action}\nCOORDINATOR_MAY_IMPLEMENT=${r.coordinatorMayImplement === true ? 'YES' : 'NO'}\nAGY_ORCHESTRATION_TRANSPORT=${transport}\n${trackingSummary}\nThis receipt was enforced before this model invocation. Follow Class ${r.riskClass} pipeline (${transport}).`, { event: 'PreInvocation', role, receipt: r.intakeReceipt }));
    process.exit(0);
  }

  if (event === 'pre-tool-use') {
    const tool = input.toolCall || input.tool || {};
    const name = String(tool.name || tool.toolName || input.toolName || input.tool_name || '');
    const args = tool.args || tool.input || tool.arguments || input.toolInput || input.tool_input || {};
    const p = targetFile(args), cmd = commandLine(args);
    const { entry, state: st } = receiptFor(root, cid), { active } = teamAndActive(root, cid), phaseRole = activePhaseRole(active);

    if (nativeCollaborationTool(name) && transport === 'AGENTAPI_ONLY') {
      denyWithFriction(root, `Agy Bot (AGENTAPI_ONLY) forbids native collaboration tool ${name}; use persistent AgentAPI conversations.`, name);
    }
    if (name === 'run_command' && /language_server(?:\.exe)?\s+agentapi/i.test(cmd)) {
      denyWithFriction(root, 'Direct AgentAPI shell calls are reserved for the Agy Bot runtime.', name);
    }
    if (name === 'run_command' && /invoke_subagent|define_subagent|manage_subagents/i.test(cmd) && transport === 'AGENTAPI_ONLY') {
      denyWithFriction(root, 'Native/hidden subagent CLI transport is prohibited under AGENTAPI_ONLY.', name);
    }

    const writeTool = ['write_file', 'edit_file', 'write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(name);
    if (writeTool && controlPlanePath(p) && String(entry?.intakeResult?.requestIntent || '') !== 'CONTROL_PLANE_MAINTENANCE') {
      denyWithFriction(root, 'CONTROL_PLANE_TAMPER: Governor global skill files require explicit CONTROL_PLANE_MAINTENANCE intake.', name);
    }

    if (role === 'ARCHITECT' || role === 'AUDITOR') {
      if (writeTool) denyWithFriction(root, `ROLE_WALL: ${role} is read-only for product work.`, name);
      if (name === 'run_command' && obviouslyMutatingCommand(cmd)) denyWithFriction(root, `ROLE_WALL: ${role} cannot run mutating shell commands.`, name);
    }
    if (role === 'QA') {
      if (writeTool) denyWithFriction(root, 'ROLE_WALL: QA validates; product file mutation must return to Builder.', name);
      if (name === 'run_command' && /(git\s+(reset|clean|checkout|restore|commit|push)|language_server(?:\.exe)?\s+agentapi)/i.test(cmd)) denyWithFriction(root, 'ROLE_WALL: QA cannot alter VCS state.', name);
    }
    if (role === 'BUILDER') {
      if (phaseRole !== 'BUILDER' && (writeTool || name === 'run_command')) denyWithFriction(root, `ROLE_WALL: Builder is not the active phase${active ? ` (current=${active.phase})` : ''}.`, name);
      if (name === 'run_command' && /git\s+(reset|clean|checkout|restore|commit|push)/i.test(cmd)) denyWithFriction(root, 'Project safety: automatic commit/push/reset/checkout/restore/clean is prohibited by the Governor.', name);
    }

    if (role === 'COORDINATOR') {
      const r = entry?.intakeResult;
      const turnPrompt = collectTurnPrompts(tPath).composite || '';
      const declaredAuth = Boolean(r?.declaredExecutionAuth) || isDeclaredExecutionBatch(turnPrompt);
      const batchId = extractBatchDirective(turnPrompt);

      if (name === 'run_command') {
        if (isEnvReadCommand(cmd)) {
          denyWithFriction(root, 'SECRET_GUARD: leitura direta de arquivo .env é proibida (.env nunca entra no contexto). Leia .env.example ou pergunte apenas o nome da variável.', name);
        }
        if (isNoVerifyCommit(cmd)) {
          denyWithFriction(root, 'SECRET_GUARD: --no-verify (-n) em git commit é proibido pois ignora a auditoria de segredos.', name);
        }
        if (isDestructiveCommand(cmd)) {
          denyWithFriction(root, 'Project safety: comando destrutivo proibido pelo Governor (reset, checkout/restore/stash sobre arquivos não commitados, clean, rm -rf). Reversões exigem cópia física em .scratch/ com SHA-256.', name);
        }
        if (/prisma\s+(format|db\s+pull)/i.test(cmd)) {
          if (!declaredAuth || String(r?.requestIntent || '').includes('READ_ONLY') || ['QUESTION', 'CONTEXT_REFRESH'].includes(String(r?.requestIntent || '')) || String(r?.mutationBudget || '') === 'ZERO') {
            denyWithFriction(root, 'MUTATION_BLOCKED: npx prisma format e npx prisma db pull alteram/reconstroem o schema e são terminantemente proibidos em batch READ_ONLY/descoberta.', name);
          }
        }
        // Always permit self-recovery intake/bootstrap and strictly read-only inspection even if no intake receipt exists yet
        if (isIntakeOrBootstrapCommand(cmd) || readOnlyCommand(cmd)) {
          out({ decision: 'allow' });
          process.exit(0);
        }
      }

      const isRemoteDeploy = isRemoteOrDeployCommand(cmd);
      const isWorktree = isWorktreeCommand(cmd);

      if ((writeTool || name === 'run_command') && !r) {
        if (declaredAuth) {
          const autoRan = runIntake(root, turnPrompt || `MODE = EXECUTE\nBATCH: ${batchId}`, cid);
          if (autoRan.ok) {
            const updatedEntry = entry || { role: 'COORDINATOR', lastPromptHash: '', lastPromptAt: now(), intakeReceipt: null, intakeResult: null, stopContinueCount: 0 };
            updatedEntry.intakeResult = autoRan.result;
            updatedEntry.intakeReceipt = autoRan.result.intakeReceipt;
            st.conversations = st.conversations || {};
            st.conversations[cid] = updatedEntry;
            saveState(root, st);
            out({ decision: 'allow' });
            process.exit(0);
          }
        }
        denyWithFriction(root, actionableDenialMessage(root, 'nenhum recibo de intake foi vinculado ao turno humano atual.', batchId, cid), name);
      }

      if (r) {
        const zero = String(r.mutationBudget || 'ZERO') === 'ZERO';
        const builderExternal = transport === 'AGENTAPI_ONLY' && ((r.requiredRoles || []).includes('BUILDER') || r.coordinatorMayImplement === false);

        if (declaredAuth && (isRemoteDeploy || isWorktree)) {
          out({ decision: 'allow' });
          process.exit(0);
        }
        if (writeTool && (zero || builderExternal)) {
          const msg = zero
            ? actionableDenialMessage(root, 'o pedido atual foi classificado com orçamento de mutação ZERO (leitura).', batchId, cid)
            : `COORDINATOR_ROLE_WALL: Builder owns product mutation under AGENTAPI_ONLY.\n${actionableDenialMessage(root, 'o Coordenador tentou editar arquivos atribuídos ao Builder.', batchId, cid)}`;
          denyWithFriction(root, msg, name);
        }
        if (name === 'run_command' && (zero || builderExternal) && !readOnlyCommand(cmd)) {
          const msg = zero
            ? actionableDenialMessage(root, `o comando '${cmd.slice(0, 60)}' exige mutação, mas o orçamento do turno é ZERO.`, batchId, cid)
            : `COORDINATOR_ROLE_WALL: mutating/test execution belongs to Builder under AGENTAPI_ONLY.\n${actionableDenialMessage(root, 'comando pertence ao Builder.', batchId, cid)}`;
          denyWithFriction(root, msg, name);
        }
      }
    }
    out({ decision: 'allow' });
    process.exit(0);
  }

  if (event === 'stop') {
    if (role === 'COORDINATOR') { out({ decision: 'allow' }); process.exit(0); }
    const { active } = teamAndActive(root, cid), phaseRole = activePhaseRole(active);
    if (!active || phaseRole !== role) { out({ decision: 'allow' }); process.exit(0); }
    const st = loadState(root), prev = st.conversations?.[cid] || {}, count = Number(prev.stopContinueCount || 0) + 1;
    st.conversations = st.conversations || {};
    st.conversations[cid] = { ...prev, role, stopContinueCount: count, lastStopAt: now(), activeTaskId: active.taskId };
    saveState(root, st);
    if (count <= 2) {
      out({ decision: 'continue', reason: `Agy Bot v8: ${role} still owns active task ${active.taskId} (${active.phase}). Finish the assigned phase or execute swarm-complete.` });
      process.exit(0);
    }
    appendHookJournal(root, active.taskId, 'SPECIALIST_STALLED', { role, phase: active.phase, stopAttempts: count });
    out({ decision: 'allow' });
    process.exit(0);
  }
  out({});
} catch (e) {
  process.stderr.write(`[agy-hook] ${e?.stack || e}\n`);
  if (event === 'pre-tool-use') out({ decision: 'deny', reason: 'Agy Bot hook failed closed: ' + String(e?.message || e) });
  else out(injection('AGY_HOOK_FAILURE=TRUE\nFail closed for project mutation until the Agy Bot hook is healthy.', { event, blocked: true }));
}

function appendHookJournal(root, taskId, eventName, data) {
  try {
    const d = path.join(slicesDir(root), 'orchestrations', String(taskId).toLowerCase().replace(/[^a-z0-9._-]+/g, '-'));
    fs.mkdirSync(d, { recursive: true });
    fs.appendFileSync(path.join(d, 'journal.jsonl'), JSON.stringify({ timestamp: now(), event: eventName, ...data }) + '\n', 'utf8');
  } catch {}
}
