#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const VERSION = '8.3.0';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.dirname(SCRIPT_DIR);
const rl = readline.createInterface({ input, output });
const pt = (Intl.DateTimeFormat().resolvedOptions().locale || 'en').toLowerCase().startsWith('pt');
const say = (a, b) => console.log(pt ? a : b);
const ask = (a, b) => rl.question(pt ? a : b);
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pick = (v, a, d) => (a.includes(String(v).trim()) ? String(v).trim() : d);
const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const k = t.slice(2), n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) o[k] = true;
      else { o[k] = n; i++; }
    } else o._.push(t);
  }
  return o;
}
function verify() {
  const f = path.join(PKG, 'SHA256SUMS.txt');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const m = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (!m) continue;
    const rel = m[2].trim();
    if (rel === 'SHA256SUMS.txt') continue;
    const p = path.join(PKG, rel);
    if (!fs.existsSync(p) || hash(p) !== m[1]) throw new Error(`Integridade falhou / integrity failed: ${rel}`);
  }
}
function gitRoot(cwd = process.cwd()) {
  const p = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8', windowsHide: true });
  return p.status === 0 && p.stdout.trim() ? path.resolve(p.stdout.trim()) : null;
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(e.name)) continue;
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}
function readJson(p, d = null) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } }
function writeJson(p, v) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }
function rm(p) { fs.rmSync(p, { recursive: true, force: true }); }
function globalTarget(home = os.homedir()) { return path.join(home, '.gemini', 'config', 'skills', 'slice-orchestration-governor'); }
function versionAt(root) { try { return fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim(); } catch { return null; } }
function isBinding(root) { return readJson(path.join(root, 'PROJECT_BINDING.json'), {})?.bindingMode === 'GLOBAL_CANONICAL_LATEST_APPROVED_INSTALLED'; }
function isVolatileRuntimePath(p) {
  const norm = path.resolve(String(p || '')).replaceAll('\\', '/').toLowerCase();
  const tmpNorm = path.resolve(os.tmpdir()).replaceAll('\\', '/').toLowerCase();
  if (tmpNorm && (norm === tmpNorm || norm.startsWith(tmpNorm + '/'))) return true;
  return /(?:^|\/)(?:appdata\/local\/temp|zip-verify[^/]*)(?:\/|$)/i.test(norm);
}

function runReleaseSelfTest(root, label) {
  const test = path.join(root, 'scripts', 'self-test-v8.3.0.mjs');
  const r = spawnSync(process.execPath, [test], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 240000, env: { ...process.env, AGY_SELFTEST_SKIP_INSTALLER: '1', AGY_GOVERNOR_GLOBAL_PATH: root } });
  if (r.status !== 0) { console.error(r.stdout || ''); console.error(r.stderr || ''); throw new Error(`${label} self-test failed`); }
  return r;
}

function cleanupDiscoveryShadows(home, activeTarget, { preserveLatestToBackup = null } = {}) {
  const dirsToScan = [path.dirname(activeTarget), path.join(home, '.gemini', 'antigravity', 'skills')];
  const moved = [];
  let savedBackup = false;
  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    // Sort newest first so at most the most recent legacy backup is retained if needed
    entries.sort((a, b) => b.name.localeCompare(a.name));
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (path.resolve(full) === path.resolve(activeTarget)) continue;
      if (e.name === 'slice-orchestration-governor' || e.name.startsWith('slice-orchestration-governor.backup-')) {
        if (preserveLatestToBackup && !savedBackup && !fs.existsSync(preserveLatestToBackup)) {
          fs.mkdirSync(path.dirname(preserveLatestToBackup), { recursive: true });
          fs.renameSync(full, preserveLatestToBackup);
          savedBackup = true;
          moved.push(`${full} -> ${preserveLatestToBackup}`);
        } else {
          rm(full);
          moved.push(`${full} (pruned)`);
        }
      }
    }
  }
  return moved;
}

function installGlobal(target, { skipSelfTest = false, home = os.homedir() } = {}) {
  const resolvedTarget = path.resolve(target);
  const backupRoot = path.join(home, '.gemini', 'backups', 'skills');
  const prevBackup = path.join(backupRoot, 'slice-orchestration-governor-prev');
  if (path.resolve(resolvedTarget) === path.resolve(PKG)) {
    cleanupDiscoveryShadows(home, resolvedTarget);
    return;
  }
  if (!skipSelfTest) { runReleaseSelfTest(PKG, 'Source release'); say(`Self-test v${VERSION} source package: PASS`, `Self-test v${VERSION} source package: PASS`); }
  // Maintain AT MOST 1 backup (the immediately prior version) outside ~/.gemini/config/skills/
  if (fs.existsSync(backupRoot)) {
    for (const e of fs.readdirSync(backupRoot)) {
      if (e.startsWith('slice-orchestration-governor')) rm(path.join(backupRoot, e));
    }
  }
  let hadPrev = false;
  if (fs.existsSync(resolvedTarget)) {
    fs.mkdirSync(backupRoot, { recursive: true });
    fs.renameSync(resolvedTarget, prevBackup);
    hadPrev = true;
    say(`Backup da versão anterior salvo fora do discovery (máx 1): ${prevBackup}`, `Prior version backed up outside discovery (max 1): ${prevBackup}`);
  }
  cleanupDiscoveryShadows(home, resolvedTarget);
  try {
    copyDir(PKG, resolvedTarget);
    writeJson(path.join(resolvedTarget, 'ACTIVE_RELEASE.json'), { schemaVersion: 2, releaseChannel: 'LATEST_APPROVED_INSTALLED', activeVersion: VERSION, installedAt: new Date().toISOString(), runtimeRoot: resolvedTarget, policy: 'ZERO_SHADOW_GLOBAL_CANONICAL' });
    if (!skipSelfTest) { runReleaseSelfTest(resolvedTarget, 'Installed runtime'); say(`Self-test v${VERSION} installed runtime: PASS`, `Self-test v${VERSION} installed runtime: PASS`); }
    say(`Engine global instalada em: ${resolvedTarget}`, `Global engine installed at: ${resolvedTarget}`);
  } catch (e) {
    try { rm(resolvedTarget); if (hadPrev && fs.existsSync(prevBackup)) fs.renameSync(prevBackup, resolvedTarget); } catch (rollbackErr) { console.error('ROLLBACK_FAILED', rollbackErr.stack || rollbackErr); }
    throw e;
  }
}

function forwarderScript(targetScript) {
  return `#!/usr/bin/env node
// Portable v8 forwarder -> canonical global Slice Orchestration Governor (Zero-Shadow Runtime)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
let binding = {};
for (const c of [path.join(here, 'PROJECT_BINDING.json'), path.join(here, '..', 'PROJECT_BINDING.json')]) {
  try { if (fs.existsSync(c)) { binding = JSON.parse(fs.readFileSync(c, 'utf8')); break; } } catch {}
}
const inferredSlices = path.basename(here).toLowerCase() === '.slices' ? here : path.join(path.resolve(here, '..'), '.slices');
const inferredProject = binding.projectRoot ? path.resolve(binding.projectRoot) : path.dirname(inferredSlices);
const globalRoot = path.resolve(process.env.AGY_GOVERNOR_GLOBAL_PATH || binding.globalRuntimePath || path.join(os.homedir(), '.gemini', 'config', 'skills', 'slice-orchestration-governor'));
const target = path.join(globalRoot, 'scripts', '${targetScript}');
if (!fs.existsSync(target)) { console.error('[agy-forwarder] Global canonical Governor not found: ' + target); process.exit(2); }
const p = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: true,
  env: {
    ...process.env,
    AGY_RUNTIME_SOURCE: 'PORTABLE_SLICES_FORWARDER',
    AGY_GOVERNOR_GLOBAL_PATH: globalRoot,
    AGY_PROJECT_ROOT: process.env.AGY_PROJECT_ROOT || inferredProject,
    SLICE_GOVERNOR_ROOT: process.env.SLICE_GOVERNOR_ROOT || inferredSlices
  }
});
process.exit(p.status ?? 1);
`;
}

const BOOTSTRAP_START = '<!-- AGYBOT_BOOTSTRAP:START -->';
const BOOTSTRAP_END = '<!-- AGYBOT_BOOTSTRAP:END -->';
function managedBootstrapBlock(project) {
  const hookAbs = path.resolve(project, '.slices', 'agy-hook.mjs').replaceAll('\\', '/');
  const agyAbs = path.resolve(project, '.slices', 'agybot.mjs').replaceAll('\\', '/');
  return [
    BOOTSTRAP_START,
    '## Agy Bot v8 — Zero-Shadow Global Governance & Native Subagent Orchestration',
    '',
    '### ARCHITECTURE & RUNTIME',
    '',
    '- Canonical global skill: `~/.gemini/config/skills/slice-orchestration-governor` (Zero-Shadow: no `.agents/skills/slice-orchestration-governor/` copy exists in the repo).',
    '- `GLOBAL_RUNTIME_PATH_MUST_EXIST = TRUE` (binding nunca aponta para Temp/zip-verify).',
    `- Primary enforcement: \`.agents/hooks.json\` managed key \`agybot-v8\` invoking absolute hook path \`node "${hookAbs}" <phase>\`.`,
    '- Hook CWD invariant: Antigravity hook commands resolvem relativo a `.agents/`; NEVER put relative `.slices/agy-hook.mjs` paths inside `.agents/hooks.json` (`install.mjs --bind-project` writes the absolute path for this machine).',
    '- Project memory/config (`.slices/SLICE_GOVERNOR.json`, `.agy-vault/`, `.slices/DESIGN_TASTE.md`, tracking docs) stay project-local and survive every global upgrade without re-onboarding.',
    '',
    '### CLASS A/B/C/D ORCHESTRATION & TOTAL AUTONOMY',
    '',
    '- Under `NATIVE_SUBAGENTS` (default), use `invoke_subagent` / `research` by risk class: Class A (surgical + 1-pass reviewer), Class B (Spec -> Worker/Simplifier -> Diff QA -> Review R2), Class C/D (Research C4 trace -> Spec -> Worker -> Diff QA -> Review R2 -> Security).',
    '- Total Autonomy (`AUTONOMY_FIRST`): auto-update TODO + CHANGELOG + MASTER audit log (`handoff-verify` / `record`), auto-capture learnings (`FRICTION_LOG` / `q` loops), run closed self-repair loops (max 3 rounds before `/grill-me`), and verify Layer-2 integrity (`test-integrity`).',
    '- Lifecycle Playbooks & Design Hygiene: inspect `GREENFIELD` vs `BROWNFIELD` (`lifecycle-probe`), maintain Product Constitution above this block (`scaffold-constitution` / `promote-rule`), keep `.slices/DESIGN_TASTE.md` updated (`design-taste-init`), and enforce anti-pill rules (`design-lint` U1/U9/U26).',
    '- Live Browser Testing (`chrome_devtools` MCP): uses Chrome external remote debugging (`chrome://inspect/#remote-debugging`) or Playwright headless fallback; if live Chrome debugging is inactive during a UI check, guide the human in 1 `/grill-me` step and persist via `agybot browser-config`.',
    '- If `AGY_HOOK_INTAKE_RECEIPT` is already injected for this human turn, do not re-run `intake`. If blocked by `BLOQUEADO_POR_INTAKE`, execute only the hinted `intake --directive` command (never inspect hook source code).',
    '',
    '### FALLBACK ONLY IF HOOKS ARE ABSENT',
    '',
    '```powershell',
    `node "${agyAbs}" intake --text "<COMPLETE_CURRENT_USER_REQUEST>"`,
    '```',
    '',
    '### SAFETY & HANDOFF INVARIANTS',
    '',
    '- Never read `.env*` files, never pass `git commit --no-verify`, never run `git checkout/restore/reset/stash` on uncommitted files, never run `prisma format/db pull` in READ_ONLY batches.',
    '- Reports require per-file test counts (`# tests / # pass / # fail / exit`) and physical changed-file parity.',
    BOOTSTRAP_END
  ].join('\n');
}

function ensureAlwaysOnBootstrap(project) {
  const root = path.resolve(project), agents = path.join(root, 'AGENTS.md');
  const prior = fs.existsSync(agents) ? fs.readFileSync(agents, 'utf8') : '';
  const block = managedBootstrapBlock(root);
  const re = new RegExp(`${BOOTSTRAP_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${BOOTSTRAP_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
  let next = prior;
  if (re.test(next)) next = next.replace(re, block);
  else next = (next.trimEnd() ? next.trimEnd() + '\n\n' : '') + block + '\n';
  if (next !== prior) {
    if (prior) { const bdir = path.join(root, '.agy-backups', 'rules'); fs.mkdirSync(bdir, { recursive: true }); fs.writeFileSync(path.join(bdir, `AGENTS.md.before-agybot-${timestamp()}.bak`), prior, 'utf8'); }
    fs.writeFileSync(agents, next, 'utf8');
  }
  return { path: agents, created: !prior, changed: next !== prior, managedBootstrapPresent: true };
}

function managedHooksDefinition(project) {
  const hookAbs = path.resolve(project, '.slices', 'agy-hook.mjs').replaceAll('\\', '/');
  const runner = phase => `node "${hookAbs}" ${phase}`;
  return {
    enabled: true,
    SessionStart: [{ type: 'command', command: runner('session-start'), timeout: 15 }],
    PreInvocation: [{ type: 'command', command: runner('pre-invocation'), timeout: 120 }],
    PreToolUse: [{ matcher: 'write_file|edit_file|write_to_file|replace_file_content|multi_replace_file_content|run_command|invoke_subagent|define_subagent|send_message|manage_subagents', hooks: [{ type: 'command', command: runner('pre-tool-use'), timeout: 15 }] }],
    Stop: [{ type: 'command', command: runner('stop'), timeout: 15 }]
  };
}

function ensureAntigravityHooks(project) {
  const root = path.resolve(project), agentsDir = path.join(root, '.agents'), hooksPath = path.join(agentsDir, 'hooks.json');
  fs.mkdirSync(agentsDir, { recursive: true });
  const priorText = fs.existsSync(hooksPath) ? fs.readFileSync(hooksPath, 'utf8') : '';
  let prior = {};
  if (priorText.trim()) {
    try { prior = JSON.parse(priorText); } catch (e) { throw new Error(`Existing .agents/hooks.json is invalid JSON; refusing to overwrite it: ${e.message}`); }
  }
  const rest = { ...prior };
  delete rest['agybot-v7'];
  const next = { ...rest, 'agybot-v8': managedHooksDefinition(root) }, nextText = JSON.stringify(next, null, 2) + '\n';
  if (nextText !== priorText) {
    if (priorText) { const bdir = path.join(root, '.agy-backups', 'rules'); fs.mkdirSync(bdir, { recursive: true }); fs.writeFileSync(path.join(bdir, `hooks.json.before-agybot-v8-${timestamp()}.bak`), priorText, 'utf8'); }
    fs.writeFileSync(hooksPath, nextText, 'utf8');
  }
  return { path: hooksPath, changed: nextText !== priorText, preservedKeys: Object.keys(rest).filter(k => k !== 'agybot-v8'), managedKey: 'agybot-v8', version: VERSION };
}

function ensureGitInfoExclude(root) {
  try {
    const gitEntry = path.join(root, '.git');
    if (!fs.existsSync(gitEntry)) return { updated: false };
    let commonGit = gitEntry;
    if (fs.statSync(gitEntry).isFile()) {
      const m = fs.readFileSync(gitEntry, 'utf8').match(/gitdir:\s*(.+)/i);
      if (m) commonGit = path.resolve(root, m[1].trim());
      const comm = path.join(commonGit, 'commondir');
      if (fs.existsSync(comm)) commonGit = path.resolve(commonGit, fs.readFileSync(comm, 'utf8').trim());
    }
    const exPath = path.join(commonGit, 'info', 'exclude');
    fs.mkdirSync(path.dirname(exPath), { recursive: true });
    const prior = fs.existsSync(exPath) ? fs.readFileSync(exPath, 'utf8') : '';
    const existing = new Set(prior.split(/\r?\n/).map(x => x.trim()));
    const entries = ['.slices/', '.agy-vault/', '.agy-backups/', '.scratch/'];
    // Exclude .agents/hooks.json only if it is not already tracked in Git (keeps machine paths out of public PRs)
    const trackedHook = spawnSync('git', ['ls-files', '--error-unmatch', '.agents/hooks.json'], { cwd: root, encoding: 'utf8', windowsHide: true });
    if (trackedHook.status !== 0) entries.push('.agents/hooks.json');
    const missing = entries.filter(x => !existing.has(x));
    if (missing.length) {
      const add = (prior && !prior.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n';
      fs.writeFileSync(exPath, prior + add, 'utf8');
    }
    return { updated: missing.length > 0, added: missing, excludePath: exPath };
  } catch {
    return { updated: false };
  }
}

function bindProject(project, globalRoot, { allowVolatileRuntime = false, enableQualifiedAuto = false } = {}) {
  const root = path.resolve(project);
  const resolvedGlobal = path.resolve(globalRoot);
  const hookScriptInGlobal = path.join(resolvedGlobal, 'scripts', 'antigravity-hook.mjs');
  if (!fs.existsSync(resolvedGlobal) || !fs.existsSync(hookScriptInGlobal)) {
    throw new Error(`GLOBAL_RUNTIME_NOT_FOUND: ${resolvedGlobal} does not contain scripts/antigravity-hook.mjs.`);
  }
  if (!allowVolatileRuntime && isVolatileRuntimePath(resolvedGlobal)) {
    throw new Error(`REFUSING_VOLATILE_GLOBAL_PATH: globalRuntimePath must point to a stable installation (~/.gemini/config/skills/slice-orchestration-governor), never Temp/zip-verify (${resolvedGlobal}).`);
  }
  const slices = path.join(root, '.slices');
  const legacySkill = path.join(root, '.agents', 'skills', 'slice-orchestration-governor');
  const backupRoot = path.join(root, '.agy-backups', 'skills');
  let legacyBackup = null;
  if (fs.existsSync(legacySkill)) {
    if (!isBinding(legacySkill)) {
      fs.mkdirSync(backupRoot, { recursive: true });
      legacyBackup = path.join(backupRoot, `slice-orchestration-governor-legacy-${timestamp()}`);
      fs.renameSync(legacySkill, legacyBackup);
      say(`Cópia local antiga preservada fora do discovery: ${legacyBackup}`, `Legacy local copy preserved outside discovery: ${legacyBackup}`);
    } else {
      rm(legacySkill);
      say(`Shim legado removido (Zero-Shadow ativo): ${legacySkill}`, `Legacy shim removed (Zero-Shadow active): ${legacySkill}`);
    }
  }
  // Remove legacy CWD workarounds (.agents/node.bat, .agents/node.cmd, .agents/.agents) cleanly
  const workaroundBackups = [];
  for (const rel of ['node.bat', 'node.cmd', '.agents']) {
    const lp = path.join(root, '.agents', rel);
    if (fs.existsSync(lp)) {
      const dstDir = path.join(root, '.agy-backups', 'legacy-workarounds');
      fs.mkdirSync(dstDir, { recursive: true });
      const dst = path.join(dstDir, `${rel.replace(/^\./, 'dot_')}.${timestamp()}`);
      fs.renameSync(lp, dst);
      workaroundBackups.push(dst);
    }
  }
  fs.mkdirSync(slices, { recursive: true });
  writeJson(path.join(slices, 'PROJECT_BINDING.json'), {
    schemaVersion: 2,
    bindingMode: 'GLOBAL_CANONICAL_LATEST_APPROVED_INSTALLED',
    zeroLocalShadow: true,
    releaseChannel: 'LATEST_APPROVED_INSTALLED',
    projectRoot: root,
    globalRuntimePath: resolvedGlobal,
    lastKnownGlobalVersion: versionAt(resolvedGlobal) || VERSION,
    boundAt: new Date().toISOString(),
    legacyBackup,
    statePolicy: 'PROJECT_STATE_STAYS_LOCAL',
    protectedLocalState: ['.slices/SLICE_GOVERNOR.json', '.agy-vault', 'AGENTS.md', 'canonical product sources', 'project rules', 'tracking']
  });
  const forwarders = [
    ['agy-hook.mjs', 'antigravity-hook.mjs'],
    ['agybot.mjs', 'agybot.mjs'],
    ['slice-governor.mjs', 'slice-governor.mjs'],
    ['verify-slice-gate.mjs', 'verify-slice-gate.mjs'],
    ['secret-scan.mjs', 'secret-scan.mjs'],
    ['design-lint.mjs', 'design-lint.mjs'],
    ['q.mjs', 'q.mjs']
  ];
  for (const [localName, targetScript] of forwarders) {
    const p = path.join(slices, localName);
    fs.writeFileSync(p, forwarderScript(targetScript), 'utf8');
    try { fs.chmodSync(p, 0o755); } catch {}
  }
  // Gently migrate existing SLICE_GOVERNOR.json metadata without erasing user choices / onboardedAt
  const cfgPath = path.join(slices, 'SLICE_GOVERNOR.json');
  if (fs.existsSync(cfgPath)) {
    const existingCfg = readJson(cfgPath, null);
    if (existingCfg && typeof existingCfg === 'object') {
      existingCfg.governorVersion = VERSION;
      existingCfg.schemaVersion = Math.max(Number(existingCfg.schemaVersion || 0), 12);
      existingCfg.agyBot = existingCfg.agyBot || {};
      existingCfg.agyBot.orchestrationTransport = existingCfg.agyBot.orchestrationTransport || 'NATIVE_SUBAGENTS';
      if (existingCfg.agyBot.autoLearn === undefined) existingCfg.agyBot.autoLearn = (existingCfg.agyBot.humanEscalationPolicy || 'AUTONOMY_FIRST') !== 'OWNER_GUIDED';
      if (!existingCfg.agyBot.autoRepairMaxRounds) existingCfg.agyBot.autoRepairMaxRounds = 3;
      if (existingCfg.agyBot.testIntegrityGuard === undefined) existingCfg.agyBot.testIntegrityGuard = true;
      if (existingCfg.tracking && existingCfg.tracking.autoUpdateChangelog === undefined) {
        existingCfg.tracking.autoUpdateChangelog = (existingCfg.agyBot.humanEscalationPolicy || 'AUTONOMY_FIRST') !== 'OWNER_GUIDED';
      }
      existingCfg.browserTesting = existingCfg.browserTesting || {
        mode: 'CHROME_DEVTOOLS_OR_PLAYWRIGHT',
        preferredEngine: 'CHROME_DEVTOOLS',
        remoteDebuggingUrl: 'chrome://inspect/#remote-debugging',
        chromeRemoteDebuggingConfirmed: false,
        fallbackToPlaywright: true,
        verifierRules: { zeroConsoleErrors: true, viewports: ['1280x720', '390x844'], checkNoOverlap: true, checkReloadPersistence: true }
      };
      if (enableQualifiedAuto) existingCfg.agyBot.swarmActivationPolicy = 'QUALIFIED_AUTO';
      writeJson(cfgPath, existingCfg);
    }
  }
  const bootstrap = ensureAlwaysOnBootstrap(root);
  const hooks = ensureAntigravityHooks(root);
  const gitExclude = ensureGitInfoExclude(root);
  // Mandatory post-bind hook self-check from .agents/ without AGY_GOVERNOR_GLOBAL_PATH override
  const hookAbs = path.join(slices, 'agy-hook.mjs');
  const cleanEnv = { ...process.env };
  delete cleanEnv.AGY_GOVERNOR_GLOBAL_PATH;
  delete cleanEnv.SLICE_GOVERNOR_ROOT;
  delete cleanEnv.AGY_PROJECT_ROOT;
  const selfCheck = spawnSync(process.execPath, [hookAbs, 'stop', '--self-check'], {
    cwd: path.join(root, '.agents'),
    encoding: 'utf8',
    windowsHide: true,
    env: cleanEnv
  });
  if (selfCheck.status !== 0) {
    throw new Error(`POST_BIND_HOOK_SELF_CHECK_FAILED (exit=${selfCheck.status}): ${(selfCheck.stderr || selfCheck.stdout || '').trim()}`);
  }
  say(`Forwarders portáteis instalados em: ${slices} (Zero-Shadow)`, `Portable forwarders installed at: ${slices} (Zero-Shadow)`);
  say(`Hooks Antigravity v8 instalados/ativos em: ${hooks.path}`, `Antigravity v8 hooks installed/enabled at: ${hooks.path}`);
  return { slices, legacySkillRemoved: true, legacyBackup, workaroundBackups, bootstrap, hooks, gitExclude, hookSelfCheckPassed: true };
}

function probe(target, project) {
  const r = spawnSync(process.execPath, [path.join(target, 'scripts', 'agybot.mjs'), 'project-probe'], { cwd: project, encoding: 'utf8', windowsHide: true, env: { ...process.env, AGY_GOVERNOR_GLOBAL_PATH: target } });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}
function explainCommands() {
  say(`\nATALHOS ÚTEIS v${VERSION} (mesmo em Autonomia Total):\n• /agybot status         — estado, lifecycle (greenfield/brownfield), browser e runtime\n• /agybot hawd           — resumo verificado + pendências humanas\n• /agybot todo           — lista/atualiza o TODO ledger automático\n• /agybot record         — registra entrega/fix/deploy fora de slice formal no TODO + CHANGELOG\n• /agybot promote-rule   — salva regra durável em AGENTS.md, DESIGN_TASTE.md ou Vault\n• /agybot doctor         — autodiagnóstico (Git, hooks, browser chrome://inspect/#remote-debugging)\n• /agybot browser-config — ajusta modo Chrome Debugging vs Playwright\n• /agybot learn          — aprendizados automáticos capturados\n• /agybot setup          — altera preferências deste projeto\n• /agybot pause / resume — pausa ou retoma orquestração automática`, `\nUSEFUL SHORTCUTS v${VERSION} (even in Full Autonomy):\n• /agybot status         — state, lifecycle (greenfield/brownfield), browser & runtime\n• /agybot hawd           — What Was Done & pending decisions\n• /agybot todo           — view/update configured TODO ledger\n• /agybot record         — log ad-hoc fix/feature/deploy into TODO + CHANGELOG + audit log\n• /agybot promote-rule   — save durable rule into AGENTS.md, DESIGN_TASTE.md, or Vault\n• /agybot doctor         — full health check (Git, hooks, Chrome remote debugging)\n• /agybot browser-config — configure Chrome Debugging vs Playwright\n• /agybot learn          — view/promote auto-captured learnings\n• /agybot setup          — change project preferences\n• /agybot pause / resume — pause/resume automatic orchestration`);
}

function onboarding(globalRoot, project, { forceReconfigure = false } = {}) {
  const cfgPath = path.join(project, '.slices', 'SLICE_GOVERNOR.json');
  const existing = readJson(cfgPath, null);
  if (existing?.agyBot?.onboardedAt && !forceReconfigure) {
    say(`\nProjeto já configurado (onboardedAt=${existing.agyBot.onboardedAt}). Preferências locais preservadas automaticamente (zero re-onboarding).`, `\nProject already configured (onboardedAt=${existing.agyBot.onboardedAt}). Local preferences preserved (zero re-onboarding).`);
    return Promise.resolve();
  }
  const pr = probe(globalRoot, project);
  const name = pr?.project?.projectName || path.basename(project);
  const rec = pr?.recommendation || { mode: 'PROJECT_LOCAL', path: path.join(project, '.agy-vault'), reason: 'workspace detectado' };
  const vrec = pr?.visualRecommendation || { policy: 'HUMAN_MANUAL', reason: 'conservador' };
  const trec = pr?.trackingRecommendation || { mode: 'GOVERNOR_MANAGED', todoPath: '.slices/TODO.md', checklistPath: '.slices/MASTER_SLICE_CHECKLIST.md', changelogPath: '.slices/CHANGELOG.md' };
  say(`\nProjeto detectado: ${name}. A engine v${VERSION} é global; estas escolhas são salvas localmente e sobrevivem a futuras atualizações.`, `\nProject detected: ${name}. Engine v${VERSION} is global; choices stay local and survive upgrades.`);
  return (async () => {
    const y = (await ask('\nConfigurar este projeto agora? [S/n]: ', '\nConfigure this project now? [Y/n]: ')).trim().toLowerCase();
    if (['n', 'no'].includes(y)) return;
    say('\n1) Decisões: [1] AUTONOMY_FIRST (recomendado) | [2] BALANCED | [3] OWNER_GUIDED', '\n1) Decisions: [1] AUTONOMY_FIRST (recommended) | [2] BALANCED | [3] OWNER_GUIDED');
    const autonomy = { 1: 'AUTONOMY_FIRST', 2: 'BALANCED', 3: 'OWNER_GUIDED' }[pick(await ask('Escolha [1]: ', 'Choose [1]: '), ['1', '2', '3'], '1')];
    say('\n2) Subagentes A/B/C/D: [1] QUALIFIED_AUTO (recomendado) | [2] EXPLICIT_ONLY | [3] ENGINEERING_ALWAYS', '\n2) Risk subagents A/B/C/D: [1] QUALIFIED_AUTO (recommended) | [2] EXPLICIT_ONLY | [3] ENGINEERING_ALWAYS');
    const swarm = { 1: 'QUALIFIED_AUTO', 2: 'EXPLICIT_ONLY', 3: 'ENGINEERING_ALWAYS' }[pick(await ask('Escolha [1]: ', 'Choose [1]: '), ['1', '2', '3'], '1')];
    say(`\n3) Onde guardar a Vault? (Recomendado: ${rec.mode} → ${rec.path})\n[1] Recomendação | [2] .agy-vault local | [3] Pasta global | [4] Caminho custom`, `\n3) Vault location? (Recommended: ${rec.mode} → ${rec.path})\n[1] Recommended | [2] Local .agy-vault | [3] Global folder | [4] Custom`);
    const vc = pick(await ask('Escolha [1]: ', 'Choose [1]: '), ['1', '2', '3', '4'], '1');
    const vaultMode = vc === '1' ? rec.mode : vc === '2' ? 'PROJECT_LOCAL' : vc === '3' ? 'AGY_GLOBAL' : 'CUSTOM';
    const vaultPathArg = vaultMode === 'CUSTOM' ? await ask('Caminho da Vault: ', 'Vault path: ') : null;
    const vDef = vrec.policy === 'HUMAN_MANUAL' ? '1' : vrec.policy === 'HYBRID' ? '2' : '3';
    say(`\n4) Aprovação visual final (Recomendado: ${vrec.policy}): [1] HUMAN_MANUAL | [2] HYBRID | [3] AUTOMATED_FOCUSED`, `\n4) Final visual approval (Recommended: ${vrec.policy}): [1] HUMAN_MANUAL | [2] HYBRID | [3] AUTOMATED_FOCUSED`);
    const visual = { 1: 'HUMAN_MANUAL', 2: 'HYBRID', 3: 'AUTOMATED_FOCUSED' }[pick(await ask(`Escolha [${vDef}]: `, `Choose [${vDef}]: `), ['1', '2', '3'], vDef)];
    const tDef = trec.mode === 'PROJECT_OWN_DOCS' ? '2' : '1';
    say(`\n5) Tracking de Slices / TODO / Changelog (Detectado: ${trec.mode}, checklist=${trec.checklistPath}):\n[1] GOVERNOR_MANAGED (.slices/TODO.md & .slices/MASTER_SLICE_CHECKLIST.md)\n[2] PROJECT_OWN_DOCS (apontar docs já existentes do projeto)`, `\n5) Slice / TODO / Changelog tracking (Detected: ${trec.mode}, checklist=${trec.checklistPath}):\n[1] GOVERNOR_MANAGED\n[2] PROJECT_OWN_DOCS`);
    const tc = pick(await ask(`Escolha [${tDef}]: `, `Choose [${tDef}]: `), ['1', '2'], tDef);
    const trackingMode = tc === '2' ? 'PROJECT_OWN_DOCS' : 'GOVERNOR_MANAGED';
    const bRec = pr?.browserRecommendation || { mode: 'CHROME_DEVTOOLS_OR_PLAYWRIGHT' };
    say(`\n6) Testes em Navegador (Antigravity usa chrome_devtools MCP via chrome://inspect/#remote-debugging, ou Playwright):\n[1] CHROME_DEVTOOLS_OR_PLAYWRIGHT (recomendado: Chrome Debugging + Playwright fallback)\n[2] CHROME_DEVTOOLS (apenas Chrome externo)\n[3] PLAYWRIGHT_HEADLESS (apenas Playwright)\n[4] MANUAL_ONLY`, `\n6) Browser Testing (Antigravity uses chrome_devtools MCP via chrome://inspect/#remote-debugging, or Playwright):\n[1] CHROME_DEVTOOLS_OR_PLAYWRIGHT (recommended)\n[2] CHROME_DEVTOOLS (external Chrome only)\n[3] PLAYWRIGHT_HEADLESS\n[4] MANUAL_ONLY`);
    const bc = pick(await ask('Escolha [1]: ', 'Choose [1]: '), ['1', '2', '3', '4'], '1');
    const browserMode = { 1: 'CHROME_DEVTOOLS_OR_PLAYWRIGHT', 2: 'CHROME_DEVTOOLS', 3: 'PLAYWRIGHT_HEADLESS', 4: 'MANUAL_ONLY' }[bc] || bRec.mode;
    const args = [path.join(globalRoot, 'scripts', 'agybot.mjs'), 'setup', '--autonomy', autonomy, '--swarm', swarm, '--transport', 'NATIVE_SUBAGENTS', '--vault-mode', vaultMode, '--visual', visual, '--tracking-mode', trackingMode, '--browser-mode', browserMode];
    if (trackingMode === 'PROJECT_OWN_DOCS') {
      const cp = (await ask(`Checklist/Roadmap [${trec.checklistPath}]: `, `Checklist/Roadmap [${trec.checklistPath}]: `)).trim() || trec.checklistPath;
      const tp = (await ask(`TODO [${trec.todoPath}]: `, `TODO [${trec.todoPath}]: `)).trim() || trec.todoPath;
      args.push('--checklist-path', cp, '--todo-path', tp);
    }
    if (vaultPathArg) args.push('--vault', vaultPathArg);
    const r = spawnSync(process.execPath, args, { cwd: project, encoding: 'utf8', windowsHide: true, env: { ...process.env, AGY_RUNTIME_SOURCE: 'GLOBAL_CANONICAL', AGY_GOVERNOR_GLOBAL_PATH: globalRoot } });
    if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'setup failed').trim());
    console.log(r.stdout || '');
  })();
}

const a = parseArgs(process.argv.slice(2));
try {
  const home = a.home ? path.resolve(String(a.home)) : os.homedir();
  const gTarget = globalTarget(home);
  const globalOnly = Boolean(a['global-only'] || a.global);
  const explicitProject = globalOnly ? null : (a['bind-project'] ? path.resolve(String(a['bind-project'])) : gitRoot());
  const nonInteractive = Boolean(a['non-interactive'] || globalOnly || a['bind-only'] || a['bind-project']);
  const allowVolatileRuntime = Boolean(a['allow-volatile-runtime']);
  const enableQualifiedAuto = Boolean(a['enable-qualified-auto']);
  if (!nonInteractive) {
    say(`\nAGY BOT v${VERSION} — INSTALAÇÃO GUIADA (ZERO-SHADOW)`, `\nAGY BOT v${VERSION} — GUIDED INSTALL (ZERO-SHADOW)`);
    verify();
    if (explicitProject) {
      say('\n1) Instalar/atualizar engine global + vincular este projeto (recomendado)\n2) Somente engine global\n3) Somente vincular este projeto', '\n1) Install/update global + bind project (recommended)\n2) Global engine only\n3) Bind project only');
      const c = pick(await ask('Escolha [1]: ', 'Choose [1]: '), ['1', '2', '3'], '1');
      if (c === '1' || c === '2') installGlobal(gTarget, { home });
      if (c === '1' || c === '3') { if (!versionAt(gTarget)) throw new Error(`Engine global não encontrada em ${gTarget}`); bindProject(explicitProject, gTarget, { allowVolatileRuntime, enableQualifiedAuto }); }
      if (c === '1') await onboarding(gTarget, explicitProject, { forceReconfigure: Boolean(a.reconfigure) });
    } else {
      installGlobal(gTarget, { home });
    }
    explainCommands();
  } else {
    verify();
    if (!a['bind-only']) installGlobal(gTarget, { home, skipSelfTest: Boolean(a['skip-self-test']) });
    if (explicitProject) {
      if (!versionAt(gTarget)) throw new Error(`Global canonical runtime missing at ${gTarget}`);
      bindProject(explicitProject, gTarget, { allowVolatileRuntime, enableQualifiedAuto });
    }
    console.log(JSON.stringify({ status: 'PASS', version: VERSION, globalRuntime: gTarget, globalVersion: versionAt(gTarget), project: explicitProject || null, bound: Boolean(explicitProject), zeroLocalShadow: true, policy: 'GLOBAL_CANONICAL_LATEST_APPROVED_INSTALLED' }, null, 2));
  }
} catch (e) { console.error(e.stack || e); process.exitCode = 1; } finally { rl.close(); }
