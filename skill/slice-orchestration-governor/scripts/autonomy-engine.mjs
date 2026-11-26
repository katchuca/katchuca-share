#!/usr/bin/env node
/**
 * Autonomy Engine helpers for Slice Orchestration Governor v8.3.0.
 * Handles language-agnostic intent classification, environment doctor,
 * Layer-2 test/supply-chain integrity checks, autonomous learning capture,
 * automatic TODO/CHANGELOG/MASTER tracking, Greenfield/Brownfield discovery,
 * constitution/taste/rule promotion, parallel scope checks, and browser readiness.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const sha = s => crypto.createHash('sha256').update(String(s || '')).digest('hex');
const now = () => new Date().toISOString();

function slug(s) {
  return String(s).trim().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function readJsonSafe(p, fallback = null) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeTextAtomic(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, p);
}

function writeJsonAtomic(p, obj) {
  writeTextAtomic(p, JSON.stringify(obj, null, 2) + '\n');
}

/**
 * Language-agnostic + multilingual intent signal detector.
 * Explicit READ_ONLY and pure informational questions stay ZERO; natural work instructions
 * in any human language default to SCOPED under AUTONOMY_FIRST/BALANCED.
 */
export function classifyDirectiveSignals(text, args = {}, autonomyPolicy = 'AUTONOMY_FIRST') {
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();
  const explicitIntent = String(args.intent || '').trim().toUpperCase();
  const directiveFlag = Boolean(args.directive);
  const declaredAuth = directiveFlag || /(?:MODE\s*=\s*EXECUTE|DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|GIT_COMMIT\s*=\s*(?:YES|TRUE|ALLOWED)|VPS_DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|EXECUTE\s*=\s*YES|AUTORIZADO\s*=\s*SIM)/i.test(raw);
  const forcedMutable = ['IMPLEMENTATION', 'REFINEMENT', 'EVIDENCE_CLOSURE', 'CONTROL_PLANE_MAINTENANCE', 'CONTINUATION'].includes(explicitIntent) || declaredAuth;
  const forcedReadOnly = explicitIntent === 'STRICT_READ_ONLY_DISCOVERY';

  const lines = raw.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const directiveLines = lines.filter(line => !/^(```|>|[-*]\s*`?[^:=]{1,80}`?\s*[:=]\s*[^=]+$)/.test(line));
  const joined = directiveLines.join('\n').toLowerCase();

  const WB_S = '(?<![\\p{L}\\p{N}_])';
  const WB_E = '(?![\\p{L}\\p{N}_])';
  const uTest = (body, str) => new RegExp(body, 'iu').test(str);

  // Explicit read-only guards (multilingual)
  const readOnlyKeyLine = lines.some(line =>
    /^\s*(?:mode|intent|request_intent|request-intent)\s*[:=]\s*(?:strict[_ -]?read[_ -]?only(?:_discovery)?|read[_ -]?only(?:_discovery)?)\s*$/i.test(line)
    || /^\s*(?:strict[_ -]?read[_ -]?only(?:_discovery)?|read[_ -]?only(?:_discovery)?)\s*[:=]\s*(?:yes|true|required)\s*$/i.test(line)
    || /^\s*(?:read[- ]?only|somente leitura|apenas leitura|solo lectura|lecture seule|nur lesen|sola lettura|estritamente em modo leitura|strict read[- ]?only)[.!]?\s*$/i.test(line)
  );
  const readOnlyPhrase = uTest(`${WB_S}(?:read[- ]?only|somente\\s+leitura|apenas\\s+leitura|modo\\s+leitura|solo\\s+lectura|lecture\\s+seule|nur\\s+lesen|sola\\s+lettura|without\\s+(?:editing|modifying|changing|writing)|write\\s+nothing|no\\s+code\\s+changes|sem\\s+(?:editar|alterar|modificar|mudar\\s+c[oó]digo))${WB_E}`, raw)
    || /(?:読み取り専用|只读|읽기\s*전용)/.test(raw)
    || uTest(`${WB_S}(?:n[aã]o\\s+(?:quero\\s+que\\s+(?:vc|voc[eê]|o\\s+agente)?\\s*)?(?:edite|altere|modifique|implemente|toque|mude)|do\\s+not\\s+(?:edit|modify|change|write|touch)|don't\\s+(?:edit|modify|change|write|touch)|no\\s+(?:edites|modifiques|cambies|toques)|ne\\s+modifie\\s+pas|nicht\\s+[äa]ndern|no\\s+writes?)${WB_E}`, raw);
  const readOnlyDirective = forcedReadOnly || (!forcedMutable && (readOnlyKeyLine || readOnlyPhrase));

  // Action & defect-fix signals across Latin (Unicode-aware) + CJK + Cyrillic/Hangul scripts
  const latinActionBody = `${WB_S}(?:implement\\w*|corrij\\w*|corrig\\w*|consert\\w*|ajust\\w*|arrum\\w*|melhor\\w*|resolv\\w*|alter\\w*|mud\\w*|refator\\w*|refactor\\w*|crie|criar|create\\w*|adicion\\w*|add|remov\\w*|delet\\w*|exclu\\w*|apagu\\w*|habilit\\w*|desabilit\\w*|ativ\\w*|desativ\\w*|atualiz\\w*|updat\\w*|patch|hardening|fix\\w*|build|make|style|animat\\w*|modif\\w*|edit\\w*|chang\\w*|migr(?:a|ar|ate|\\w*)|arregl\\w*|cambi\\w*|crea\\w*|añad\\w*|agreg\\w*|elimin\\w*|quit\\w*|repar\\w*|ajout\\w*|mett\\w*|beheb\\w*|korrigier\\w*|[äa]nder\\w*|erstell\\w*|hinzuf[üu]g\\w*|aggiust\\w*|coloque|coloca|bota|bote|retire|tire|deploy|launch|run\\s+tests|run\\s+typecheck|run\\s+playwright|run\\s+vitest|execute\\s+os\\s+testes|rode\\s+os\\s+testes|execute\\s+o\\s+batch|verify|valide|validar|testar)${WB_E}`;
  const ptNaturalBody = `${WB_S}(?:pode\\s+(?:come[cç]ar|fazer|executar|aplicar|seguir|rodar|ir|mandar|prosseguir)|fa[cç]a\\s+(?:o|a|os|as|um|uma|isso|deploy|ajuste)${WB_E}|faz\\s+(?:o|a|isso|um|deploy)${WB_E}|(?:vc|voc[eê])\\s+consegue\\s+(?:corrigir|consertar|ajustar|arrumar|fazer|implementar|resolver|rodar|come[cç]ar|criar|mudar|alterar)|manda\\s+ver|bora|n[aã]o\\s+quero|nao\\s+quero)${WB_E}`;
  const enNaturalBody = `${WB_S}(?:go\\s+ahead|let's\\s+(?:go|do|start|fix)|(?:can|could)\\s+you\\s+(?:fix|build|add|change|update|make|remove|deploy)|please\\s+(?:fix|build|add|change|update|deploy))${WB_E}`;
  const defectSymptomBody = `${WB_S}(?:est[aá]\\s+sem|esta\\s+sem|n[aã]o\\s+funciona|nao\\s+funciona|quebrad[oa]|faltando|missing|broken|not\\s+working|doesn't\\s+work|does\\s+not\\s+work|no\\s+funciona|est[aá]\\s+roto|ne\\s+marche\\s+pas|funktioniert\\s+nicht|non\\s+funziona)${WB_E}`;
  const cjkCyrActionRe = /(?:直して|修正|実装|変更|追加|作成|削除|更新|動かない|直し|やって|修复|修改|实现|添加|创建|删除|更新|不工作|报错|고쳐|수정|구현|추가|변경|작동|исправ|сделай|обнови|не\s+работает)/;
  const continuationCue = uTest(`${WB_S}(?:continue|continua|continuar|prossiga|prosseguir|segue|go\\s+on|proceed|resume|adelante|empieza|sigue|vas-y|continuez|los\\s+geht's|weiter)${WB_E}`, raw)
    || /(?:続けて|继续|계속)/.test(raw)
    || uTest(`${WB_S}(?:pode\\s+(?:come[cç]ar|seguir|continuar)|go\\s+ahead)${WB_E}`, raw);

  const hasExplicitAction = forcedMutable || uTest(latinActionBody, raw) || uTest(ptNaturalBody, raw) || uTest(enNaturalBody, raw) || cjkCyrActionRe.test(raw);
  const hasDefectSymptom = uTest(defectSymptomBody, raw);
  const hasMultiStepDirective = lines.filter(l => /^\s*(?:\d+[.)]|[-*])\s+\S+/.test(l)).length >= 1 && !/^\s*(?:\?|¿)/.test(raw);

  // Pure informational question guard (e.g., "Por que dá erro X?", "What is Y?", "Explique como funciona...")
  const startsInterrogative = /^(?:qual|quais|como|por\s+que|porque|o\s+que|quem|onde|quando|explique|explain|what|why|how|when|where|who|which|describe|tell\s+me|cu[aá]l|c[oó]mo|por\s+qu[eé]|qu[eé]\s+es|explica|pourquoi|comment|qu'est|warum|wie|was\s+ist|perch[eé]|cosa\s+[eè]|¿|どう|なぜ|为什么|什么|왜|뭐)/i.test(raw);
  const endsQuestionMark = /[?？]\s*$/.test(raw);
  const pureQuestionCue = !forcedMutable && !hasExplicitAction && !continuationCue && (
    (endsQuestionMark && (!hasDefectSymptom || startsInterrogative))
    || (startsInterrogative && !hasMultiStepDirective)
  );

  const universalAutonomyFallback = !forcedMutable && !readOnlyDirective && !pureQuestionCue
    && String(autonomyPolicy || 'AUTONOMY_FIRST').toUpperCase() !== 'OWNER_GUIDED';

  const implementationDirective = forcedMutable || (!readOnlyDirective && (hasExplicitAction || hasDefectSymptom || universalAutonomyFallback));
  const deployOnly = /(?:DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|VPS_DEPLOY\s*=\s*(?:YES|TRUE|ALLOWED)|GIT_COMMIT\s*=\s*(?:YES|TRUE|ALLOWED))/i.test(raw)
    && !/(implem|corrig|consert|ajust|fix|feature|slice|migra|refator|crie|create|patch|component|schema|route|endpoint|page|tela|ui)/i.test(lower);

  return {
    explicitIntent,
    forcedMutable,
    forcedReadOnly,
    declaredAuth,
    readOnlyDirective,
    continuationCue,
    hasExplicitAction,
    hasDefectSymptom,
    pureQuestionCue,
    universalAutonomyFallback,
    implementationDirective,
    deployOnly,
    directiveText: joined
  };
}

/**
 * Resolves Coordinator conversation ID even when `intake --directive` runs in a clean terminal shell
 * without AGY_CURRENT_CONVERSATION_ID or `--coordinator`.
 */
export function resolveCoordinatorForHookSync(hookStatePath, explicitCid = '', { allowLatestFallback = false } = {}) {
  const direct = String(explicitCid || '').trim();
  if (direct) return { cid: direct, via: 'EXPLICIT' };
  if (!allowLatestFallback) return { cid: '', via: 'NONE' };
  const hs = readJsonSafe(hookStatePath, null);
  const convs = hs?.conversations && typeof hs.conversations === 'object' ? hs.conversations : {};
  const candidates = Object.entries(convs)
    .filter(([, v]) => v && (!v.role || String(v.role).toUpperCase() === 'COORDINATOR'))
    .sort(([, a], [, b]) => String(b.lastPromptAt || '').localeCompare(String(a.lastPromptAt || '')));
  if (!candidates.length) return { cid: '', via: 'NONE' };
  return { cid: candidates[0][0], via: 'LATEST_ACTIVE_COORDINATOR' };
}

/**
 * Inspects git diffs and changed files for Layer-2 deterministic anti-cheating & supply-chain risks:
 * skipped tests, reduced assertions, modified gate/lint configs, or dependencies without lockfile updates.
 */
export function inspectTestAndSupplyIntegrity(root, { base = 'HEAD', allowedConfig = [] } = {}) {
  const allowedSet = new Set((allowedConfig || []).map(x => String(x).replaceAll('\\', '/').trim()).filter(Boolean));
  const statusRes = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (statusRes.status !== 0) {
    return { ok: true, gitAvailable: false, skippedReason: 'NOT_A_GIT_REPO', findings: [], changedFiles: [] };
  }
  const changedFiles = String(statusRes.stdout || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(l => l.slice(3).trim().replace(/^"|"$/g, '').replaceAll('\\', '/'));

  if (!changedFiles.length) {
    return { ok: true, gitAvailable: true, findings: [], changedFiles: [] };
  }

  const headCheck = spawnSync('git', ['rev-parse', '--verify', base], { cwd: root, encoding: 'utf8', windowsHide: true });
  const diffArgs = headCheck.status === 0 ? ['diff', base, '--unified=0'] : ['diff', '--cached', '--unified=0'];
  const diffRes = spawnSync('git', diffArgs, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  const rawDiff = String(diffRes.stdout || '');

  const findings = [];
  const fileSections = rawDiff.split(/^diff --git /m).slice(1);
  const isTestFile = f => /\.(?:test|spec)\.[cm]?[jt]sx?$|__tests__\//i.test(f) || /(?:^|\/)test_.*\.py$|_test\.py$/i.test(f);
  const isConfigOrGate = f => /^(?:\.agents\/hooks\.json|\.slices\/SLICE_GOVERNOR\.json|eslint.*|vitest\.config.*|jest\.config.*|playwright\.config.*|tsconfig.*\.json|\.eslintrc.*)$/i.test(path.basename(f)) || /^\.agents\/hooks\.json$/i.test(f);
  const lockFiles = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'npm-shrinkwrap.json']);
  const hasLockChange = changedFiles.some(f => lockFiles.has(path.basename(f)));
  let packageDepsAdded = false;

  for (const sec of fileSections) {
    const headerMatch = sec.match(/^a\/(.+?)\s+b\/(.+?)\r?\n/);
    const file = (headerMatch ? headerMatch[2] : '').replaceAll('\\', '/').trim();
    if (!file) continue;

    if (isConfigOrGate(file) && !allowedSet.has(file)) {
      findings.push({
        code: 'GATE_OR_CONFIG_MODIFIED',
        severity: 'HIGH',
        file,
        message: `Test/lint/gate configuration '${file}' was modified without explicit --allowed-config authorization.`
      });
    }

    const lines = sec.split(/\r?\n/);
    let addedAssertions = 0;
    let removedAssertions = 0;
    let pkgAddedDeps = false;

    for (const line of lines) {
      if (line.startsWith('+++') || line.startsWith('---')) continue;
      if (line.startsWith('+')) {
        const body = line.slice(1);
        if (isTestFile(file) && /\b(?:it|test|describe)\.(?:skip|only|todo)\s*\(|\b(?:xit|xtest|xdescribe|fit|fdescribe)\s*\(|@unittest\.skip|pytest\.mark\.skip/.test(body)) {
          findings.push({
            code: 'TEST_SKIP_OR_ONLY_ADDED',
            severity: 'BLOCKER',
            file,
            message: `Added skip/only/todo modifier in '${file}': ${body.trim().slice(0, 100)}`
          });
        }
        if (/\beslint-disable\b|@ts-ignore|@ts-expect-error/.test(body) && isTestFile(file)) {
          findings.push({
            code: 'LINT_OR_TS_SUPPRESSION_IN_TEST',
            severity: 'HIGH',
            file,
            message: `Type/lint suppression added inside test '${file}'.`
          });
        }
        if (isTestFile(file) && /\b(?:expect|assert|should)\b/.test(body)) addedAssertions++;
      } else if (line.startsWith('-')) {
        const body = line.slice(1);
        if (isTestFile(file) && /\b(?:expect|assert|should)\b/.test(body)) removedAssertions++;
      }
    }

    if (isTestFile(file) && removedAssertions > addedAssertions) {
      findings.push({
        code: 'ASSERTIONS_REDUCED_IN_MODIFIED_TESTS',
        severity: 'BLOCKER',
        file,
        message: `Modified test '${file}' removed ${removedAssertions} assertion(s) while adding ${addedAssertions}.`
      });
    }
    if (path.basename(file) === 'package.json') {
      const curPkg = readJsonSafe(path.join(root, file), null);
      let prevPkg = null;
      if (headCheck.status === 0) {
        const showPkg = spawnSync('git', ['show', `${base}:${file}`], { cwd: root, encoding: 'utf8', windowsHide: true });
        if (showPkg.status === 0) {
          try { prevPkg = JSON.parse(showPkg.stdout); } catch {}
        }
      }
      const depGroups = ['dependencies', 'devDependencies', 'optionalDependencies'];
      const oldDeps = Object.assign({}, ...depGroups.map(g => prevPkg?.[g] || {}));
      const newDeps = Object.assign({}, ...depGroups.map(g => curPkg?.[g] || {}));
      const addedKeys = Object.keys(newDeps).filter(k => !(k in oldDeps));
      if (addedKeys.length) packageDepsAdded = true;
    }
  }

  // Also scan untracked new test files (not yet in git diff)
  for (const file of changedFiles) {
    if (!isTestFile(file)) continue;
    const abs = path.join(root, file);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    try {
      const txt = fs.readFileSync(abs, 'utf8');
      if (/\b(?:it|test|describe)\.(?:skip|only|todo)\s*\(|\b(?:xit|xtest|xdescribe)\s*\(/.test(txt) && !findings.some(f => f.file === file && f.code === 'TEST_SKIP_OR_ONLY_ADDED')) {
        findings.push({
          code: 'TEST_SKIP_OR_ONLY_ADDED',
          severity: 'BLOCKER',
          file,
          message: `Test file '${file}' contains .skip/.only/.todo or xit/xdescribe.`
        });
      }
    } catch {}
  }

  if (packageDepsAdded && !hasLockChange) {
    findings.push({
      code: 'UNPINNED_DEPENDENCY_WITHOUT_LOCKFILE',
      severity: 'HIGH',
      file: 'package.json',
      message: 'package.json dependency entries changed without updating package-lock.json/pnpm-lock.yaml/yarn.lock (anti-slop-squatting guard).'
    });
  }

  return {
    ok: findings.length === 0,
    gitAvailable: true,
    changedFilesCount: changedFiles.length,
    findings
  };
}

/**
 * Checks pairwise write-scope disjointness across parallel workers or swarm modules.
 */
export function checkScopeOverlaps(scopesArg = '') {
  const workers = [];
  const raw = String(scopesArg || '').trim();
  if (!raw) return { ok: true, workers: [], conflicts: [] };

  if (raw.startsWith('[') || raw.startsWith('{')) {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([worker, paths]) => ({ worker, paths }));
    for (const item of list) {
      const paths = (Array.isArray(item.paths) ? item.paths : String(item.paths || '').split(','))
        .map(p => String(p).trim().replaceAll('\\', '/').replace(/\/+$/, '')).filter(Boolean);
      workers.push({ worker: String(item.worker || item.name), paths });
    }
  } else {
    for (const chunk of raw.split(';').map(x => x.trim()).filter(Boolean)) {
      const idx = chunk.indexOf(':');
      if (idx <= 0) continue;
      const worker = chunk.slice(0, idx).trim();
      const paths = chunk.slice(idx + 1).split(',').map(p => p.trim().replaceAll('\\', '/').replace(/\/+$/, '')).filter(Boolean);
      workers.push({ worker, paths });
    }
  }

  const overlaps = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
  const conflicts = [];
  for (let i = 0; i < workers.length; i++) {
    for (let j = i + 1; j < workers.length; j++) {
      for (const pa of workers[i].paths) {
        for (const pb of workers[j].paths) {
          if (overlaps(pa, pb)) {
            conflicts.push({ workerA: workers[i].worker, pathA: pa, workerB: workers[j].worker, pathB: pb });
          }
        }
      }
    }
  }
  return { ok: conflicts.length === 0, workers, conflicts };
}

/**
 * Automatically aggregates FRICTION_LOG.jsonl + q LOOP_DETECTED queue into .slices/AUTO_LEARNINGS.json
 * and .agy-vault/learnings/, optionally promoting safe rules without waiting for manual initiative.
 */
export function runAutoLearn({ root, slicesDir, vaultDir, promoteSafe = false, recordText = '', autoLearnEnabled = true } = {}) {
  const autoPath = path.join(slicesDir, 'AUTO_LEARNINGS.json');
  const state = readJsonSafe(autoPath, { schemaVersion: 1, updatedAt: null, items: [] }) || { schemaVersion: 1, updatedAt: null, items: [] };
  state.items = Array.isArray(state.items) ? state.items : [];

  const buckets = new Map();
  const addSignal = (key, title, category, ruleHint, countBoost = 1) => {
    const fp = sha(key).slice(0, 16);
    const cur = buckets.get(fp) || { fingerprint: fp, key, title, category, ruleHint, count: 0 };
    cur.count += countBoost;
    buckets.set(fp, cur);
  };

  if (recordText && String(recordText).trim()) {
    addSignal(`manual:${String(recordText).trim()}`, String(recordText).trim(), 'OWNER_OR_SESSION_LESSON', String(recordText).trim(), 2);
  }

  const frictionPath = path.join(slicesDir, 'FRICTION_LOG.jsonl');
  if (fs.existsSync(frictionPath)) {
    const lines = fs.readFileSync(frictionPath, 'utf8').split(/\r?\n/).filter(Boolean).slice(-200);
    for (const l of lines) {
      try {
        const row = JSON.parse(l);
        const normRule = String(row.rule || 'unknown').replace(/['"][^'"]{1,60}['"]/g, '<arg>').replace(/\s+/g, ' ').slice(0, 100);
        addSignal(`friction:${row.tool || 'tool'}:${normRule}`, `Recurring hook friction (${row.tool || 'tool'}): ${normRule}`, 'HOOK_FRICTION', `Respect ${row.tool || 'tool'} precondition: ${normRule}`, 1);
      } catch {}
    }
  }

  const qQueuePath = path.join(slicesDir, 'logs', 'AUTO_LEARNINGS_QUEUE.jsonl');
  if (fs.existsSync(qQueuePath)) {
    const lines = fs.readFileSync(qQueuePath, 'utf8').split(/\r?\n/).filter(Boolean).slice(-100);
    for (const l of lines) {
      try {
        const row = JSON.parse(l);
        const cmdShort = String(row.cmd || '').slice(0, 80);
        addSignal(`loop:${row.tailHash || cmdShort}`, `Repeated check failure (${row.type || 'LOOP_DETECTED'}): ${cmdShort}`, 'LOOP_FAILURE', `Investigate root cause and inspect full log before retrying '${cmdShort}'.`, Number(row.count || 2));
      } catch {}
    }
  }

  let newCaptured = 0;
  const learningsDir = path.join(vaultDir, 'learnings');
  for (const sig of buckets.values()) {
    if (sig.count < 2) continue;
    const existing = state.items.find(x => x.fingerprint === sig.fingerprint);
    if (existing) {
      existing.count = Math.max(Number(existing.count || 0), sig.count);
      existing.lastSeenAt = now();
      continue;
    }
    const lid = `LRN-${slug(sig.fingerprint)}`;
    const mdRel = `${slug(lid)}.md`;
    const mdAbs = path.join(learningsDir, mdRel);
    writeTextAtomic(mdAbs, [
      '---',
      `id: ${lid}`,
      'type: auto-learning',
      `category: ${sig.category}`,
      `occurrences: ${sig.count}`,
      `createdAt: ${now()}`,
      '---',
      '',
      `# ${sig.title}`,
      '',
      `**Recommended deterministic gate / rule:** ${sig.ruleHint}`,
      '',
      '> Automatically captured by Agy Bot v8.3.0 (Zero Manual Initiative).',
      ''
    ].join('\n'));
    state.items.push({
      id: lid,
      fingerprint: sig.fingerprint,
      category: sig.category,
      title: sig.title,
      count: sig.count,
      recommendedRule: sig.ruleHint,
      status: 'CAPTURED',
      vaultFile: path.relative(root, mdAbs).replaceAll('\\', '/'),
      createdAt: now(),
      lastSeenAt: now(),
      promotedAt: null
    });
    newCaptured++;
  }

  let promoted = 0;
  if (promoteSafe && autoLearnEnabled) {
    const pending = state.items.filter(x => x.status === 'CAPTURED');
    if (pending.length) {
      for (const item of pending) {
        item.status = 'PROMOTED';
        item.promotedAt = now();
        promoted++;
      }
      // Only write .agents/rules/agybot-learned.md when .agents/rules already exists so clean repos stay clean
      const rulesDir = path.join(root, '.agents', 'rules');
      if (fs.existsSync(rulesDir)) {
        const ruleFile = path.join(rulesDir, 'agybot-learned.md');
        const allPromoted = state.items.filter(x => x.status === 'PROMOTED');
        writeTextAtomic(ruleFile, [
          '# Agy Bot — Learned Workspace Rules (Auto-Captured)',
          '',
          ...allPromoted.map(x => `- [${x.id}] (${x.category}, x${x.count}): ${x.recommendedRule}`),
          ''
        ].join('\n'));
      }
    }
  }

  if (state.items.length) {
    const idxFile = path.join(vaultDir, 'indexes', 'LEARNINGS_INDEX.md');
    writeTextAtomic(idxFile, [
      '# Learnings Index',
      '',
      'Automatically captured & deduplicated learnings (Agy Bot v8.3.0).',
      '',
      ...state.items.map(x => `- [${x.id}](../learnings/${slug(x.id)}.md) — **${x.status}** (x${x.count}) — ${x.title}`),
      ''
    ].join('\n'));
  }

  state.updatedAt = now();
  writeJsonAtomic(autoPath, state);
  const unpromotedCount = state.items.filter(x => x.status !== 'PROMOTED').length;
  return {
    ok: true,
    totalItems: state.items.length,
    newCaptured,
    promoted,
    unpromotedCount,
    stateFile: autoPath,
    items: state.items.slice(-10)
  };
}

/**
 * Checks host runtime tools, hook health, Zero-Shadow compliance, browser readiness,
 * and pending human vs agent-fixable items in one deterministic call.
 */
export function runEnvironmentDoctor({ root, slicesDir, globalRoot, cfgObj, runtimeSnapshot, hookVersion }) {
  const cmdOk = (cmd, args = ['--version']) => {
    try {
      const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 4000 });
      return r.status === 0 ? (r.stdout || r.stderr || 'ok').trim().split(/\r?\n/)[0].slice(0, 80) : null;
    } catch {
      return null;
    }
  };

  const gitVer = cmdOk('git', ['--version']);
  const pythonVer = cmdOk('python', ['--version']) || cmdOk('python3', ['--version']);
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); } catch {}
  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const depNames = Object.keys(allDeps);
  const playwrightInstalled = depNames.some(x => x === '@playwright/test' || x === 'playwright')
    || fs.existsSync(path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright'));
  const webSignals = depNames.some(x => ['next', 'react', 'vue', '@angular/core', 'svelte', 'astro', 'vite'].includes(x))
    || fs.existsSync(path.join(root, 'index.html'))
    || fs.existsSync(path.join(root, 'src', 'app'));

  const hookAbs = path.join(slicesDir, 'agy-hook.mjs');
  let hookSelfCheck = false;
  if (fs.existsSync(hookAbs)) {
    const cleanEnv = { ...process.env };
    delete cleanEnv.AGY_GOVERNOR_GLOBAL_PATH;
    const sc = spawnSync(process.execPath, [hookAbs, 'stop', '--self-check'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 5000, env: cleanEnv });
    hookSelfCheck = sc.status === 0;
  }

  const hooksJson = readJsonSafe(path.join(root, '.agents', 'hooks.json'), null);
  const browserCfg = cfgObj?.browserTesting || {};
  const chromeConfirmed = Boolean(browserCfg.chromeRemoteDebuggingConfirmed);

  const autoFixable = [];
  const humanActions = [];
  if (!runtimeSnapshot?.safe) autoFixable.push('Run install.mjs --bind-only --bind-project to repair Zero-Shadow binding.');
  if (!hookSelfCheck) autoFixable.push('Run install.mjs --bind-only --bind-project to repair .slices/agy-hook.mjs.');
  if (webSignals && !playwrightInstalled && !chromeConfirmed) {
    humanActions.push({
      key: 'CHROME_REMOTE_DEBUGGING',
      instruction: 'Open chrome://inspect/#remote-debugging in Google Chrome, enable Remote debugging, and click Allow when Antigravity connects (or run agybot browser-config to set preference).'
    });
  }

  const ok = Boolean(runtimeSnapshot?.safe && hookSelfCheck && hooksJson?.['agybot-v8']?.enabled !== false);
  return {
    ok,
    governorVersion: hookVersion,
    projectRoot: root,
    autonomyMode: cfgObj?.agyBot?.humanEscalationPolicy || 'AUTONOMY_FIRST',
    swarmPolicy: cfgObj?.agyBot?.swarmActivationPolicy || 'QUALIFIED_AUTO',
    tools: {
      node: process.version,
      git: gitVer || 'MISSING',
      python: pythonVer || 'NOT_FOUND',
      testRunners: depNames.filter(d => ['vitest', 'jest', '@playwright/test', 'playwright', 'cypress', 'mocha'].includes(d))
    },
    governance: {
      zeroShadowSafe: Boolean(runtimeSnapshot?.safe),
      globalRuntimePath: globalRoot,
      hooksInstalled: Boolean(hooksJson?.['agybot-v8']),
      hookSelfCheckPassed: hookSelfCheck,
      onboarded: Boolean(cfgObj?.agyBot?.onboardedAt)
    },
    browser: {
      webSurfaceDetected: webSignals,
      playwrightInstalled,
      configuredMode: browserCfg.mode || 'CHROME_DEVTOOLS_OR_PLAYWRIGHT',
      preferredEngine: browserCfg.preferredEngine || 'CHROME_DEVTOOLS',
      chromeRemoteDebuggingUrl: 'chrome://inspect/#remote-debugging',
      chromeRemoteDebuggingConfirmed: chromeConfirmed,
      fallbackToPlaywright: browserCfg.fallbackToPlaywright !== false
    },
    autoFixable,
    humanActions
  };
}

/**
 * Replaces the first marked block and collapses any accidental duplicate copies.
 */
export function dedupeProjectionBlocks(markdownText, startMarker, endMarker, replacementBlock) {
  const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc(startMarker)}[\\s\\S]*?${esc(endMarker)}`, 'g');
  let text = String(markdownText || '');
  let replaced = false;
  if (re.test(text)) {
    text = text.replace(re, () => {
      if (!replaced) {
        replaced = true;
        return replacementBlock;
      }
      return '';
    });
    text = text.replace(/\n{3,}/g, '\n\n');
  } else {
    text = `${text.trimEnd()}\n\n${replacementBlock}\n`;
  }
  return text.endsWith('\n') ? text : `${text}\n`;
}

/**
 * Resolves configured TODO / checklist / changelog paths and automatic flags.
 */
export function resolveTrackingConfig(root, cfgObj) {
  const tr = cfgObj?.tracking || {};
  const ownerGuided = String(cfgObj?.agyBot?.humanEscalationPolicy || '').toUpperCase() === 'OWNER_GUIDED';
  return {
    mode: String(tr.mode || 'GOVERNOR_MANAGED').toUpperCase(),
    todoPath: path.resolve(root, String(tr.todoPath || '.slices/TODO.md')),
    checklistPath: path.resolve(root, String(tr.checklistPath || '.slices/MASTER_SLICE_CHECKLIST.md')),
    changelogPath: path.resolve(root, String(tr.changelogPath || '.slices/CHANGELOG.md')),
    autoUpdateTodo: tr.autoUpdateTodo !== undefined ? Boolean(tr.autoUpdateTodo) : !ownerGuided,
    autoUpdateChangelog: tr.autoUpdateChangelog !== undefined ? Boolean(tr.autoUpdateChangelog) : !ownerGuided
  };
}

/**
 * Records an active TODO item automatically when implementation/dispatch starts.
 */
export function recordAutoTaskStart({ root, cfgObj, taskId, title, intent = 'IMPLEMENTATION' }) {
  if (['QUESTION', 'STATUS_CHECK', 'CONTEXT_REFRESH', 'STRICT_READ_ONLY_DISCOVERY', 'GOVERNANCE_DIAGNOSTIC'].includes(String(intent).toUpperCase())) {
    return { updated: false, reason: 'READ_ONLY_INTENT' };
  }
  const tk = resolveTrackingConfig(root, cfgObj);
  if (!tk.autoUpdateTodo) return { updated: false, reason: 'AUTO_TODO_DISABLED' };

  const projectName = cfgObj?.projectName || path.basename(root);
  if (!fs.existsSync(tk.todoPath)) {
    writeTextAtomic(tk.todoPath, `# Project TODO & Slices Ledger (${projectName})\n\n## Active / Pending\n\n## Completed\n`);
  }
  const raw = fs.readFileSync(tk.todoPath, 'utf8');
  const tag = String(taskId || '').trim();
  if (tag && raw.includes(`[${tag}]`)) return { updated: false, reason: 'ALREADY_TRACKED', path: tk.todoPath };

  const today = now().slice(0, 10);
  const summary = String(title || tag || 'Task execution').replace(/\s+/g, ' ').trim().slice(0, 110);
  const entry = `- [ ] ${tag ? `[${tag}] ` : ''}${summary} (${today})`;
  const marker = '## Active / Pending';
  const idx = raw.indexOf(marker);
  const next = idx >= 0
    ? raw.slice(0, idx + marker.length) + '\n' + entry + raw.slice(idx + marker.length)
    : raw.trimEnd() + '\n' + entry + '\n';
  writeTextAtomic(tk.todoPath, next);
  return { updated: true, path: tk.todoPath, entry };
}

/**
 * Automatically checks off TODOs, appends a structured CHANGELOG entry, and logs non-slice
 * improvements/fixes/deploys to MASTER_SLICE_CHECKLIST audit log on verified delivery.
 */
export function recordDeliveryOutcome({
  root,
  slicesDir,
  cfgObj,
  taskId = '',
  type = 'feat',
  summary = '',
  declaredFiles = [],
  testSummary = '',
  sliceExists = false
}) {
  const tk = resolveTrackingConfig(root, cfgObj);
  const today = now().slice(0, 10);
  const cleanType = slug(type || 'feat').replace(/[^a-z-]/g, '') || 'feat';
  const cleanSummary = String(summary || taskId || (declaredFiles.length ? `Update ${declaredFiles.slice(0, 3).join(', ')}` : 'Verified delivery')).replace(/\s+/g, ' ').trim().slice(0, 180);
  const tag = String(taskId || `AUTO-${today}-${sha(cleanSummary + declaredFiles.join(',')).slice(0, 6)}`).trim();
  const res = { ok: true, tag, todoUpdated: false, changelogUpdated: false, masterAuditUpdated: false };

  // 1. Update TODO ledger
  if (tk.autoUpdateTodo) {
    const projectName = cfgObj?.projectName || path.basename(root);
    if (!fs.existsSync(tk.todoPath)) {
      writeTextAtomic(tk.todoPath, `# Project TODO & Slices Ledger (${projectName})\n\n## Active / Pending\n\n## Completed\n`);
    }
    const rawTodo = fs.readFileSync(tk.todoPath, 'utf8');
    const lines = rawTodo.split(/\r?\n/);
    let checked = false;
    const outLines = lines.map(l => {
      if (!checked && /^- \[ \]\s+/.test(l) && ((taskId && l.includes(`[${taskId}]`)) || (!taskId && l.toLowerCase().includes(cleanSummary.toLowerCase().slice(0, 24))))) {
        checked = true;
        return l.replace(/^- \[ \]/, '- [x]') + ` [done ${today}]`;
      }
      return l;
    });
    if (checked) {
      writeTextAtomic(tk.todoPath, outLines.join('\n'));
      res.todoUpdated = true;
    } else if (!rawTodo.includes(`[${tag}]`)) {
      const doneMarker = '## Completed';
      const entry = `- [x] [${tag}] ${cleanSummary} (${today}) [done ${today}]`;
      const idx = rawTodo.indexOf(doneMarker);
      const next = idx >= 0
        ? rawTodo.slice(0, idx + doneMarker.length) + '\n' + entry + rawTodo.slice(idx + doneMarker.length)
        : `${rawTodo.trimEnd()}\n\n## Completed\n${entry}\n`;
      writeTextAtomic(tk.todoPath, next);
      res.todoUpdated = true;
    }
  }

  // 2. Update Changelog automatically
  if (tk.autoUpdateChangelog) {
    const projectName = cfgObj?.projectName || path.basename(root);
    if (!fs.existsSync(tk.changelogPath)) {
      writeTextAtomic(tk.changelogPath, `# Changelog — ${projectName}\n\nAutomatically recorded verified deliveries, fixes, improvements, and deploys.\n\n`);
    }
    const curLog = fs.readFileSync(tk.changelogPath, 'utf8');
    const markerId = `<!-- auto-record:${tag} -->`;
    if (!curLog.includes(markerId) && !(taskId && curLog.includes(`(\`${taskId}\`)`))) {
      const fileText = declaredFiles.length ? `${declaredFiles.slice(0, 8).map(f => `\`${f}\``).join(', ')}${declaredFiles.length > 8 ? ` (+${declaredFiles.length - 8} more)` : ''} (${declaredFiles.length} total)` : 'working tree verified';
      const verText = testSummary ? String(testSummary).trim() : 'handoff-verify PASS (integrity + secret-scan)';
      const block = [
        `## [${today}] ${cleanType}: ${cleanSummary} (\`${tag}\`)`,
        markerId,
        `- **Files:** ${fileText}`,
        `- **Verification:** ${verText}`,
        ''
      ].join('\n');
      const nlAfterHeading = curLog.match(/^#[^\n]*\r?\n(?:>[^\n]*\r?\n)?(?:\r?\n)?/);
      const insertAt = nlAfterHeading ? nlAfterHeading[0].length : 0;
      const nextLog = curLog.slice(0, insertAt) + block + '\n' + curLog.slice(insertAt).replace(/^\r?\n/, '');
      writeTextAtomic(tk.changelogPath, nextLog);
      res.changelogUpdated = true;
    }
  }

  // 3. Lightweight non-slice audit row in MASTER_SLICE_CHECKLIST.md
  const masterPath = path.join(slicesDir, 'MASTER_SLICE_CHECKLIST.md');
  if (!sliceExists && fs.existsSync(masterPath)) {
    const masterText = fs.readFileSync(masterPath, 'utf8');
    const marker = '<!-- AUDIT_LOG_APPEND -->';
    if (masterText.includes(marker) && !masterText.includes(`| ${tag} |`)) {
      const safe = v => String(v || '').replaceAll('|', '/').replace(/\r?\n/g, ' ').trim();
      const row = `| ${now()} | AUTO_TRACK | ${safe(tag)} | ${safe(cleanType.toUpperCase())}_DELIVERED | coordinator | auto | local | ${declaredFiles.length} files | PASS | ${safe(cleanSummary)} |`;
      writeTextAtomic(masterPath, masterText.replace(marker, `${row}\n${marker}`));
      res.masterAuditUpdated = true;
    }
  }

  return res;
}

/**
 * Classifies whether the repository is GREENFIELD (from scratch) or BROWNFIELD (existing code),
 * checks AGENTS.md constitution, DESIGN_TASTE.md, CSS/tokens, and doc candidates.
 */
export function inspectProjectLifecycle({ root, cfgObj = null }) {
  const manifestFiles = ['package.json', 'pyproject.toml', 'requirements.txt', 'Cargo.toml', 'go.mod', 'composer.json'];
  const presentManifests = manifestFiles.filter(f => fs.existsSync(path.join(root, f)));
  const codeDirs = ['src', 'app', 'pages', 'components', 'lib', 'server', 'backend', 'frontend', 'api'].filter(d => fs.existsSync(path.join(root, d)));
  const hasGit = fs.existsSync(path.join(root, '.git'));
  const hasUiIndicators = fs.existsSync(path.join(root, 'tailwind.config.js'))
    || fs.existsSync(path.join(root, 'tailwind.config.ts'))
    || fs.existsSync(path.join(root, 'tailwind.config.mjs'))
    || fs.existsSync(path.join(root, 'src', 'styles'))
    || fs.existsSync(path.join(root, 'app', 'globals.css'))
    || fs.existsSync(path.join(root, 'index.html'))
    || fs.existsSync(path.join(root, 'docs', 'brand'))
    || fs.existsSync(path.join(root, 'public', 'brand'));

  const isBrownfield = presentManifests.length > 0 || codeDirs.length > 0;
  const mode = isBrownfield ? 'BROWNFIELD' : 'GREENFIELD';

  const agentsPath = path.join(root, 'AGENTS.md');
  let constitutionPresent = false;
  if (fs.existsSync(agentsPath)) {
    const rawAgents = fs.readFileSync(agentsPath, 'utf8');
    const stripped = rawAgents.replace(/<!--\s*AGYBOT_BOOTSTRAP:START\s*-->[\s\S]*?<!--\s*AGYBOT_BOOTSTRAP:END\s*-->/g, '').trim();
    constitutionPresent = stripped.length > 40;
  }

  const tastePrimary = path.join(root, '.slices', 'DESIGN_TASTE.md');
  const tasteLegacy = path.join(root, '.unslop-ui', 'taste.md');
  const designTastePath = fs.existsSync(tastePrimary) ? tastePrimary : (fs.existsSync(tasteLegacy) ? tasteLegacy : null);

  const docCandidates = ['docs/SPEC.md', 'SPEC.md', 'docs/ARCHITECTURE_C4.md', 'docs/ROADMAP.md', 'ROADMAP.md', 'PRD.md', 'README.md']
    .filter(rel => fs.existsSync(path.join(root, rel)));

  const nextActions = mode === 'GREENFIELD'
    ? [
        'Run /grill-me greenfield discovery (mission, stack, cost/deploy constraints, visual reference).',
        'Run agybot scaffold-constitution to create Product Constitution in AGENTS.md + initial SPEC/C4/ROADMAP.',
        'Run agybot design-taste-init before generating any UI to lock tokens & anti-pill rules in .slices/DESIGN_TASTE.md.'
      ]
    : [
        'Run read-only Brownfield audit (doctor + baseline tests/lint) preserving existing working UX (UNMENTIONED_UI_IS_FROZEN).',
        ...(constitutionPresent ? [] : ['Run agybot scaffold-constitution to capture repo invariants in AGENTS.md above AGYBOT_BOOTSTRAP.']),
        ...(!designTastePath && hasUiIndicators ? ['Run agybot design-taste-init to capture existing design tokens and anti-pill guardrails in .slices/DESIGN_TASTE.md.'] : []),
        ...((cfgObj?.canonicalProductSources || []).length === 0 && docCandidates.length ? [`Register existing canonical docs with source-register (${docCandidates[0]}).`] : [])
      ];

  return {
    mode,
    hasGit,
    presentManifests,
    codeDirs,
    hasUiIndicators,
    constitutionPresent,
    designTastePresent: Boolean(designTastePath),
    designTastePath: designTastePath ? path.relative(root, designTastePath).replaceAll('\\', '/') : null,
    docCandidates,
    nextActions
  };
}

/**
 * Creates or preserves .slices/DESIGN_TASTE.md with default Anti-Pill & Anti-Slop bans.
 */
export function initDesignTasteFile({ root, projectName = 'Project', force = false }) {
  const tastePath = path.join(root, '.slices', 'DESIGN_TASTE.md');
  if (fs.existsSync(tastePath) && !force) {
    return { created: false, path: tastePath, message: 'Existing .slices/DESIGN_TASTE.md preserved.' };
  }
  const hasBrandDir = fs.existsSync(path.join(root, 'docs', 'brand')) || fs.existsSync(path.join(root, 'public', 'brand'));
  const content = [
    `# Design Taste & UI Guardrails — ${projectName}`,
    '',
    '> Precedence: Project Brand Assets / Canonical Design Reference > ## Keep > ## Bans / ## Off > Global design-lint.',
    '> Scope safety: UNMENTIONED_UI_IS_FROZEN — never restyle unrelated screens without explicit scope.',
    '',
    '## Tokens & Component Reuse',
    '- Follow **REUSE -> VARIANT -> EXTEND -> NEW** before building custom components.',
    hasBrandDir ? '- Official brand assets detected (`docs/brand` or `public/brand`): extract palette/typography from them directly.' : '- Record approved palette hexes, spacing scale, and font stack here before building UI.',
    '',
    '## Bans',
    '- **Zero Decorative Pills Spam (`U1` / `U26`):** NEVER scatter `rounded-full` status/eyebrow/meta pills above headings or across every card unless listed under `## Keep` or required by an interactive control/tab.',
    '- **No Fake State Badges (`U9` / `U10`):** No hardcoded `NEW` / `AI` / `PRO` / `LIVE` badges or `animate-pulse` dots unless backed by real runtime state.',
    '- **No Decorative Edge Stripes (`U24`) or Off-Scale Spacing (`U18`):** Use container padding/tokens, never `border-l-4` accents or arbitrary `mt-[13px]` values.',
    '- **Clean Interface Copy (`U2`–`U8`, `U21`):** Short direct headings; zero AI filler words or obvious `"Click here to..."` botsplaining.',
    '',
    '## Keep',
    '- *(Add intentional brand pills/badges/tokens that MUST NOT be removed here, e.g. `- Header beta status badge`.)*',
    '',
    '## Off',
    '- *(List specific rule IDs to waive for this repo only when intentional, e.g. `- U19`.)*',
    ''
  ].join('\n');
  writeTextAtomic(tastePath, content);
  return { created: true, path: tastePath, message: 'Initialized .slices/DESIGN_TASTE.md with anti-pill defaults.' };
}

/**
 * Creates or updates the Product Constitution section in AGENTS.md ABOVE AGYBOT_BOOTSTRAP.
 */
export function scaffoldAgentsConstitution({ root, projectName = 'Project', mission = '', stack = '', nonNegotiables = [], force = false }) {
  const agentsPath = path.join(root, 'AGENTS.md');
  const existing = fs.existsSync(agentsPath) ? fs.readFileSync(agentsPath, 'utf8') : '';
  const bootStart = '<!-- AGYBOT_BOOTSTRAP:START -->';
  const bootEnd = '<!-- AGYBOT_BOOTSTRAP:END -->';
  const bootIdx = existing.indexOf(bootStart);
  const bootEndIdx = existing.indexOf(bootEnd);
  const bootstrapBlock = bootIdx >= 0 && bootEndIdx > bootIdx
    ? existing.slice(bootIdx, bootEndIdx + bootEnd.length)
    : '';
  const userSection = bootIdx >= 0 ? existing.slice(0, bootIdx).trim() : existing.trim();

  if (userSection.length > 40 && !force) {
    return { updated: false, path: agentsPath, reason: 'EXISTING_CONSTITUTION_PRESERVED' };
  }

  const rulesList = (Array.isArray(nonNegotiables) && nonNegotiables.length
    ? nonNegotiables
    : [
        'Keep secrets out of git and logs; fail closed on auth/validation boundaries.',
        'Respect REUSE -> VARIANT -> EXTEND -> NEW and .slices/DESIGN_TASTE.md (zero decorative pill spam).',
        'Verify changes with unpiped checks + Layer-2 integrity before declaring done.'
      ]).map(r => `- ${String(r).trim()}`);

  const constitution = [
    `# AGENTS.md — ${projectName} Constitution`,
    '',
    '> Precedence: AGENTS.md + canonical SPEC > `.slices/DESIGN_TASTE.md` > Global Governor defaults.',
    '',
    '## 1. Product Mission & Stack',
    `- **Mission:** ${mission || 'Define crisp product objective and primary user workflow.'}`,
    `- **Architecture / Stack:** ${stack || 'Keep architecture simple, cost-aware, and aligned with repository conventions.'}`,
    '',
    '## 2. Non-Negotiable Engineering & Design Rules',
    ...rulesList,
    ''
  ].join('\n');

  const finalContent = bootstrapBlock
    ? `${constitution}\n${bootstrapBlock}\n`
    : `${constitution}`;
  writeTextAtomic(agentsPath, finalContent);
  return { updated: true, path: agentsPath, preservedBootstrap: Boolean(bootstrapBlock) };
}

/**
 * Promotes a durable rule/preference from conversation into AGENTS.md, DESIGN_TASTE.md, or Vault learnings.
 */
export function promoteProjectRule({ root, slicesDir, vaultDir, cfgObj, target = 'learned', section = 'Bans', rule = '' }) {
  const cleanRule = String(rule || '').replace(/\s+/g, ' ').trim();
  if (!cleanRule) throw new Error('promote-rule requires --rule "<text>"');
  const normTarget = String(target || 'learned').toLowerCase();

  if (normTarget === 'taste' || normTarget === 'design') {
    const tastePath = path.join(root, '.slices', 'DESIGN_TASTE.md');
    if (!fs.existsSync(tastePath)) initDesignTasteFile({ root, projectName: cfgObj?.projectName || path.basename(root) });
    const raw = fs.readFileSync(tastePath, 'utf8');
    const secName = String(section || 'Bans').toLowerCase() === 'keep' ? '## Keep' : String(section || 'Bans').toLowerCase() === 'off' ? '## Off' : '## Bans';
    if (raw.includes(cleanRule)) return { updated: false, target: 'taste', path: tastePath, reason: 'ALREADY_PRESENT' };
    const idx = raw.indexOf(secName);
    const next = idx >= 0
      ? raw.slice(0, idx + secName.length) + `\n- ${cleanRule}` + raw.slice(idx + secName.length)
      : `${raw.trimEnd()}\n\n${secName}\n- ${cleanRule}\n`;
    writeTextAtomic(tastePath, next);
    return { updated: true, target: 'taste', section: secName, path: tastePath, rule: cleanRule };
  }

  if (normTarget === 'agents') {
    const agentsPath = path.join(root, 'AGENTS.md');
    if (!fs.existsSync(agentsPath)) scaffoldAgentsConstitution({ root, projectName: cfgObj?.projectName || path.basename(root) });
    const raw = fs.readFileSync(agentsPath, 'utf8');
    if (raw.includes(cleanRule)) return { updated: false, target: 'agents', path: agentsPath, reason: 'ALREADY_PRESENT' };
    const bootIdx = raw.indexOf('<!-- AGYBOT_BOOTSTRAP:START -->');
    const insertLine = `- ${cleanRule}\n`;
    const next = bootIdx >= 0
      ? `${raw.slice(0, bootIdx).trimEnd()}\n${insertLine}\n${raw.slice(bootIdx)}`
      : `${raw.trimEnd()}\n${insertLine}`;
    writeTextAtomic(agentsPath, next);
    return { updated: true, target: 'agents', path: agentsPath, rule: cleanRule };
  }

  const learned = runAutoLearn({ root, slicesDir, vaultDir, promoteSafe: true, recordText: cleanRule, autoLearnEnabled: true });
  return { updated: true, target: 'learned', learned };
}

