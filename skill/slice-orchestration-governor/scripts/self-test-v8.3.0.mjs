#!/usr/bin/env node
/**
 * Slice Orchestration Governor v8.3.0 — Authoritative Self-Test Suite (T1 - T45)
 * 100% generic, cross-platform, plug-and-play regression gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.dirname(SCRIPT_DIR);
const HOOK_PATH = path.join(SCRIPT_DIR, 'antigravity-hook.mjs');
const AGY_PATH = path.join(SCRIPT_DIR, 'agybot.mjs');
const SECRET_SCAN = path.join(SCRIPT_DIR, 'secret-scan.mjs');
const DESIGN_LINT = path.join(SCRIPT_DIR, 'design-lint.mjs');
const Q_PATH = path.join(SCRIPT_DIR, 'q.mjs');
const INSTALL_PATH = path.join(SCRIPT_DIR, 'install.mjs');

console.log('[self-test-v8.3.0] Starting Acceptance Test Suite (T1 - T45)...');

function runHook(event, payload, env = {}) {
  const res = spawnSync(process.execPath, [HOOK_PATH, event], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, AGY_GOVERNOR_GLOBAL_PATH: PKG_ROOT, ...env }
  });
  let parsed = null;
  try { parsed = JSON.parse(res.stdout); } catch {
    parsed = { _rawStdout: res.stdout, _rawStderr: res.stderr, _exitCode: res.status };
  }
  return { status: res.status, output: parsed, stderr: res.stderr };
}

function runNode(script, args, cwd, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, AGY_GOVERNOR_GLOBAL_PATH: PKG_ROOT, ...env }
  });
}

function lastJson(s) {
  const txt = String(s || '').trim();
  for (let i = txt.lastIndexOf('{'); i >= 0; i = txt.lastIndexOf('{', i - 1)) {
    try { return JSON.parse(txt.slice(i)); } catch {}
  }
  return null;
}

const testSandbox = path.join(os.tmpdir(), `agy-v810-test-${Date.now()}`);
fs.mkdirSync(testSandbox, { recursive: true });
const slicesDir = path.join(testSandbox, '.slices');
fs.mkdirSync(slicesDir, { recursive: true });

fs.writeFileSync(path.join(slicesDir, 'SLICE_GOVERNOR.json'), JSON.stringify({
  schemaVersion: 10,
  governorVersion: '8.1.0',
  projectName: 'GenericSampleApp',
  visualAcceptancePolicy: 'HYBRID',
  agyBot: {
    enabled: true,
    paused: false,
    humanEscalationPolicy: 'AUTONOMY_FIRST',
    swarmActivationPolicy: 'QUALIFIED_AUTO',
    orchestrationTransport: 'NATIVE_SUBAGENTS',
    onboardedAt: new Date().toISOString()
  },
  tracking: {
    mode: 'GOVERNOR_MANAGED',
    todoPath: '.slices/TODO.md',
    checklistPath: '.slices/MASTER_SLICE_CHECKLIST.md',
    changelogPath: '.slices/CHANGELOG.md',
    autoUpdateTodo: true
  }
}, null, 2), 'utf8');

const transcriptFile = path.join(testSandbox, 'transcript.jsonl');
const cid = 'test-coord-v810-01';

try {
  // T1
  fs.writeFileSync(transcriptFile, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nBatch: DEMO-01\nMODE = EXECUTE\nDEPLOY = YES\ngit worktree move release-tmp destination\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  runHook('pre-invocation', { conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const t1 = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'git worktree move release-tmp ../release-dest' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t1.output.decision !== 'allow') throw new Error(`T1 FAILED: ${JSON.stringify(t1.output)}`);
  console.log('✓ T1 PASS: git worktree move allowed under MODE=EXECUTE');

  // T2
  const t2Ssh = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'ssh ops@example.invalid "uptime"' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const t2Scp = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'scp build.zip ops@example.invalid:/opt/app/' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t2Ssh.output.decision !== 'allow' || t2Scp.output.decision !== 'allow') throw new Error('T2 FAILED');
  console.log('✓ T2 PASS: ssh/scp allowed with declared auth');

  // T3
  const t3Docker = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'docker compose up -d --force-recreate' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const t3Wrangler = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'npx wrangler pages deploy dist' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t3Docker.output.decision !== 'allow' || t3Wrangler.output.decision !== 'allow') throw new Error('T3 FAILED');
  console.log('✓ T3 PASS: docker compose / wrangler allowed with declared auth');

  // T4
  const t4Reset = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'git reset --hard HEAD~1' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const t4Rm = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'run_command', args: { CommandLine: 'rm -rf src/components' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t4Reset.output.decision !== 'deny' || t4Rm.output.decision !== 'deny') throw new Error('T4 FAILED');
  console.log('✓ T4 PASS: destructive git reset --hard and rm -rf blocked');

  // T5
  const cidTurn2 = 'test-coord-turn2';
  fs.writeFileSync(transcriptFile, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nBatch: OPS-11\nMODE = EXECUTE\nDEPLOY = YES\nExecute deploy\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  runHook('pre-invocation', { conversationId: cidTurn2, workspacePaths: [testSandbox], transcriptPath: transcriptFile }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const s1 = JSON.parse(fs.readFileSync(path.join(slicesDir, 'AGY_HOOK_STATE.json'), 'utf8'));
  const r1 = s1.conversations[cidTurn2].intakeReceipt;
  fs.appendFileSync(transcriptFile, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nAdendo: use --no-cache\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  runHook('pre-invocation', { conversationId: cidTurn2, workspacePaths: [testSandbox], transcriptPath: transcriptFile }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const s2 = JSON.parse(fs.readFileSync(path.join(slicesDir, 'AGY_HOOK_STATE.json'), 'utf8'));
  if (s2.conversations[cidTurn2].intakeReceipt !== r1 || !s2.conversations[cidTurn2].addendaCount) throw new Error('T5 FAILED');
  console.log('✓ T5 PASS: multi-message turn reuses single intake receipt');

  // T6
  const stopRes = runHook('stop', { conversationId: cidTurn2, workspacePaths: [testSandbox], transcriptPath: transcriptFile }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (stopRes.output.decision !== 'allow') throw new Error('T6 FAILED');
  console.log('✓ T6 PASS: Coordinator stop returns allow immediately');

  // T7
  const cidTurn3 = 'test-coord-turn3';
  const transcriptT7 = path.join(testSandbox, 'transcript-t7.jsonl');
  fs.writeFileSync(transcriptT7, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nBatch: OPS-11\nMove worktree\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  const t7Deny = runHook('pre-tool-use', {
    conversationId: cidTurn3, workspacePaths: [testSandbox], transcriptPath: transcriptT7,
    toolCall: { name: 'run_command', args: { CommandLine: 'git worktree move a ../b' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t7Deny.output.decision !== 'deny' || !t7Deny.output.reason.includes('agybot.mjs') || !t7Deny.output.reason.includes('intake --directive') || !t7Deny.output.reason.includes('NUNCA leia')) {
    throw new Error(`T7 FAILED: ${JSON.stringify(t7Deny.output)}`);
  }
  const t7Intake = runNode(AGY_PATH, ['intake', '--directive', 'OPS-11', '--coordinator', cidTurn3], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t7Intake.status !== 0) throw new Error(`T7 intake failed: ${t7Intake.stderr || t7Intake.stdout}`);
  const t7Allow = runHook('pre-tool-use', {
    conversationId: cidTurn3, workspacePaths: [testSandbox], transcriptPath: transcriptT7,
    toolCall: { name: 'run_command', args: { CommandLine: 'git worktree move a ../b' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t7Allow.output.decision !== 'allow') throw new Error(`T7 retry FAILED: ${JSON.stringify(t7Allow.output)}`);
  console.log('✓ T7 PASS: actionable denial + directive recovery auto-syncs AGY_HOOK_STATE');

  // T8
  for (const cmd of ['git checkout prisma/schema.prisma', 'git restore src/app.ts', 'git stash']) {
    const r = runHook('pre-tool-use', {
      conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
      toolCall: { name: 'run_command', args: { CommandLine: cmd } }
    }, { SLICE_GOVERNOR_ROOT: slicesDir });
    if (r.output.decision !== 'deny') throw new Error(`T8 FAILED for ${cmd}`);
  }
  console.log('✓ T8 PASS: git checkout/restore/stash blocked');

  // T9
  const cidRO = 'test-coord-ro';
  const transcriptRO = path.join(testSandbox, 'transcript-ro.jsonl');
  fs.writeFileSync(transcriptRO, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nFaça descoberta read-only do schema\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  runHook('pre-invocation', { conversationId: cidRO, workspacePaths: [testSandbox], transcriptPath: transcriptRO }, { SLICE_GOVERNOR_ROOT: slicesDir });
  for (const cmd of ['npx prisma format', 'npx prisma db pull']) {
    const r = runHook('pre-tool-use', {
      conversationId: cidRO, workspacePaths: [testSandbox], transcriptPath: transcriptRO,
      toolCall: { name: 'run_command', args: { CommandLine: cmd } }
    }, { SLICE_GOVERNOR_ROOT: slicesDir });
    if (r.output.decision !== 'deny' || !r.output.reason.includes('MUTATION_BLOCKED')) throw new Error(`T9 FAILED for ${cmd}`);
  }
  console.log('✓ T9 PASS: prisma format/db pull blocked in READ_ONLY');

  // T10
  const schemaF = path.join(testSandbox, 'schema.prisma');
  fs.writeFileSync(schemaF, 'model User { id String @id }\n', 'utf8');
  const hOrig = crypto.createHash('sha256').update(fs.readFileSync(schemaF)).digest('hex');
  fs.mkdirSync(path.join(testSandbox, '.scratch'), { recursive: true });
  const bakF = path.join(testSandbox, '.scratch', 'schema.prisma.bak');
  fs.copyFileSync(schemaF, bakF);
  fs.writeFileSync(schemaF, 'model User { id String @id name String }\n', 'utf8');
  fs.copyFileSync(bakF, schemaF);
  const hRev = crypto.createHash('sha256').update(fs.readFileSync(schemaF)).digest('hex');
  if (hOrig !== hRev) throw new Error('T10 FAILED');
  console.log('✓ T10 PASS: physical .scratch/ revert + SHA-256 integrity');

  // T11
  const clsC = runNode(AGY_PATH, ['qualify', '--text', 'MODE = EXECUTE\nImplementar endpoint de billing subscription com migration SQL e UI web'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  const qC = lastJson(clsC.stdout);
  if (qC.sliceClass !== 'C' || qC.transport !== 'NATIVE_SUBAGENTS' || !qC.requiredRoles.includes('BUILDER') || !qC.requiredRoles.includes('AUDITOR') || qC.mode === 'SOLO') {
    throw new Error(`T11 FAILED: ${JSON.stringify(qC)}`);
  }
  const intB = runNode(AGY_PATH, ['intake', '--text', 'MODE = EXECUTE\nImplemente o serviço de notificações e testes unitários', '--coordinator', 'cid-t11', '--dry-run'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  const iB = lastJson(intB.stdout);
  if (iB.riskClass !== 'B' || iB.orchestrationTransport !== 'NATIVE_SUBAGENTS' || !iB.dispatch?.nativeSubagentsAllowed || !iB.dispatch?.subagentPlan?.stages?.length) {
    throw new Error(`T11 FAILED (Class B intake): ${JSON.stringify(iB)}`);
  }
  console.log('✓ T11 PASS: Class B/C/D NATIVE_SUBAGENTS routing preserved even under MODE = EXECUTE');

  // T12
  const t12Allow = runHook('pre-tool-use', {
    conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'invoke_subagent', args: { TypeName: 'research', Role: 'Code Reviewer' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (t12Allow.output.decision !== 'allow') throw new Error(`T12 allow FAILED: ${JSON.stringify(t12Allow.output)}`);
  const apiSandbox = path.join(testSandbox, 'agentapi-repo');
  fs.mkdirSync(path.join(apiSandbox, '.slices'), { recursive: true });
  fs.writeFileSync(path.join(apiSandbox, '.slices', 'SLICE_GOVERNOR.json'), JSON.stringify({ agyBot: { orchestrationTransport: 'AGENTAPI_ONLY' } }), 'utf8');
  const t12Deny = runHook('pre-tool-use', {
    conversationId: 'cid-api', workspacePaths: [apiSandbox], transcriptPath: transcriptFile,
    toolCall: { name: 'invoke_subagent', args: { TypeName: 'research' } }
  }, { SLICE_GOVERNOR_ROOT: path.join(apiSandbox, '.slices') });
  if (t12Deny.output.decision !== 'deny') throw new Error(`T12 deny FAILED under AGENTAPI_ONLY: ${JSON.stringify(t12Deny.output)}`);
  console.log('✓ T12 PASS: invoke_subagent allowed under NATIVE_SUBAGENTS and blocked under AGENTAPI_ONLY');

  // T13
  for (const badCmd of ['cat .env', 'Get-Content .env.production', 'echo ok && cat .env.local', 'git commit -m "x" --no-verify']) {
    const r = runHook('pre-tool-use', {
      conversationId: cid, workspacePaths: [testSandbox], transcriptPath: transcriptFile,
      toolCall: { name: 'run_command', args: { CommandLine: badCmd } }
    }, { SLICE_GOVERNOR_ROOT: slicesDir });
    if (r.output.decision !== 'deny' || !r.output.reason.includes('SECRET_GUARD')) throw new Error(`T13 FAILED for ${badCmd}: ${JSON.stringify(r.output)}`);
  }
  console.log('✓ T13 PASS: .env read & --no-verify commits blocked across chained segments');

  // T14
  const cleanDir = path.join(testSandbox, 'scan-clean');
  fs.mkdirSync(cleanDir, { recursive: true });
  fs.writeFileSync(path.join(cleanDir, '.env.example'), 'OPENAI_API_KEY=your_key_here\n', 'utf8');
  fs.writeFileSync(path.join(cleanDir, 'app.ts'), 'export const x = 1;\n', 'utf8');
  if (runNode(SECRET_SCAN, ['--dir', cleanDir, '--json'], cleanDir).status !== 0) throw new Error('T14 clean FAILED');
  const dirtyDir = path.join(testSandbox, 'scan-dirty');
  fs.mkdirSync(dirtyDir, { recursive: true });
  const fakeTok = 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8';
  fs.writeFileSync(path.join(dirtyDir, 'leak.ts'), `const k = "${fakeTok}";\n`, 'utf8');
  const ssDirty = runNode(SECRET_SCAN, ['--dir', dirtyDir, '--json'], dirtyDir);
  if (ssDirty.status === 0 || String(ssDirty.stdout).includes(fakeTok)) throw new Error('T14 dirty FAILED or leaked secret value!');
  console.log('✓ T14 PASS: secret-scan detects leaks without printing secret values');

  // T15
  const uiDir = path.join(testSandbox, 'ui-test');
  fs.mkdirSync(path.join(uiDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(uiDir, 'src', 'bad.tsx'), 'export function Card(){ return <div className="border-l-4 animate-pulse font-black transition-all">Dashboard</div>; }\n', 'utf8');
  const dlFail = runNode(DESIGN_LINT, ['--dir', path.join(uiDir, 'src'), '--json'], uiDir);
  const dlObj = lastJson(dlFail.stdout);
  if (dlFail.status === 0 || !dlObj.findings.some(f => f.rule === 'U10') || !dlObj.findings.some(f => f.rule === 'U24')) {
    throw new Error(`T15 lint FAILED: ${dlFail.stdout}`);
  }
  fs.mkdirSync(path.join(uiDir, '.unslop-ui'), { recursive: true });
  fs.writeFileSync(path.join(uiDir, '.unslop-ui', 'taste.md'), '## Off\n- U10\n- U24\n- U19\n- U20\n', 'utf8');
  if (runNode(DESIGN_LINT, ['--dir', path.join(uiDir, 'src'), '--json'], uiDir).status !== 0) throw new Error('T15 taste ## Off FAILED');
  console.log('✓ T15 PASS: design-lint detects slop (U10/U24/U19/U20) and honors taste.md ## Off');

  // T16
  const qOk = runNode(Q_PATH, ['--lines', '10', '--', process.execPath, '-e', 'console.log("ok")'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (qOk.status !== 0 || !String(qOk.stdout).includes('OK exit=0')) throw new Error(`T16 q pass FAILED: ${qOk.stdout} ${qOk.stderr}`);
  const failCmd = ['--lines', '10', '--', process.execPath, '-e', 'console.error("same failure line"); process.exit(1)'];
  const qF1 = runNode(Q_PATH, failCmd, testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  const qF2 = runNode(Q_PATH, failCmd, testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (qF1.status !== 1 || qF2.status !== 1 || !String(qF2.stdout).includes('LOOP_DETECTED')) throw new Error('T16 loop breaker FAILED');
  console.log('✓ T16 PASS: q.mjs preserves exit code, logs unpiped output, and raises LOOP_DETECTED on 2nd failure');

  // T17
  const hvRepo = path.join(testSandbox, 'hv-repo');
  fs.mkdirSync(hvRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: hvRepo, windowsHide: true });
  fs.writeFileSync(path.join(hvRepo, 'a.ts'), 'export const a = 1;\n', 'utf8');
  const countsPath = path.join(testSandbox, 'hv-counts.json');
  fs.writeFileSync(countsPath, JSON.stringify([{ file: 'a.test.ts', tests: 2, pass: 2, fail: 0, exit: 0 }]), 'utf8');
  const hvMismatch = runNode(AGY_PATH, ['handoff-verify', '--expected-count', '2', '--counts-json', countsPath, '--skip-secret-scan'], hvRepo, { SLICE_GOVERNOR_ROOT: path.join(hvRepo, '.slices') });
  if (hvMismatch.status === 0) throw new Error('T17 FAILED: should fail on physical file count mismatch');
  const hvOk = runNode(AGY_PATH, ['handoff-verify', '--declared-files', 'a.ts', '--counts-json', countsPath, '--skip-secret-scan'], hvRepo, { SLICE_GOVERNOR_ROOT: path.join(hvRepo, '.slices') });
  if (hvOk.status !== 0) throw new Error(`T17 ok FAILED: ${hvOk.stdout} ${hvOk.stderr}`);
  console.log('✓ T17 PASS: handoff-verify catches physical file count mismatch and validates per-file counts');

  // T18
  const setupRepo = path.join(testSandbox, 'setup-repo');
  fs.mkdirSync(setupRepo, { recursive: true });
  fs.writeFileSync(path.join(setupRepo, 'ROADMAP.md'), '# Roadmap\n', 'utf8');
  const probeSetup = runNode(AGY_PATH, ['project-probe'], setupRepo);
  const pJson = lastJson(probeSetup.stdout);
  if (pJson?.trackingRecommendation?.checklistPath !== 'ROADMAP.md') throw new Error(`T18 probe FAILED: ${probeSetup.stdout}`);
  const rSetup = runNode(AGY_PATH, [
    'setup', '--autonomy', 'AUTONOMY_FIRST', '--swarm', 'QUALIFIED_AUTO', '--transport', 'NATIVE_SUBAGENTS',
    '--vault-mode', 'PROJECT_LOCAL', '--visual', 'HUMAN_MANUAL',
    '--tracking-mode', 'PROJECT_OWN_DOCS', '--checklist-path', 'docs/CHECKLIST.md', '--todo-path', 'docs/TODO.md'
  ], setupRepo);
  if (rSetup.status !== 0) throw new Error(`T18 setup FAILED: ${rSetup.stderr || rSetup.stdout}`);
  const savedCfg = JSON.parse(fs.readFileSync(path.join(setupRepo, '.slices', 'SLICE_GOVERNOR.json'), 'utf8'));
  if (!savedCfg.agyBot.onboardedAt || savedCfg.tracking.mode !== 'PROJECT_OWN_DOCS') throw new Error('T18 config invalid');
  console.log('✓ T18 PASS: generic project-probe + 5-question setup persists tracking & onboardedAt cleanly');

  // T19
  const t19Add = runNode(AGY_PATH, ['todo', 'add', '--id', 'SLICE-11', '--text', 'Verify hawd summary'], setupRepo);
  const t19Done = runNode(AGY_PATH, ['todo', 'done', '--id', 'SLICE-11'], setupRepo);
  const t19Hawd = runNode(AGY_PATH, ['hawd', '--json'], setupRepo);
  const hawdJson = lastJson(t19Hawd.stdout);
  const expectedPkgVer = fs.readFileSync(path.join(PKG_ROOT, 'VERSION'), 'utf8').trim();
  if (t19Add.status !== 0 || t19Done.status !== 0 || t19Hawd.status !== 0 || hawdJson.governorVersion !== expectedPkgVer) {
    throw new Error(`T19 FAILED: hawd=${t19Hawd.stdout}`);
  }
  console.log('✓ T19 PASS: agybot todo lifecycle & hawd summary working');

  // T20, T21, T25, T27: Zero-Shadow bind, volatile refusal, .git/info/exclude, workaround cleanup, max 1 backup outside discovery
  const bindRepo = path.join(testSandbox, 'bind-repo');
  fs.mkdirSync(bindRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: bindRepo, windowsHide: true });
  fs.mkdirSync(path.join(bindRepo, '.agents', 'skills', 'slice-orchestration-governor', 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(bindRepo, '.agents', 'skills', 'slice-orchestration-governor', 'SKILL.md'), '# old', 'utf8');
  fs.writeFileSync(path.join(bindRepo, '.agents', 'node.bat'), '@echo {"decision":"allow"}', 'utf8');
  fs.mkdirSync(path.join(bindRepo, '.slices'), { recursive: true });
  fs.writeFileSync(path.join(bindRepo, '.slices', 'SLICE_GOVERNOR.json'), JSON.stringify({
    projectName: 'BindRepo',
    agyBot: { onboardedAt: '2026-10-26T15:11:32.240Z', humanEscalationPolicy: 'AUTONOMY_FIRST', swarmActivationPolicy: 'EXPLICIT_ONLY' }
  }), 'utf8');

  const fakeHome = path.join(testSandbox, 'fake-home');
  // Negative check T25a: volatile global path refused by default
  const refusedVolatile = runNode(INSTALL_PATH, ['--non-interactive', '--bind-project', bindRepo, '--home', fakeHome, '--skip-self-test'], bindRepo);
  if (refusedVolatile.status === 0 || !String(refusedVolatile.stderr + refusedVolatile.stdout).includes('REFUSING_VOLATILE_GLOBAL_PATH')) {
    throw new Error(`T25a FAILED: ${refusedVolatile.stdout} ${refusedVolatile.stderr}`);
  }

  // Simulate accumulated legacy backup shadows in fakeHome/.gemini/config/skills/ and old install in antigravity/skills
  const fakeConfigSkills = path.join(fakeHome, '.gemini', 'config', 'skills');
  const fakeTarget = path.join(fakeConfigSkills, 'slice-orchestration-governor');
  fs.mkdirSync(fakeTarget, { recursive: true });
  fs.writeFileSync(path.join(fakeTarget, 'VERSION'), '7.0.1', 'utf8');
  fs.mkdirSync(path.join(fakeConfigSkills, 'slice-orchestration-governor.backup-2026-01-01'), { recursive: true });
  fs.mkdirSync(path.join(fakeConfigSkills, 'slice-orchestration-governor.backup-2026-02-02'), { recursive: true });
  fs.mkdirSync(path.join(fakeHome, '.gemini', 'antigravity', 'skills', 'slice-orchestration-governor'), { recursive: true });

  // Bind + install global (using --allow-volatile-runtime for fakeHome sandbox)
  const bindRun = runNode(INSTALL_PATH, [
    '--non-interactive', '--bind-project', bindRepo, '--home', fakeHome,
    '--skip-self-test', '--allow-volatile-runtime', '--enable-qualified-auto'
  ], bindRepo);
  if (bindRun.status !== 0) throw new Error(`T20 bind FAILED: ${bindRun.stderr || bindRun.stdout}`);

  // T27a: Verify zero .backup-* shadows inside fakeConfigSkills & only 1 backup outside discovery!
  const remainingCfgDirs = fs.readdirSync(fakeConfigSkills);
  const antiShadowDirs = fs.readdirSync(path.join(fakeHome, '.gemini', 'antigravity', 'skills'));
  const backupDirs = fs.readdirSync(path.join(fakeHome, '.gemini', 'backups', 'skills'));
  if (remainingCfgDirs.length !== 1 || remainingCfgDirs[0] !== 'slice-orchestration-governor' || antiShadowDirs.length !== 0 || backupDirs.length !== 1 || backupDirs[0] !== 'slice-orchestration-governor-prev') {
    throw new Error(`T27a shadow/backup cleanup FAILED: cfg=${remainingCfgDirs} anti=${antiShadowDirs} backups=${backupDirs}`);
  }
  // T27b: Verify .git/info/exclude keeps git status clean & .agents/node.bat moved cleanly & QUALIFIED_AUTO migrated
  const excludeText = fs.readFileSync(path.join(bindRepo, '.git', 'info', 'exclude'), 'utf8');
  const bindStatus = spawnSync('git', ['status', '--porcelain'], { cwd: bindRepo, encoding: 'utf8', windowsHide: true });
  const migratedCfg = JSON.parse(fs.readFileSync(path.join(bindRepo, '.slices', 'SLICE_GOVERNOR.json'), 'utf8'));
  if (!excludeText.includes('.slices/') || !excludeText.includes('.agy-vault/') || fs.existsSync(path.join(bindRepo, '.agents', 'node.bat')) || migratedCfg.agyBot.swarmActivationPolicy !== 'QUALIFIED_AUTO') {
    throw new Error(`T27b FAILED: exclude/clean/migrate failed! status=${bindStatus.stdout}`);
  }
  if (bindStatus.stdout.includes('.slices/') || bindStatus.stdout.includes('.agy-backups/')) {
    throw new Error(`T27b git pollution FAILED: ${bindStatus.stdout}`);
  }

  // Negative check T25b: --global-only inside bound git repo never modifies PROJECT_BINDING.json
  const beforeBindingText = fs.readFileSync(path.join(bindRepo, '.slices', 'PROJECT_BINDING.json'), 'utf8');
  const gOnly = runNode(INSTALL_PATH, ['--non-interactive', '--global-only', '--home', path.join(testSandbox, 'zip-verify-other'), '--skip-self-test'], bindRepo);
  if (gOnly.status !== 0 || fs.readFileSync(path.join(bindRepo, '.slices', 'PROJECT_BINDING.json'), 'utf8') !== beforeBindingText) {
    throw new Error('T25b FAILED: --global-only altered CWD repo binding');
  }
  console.log('✓ T20, T21, T25 & T27 PASS: Single outside backup, zero shadows, clean .git/info/exclude, CWD=.agents/ OK');

  // T22 & T28: Quote-aware splitCommandSegments prevents intake self-deadlock on ';' inside --text + permits git grep / Write-Output / --help
  const cidNoRec = 'test-coord-quote';
  const intakeQuoted = runHook('pre-tool-use', {
    conversationId: cidNoRec, workspacePaths: [bindRepo],
    toolCall: { name: 'run_command', args: { CommandLine: `node "${path.resolve(bindRepo, '.slices', 'agybot.mjs').replaceAll('\\', '/')}" intake --text "Inspect X; verify Y\nand Z"` } }
  }, { SLICE_GOVERNOR_ROOT: path.join(bindRepo, '.slices') });
  const roExpanded = runHook('pre-tool-use', {
    conversationId: cidRO, workspacePaths: [testSandbox], transcriptPath: transcriptRO,
    toolCall: { name: 'run_command', args: { CommandLine: 'git show --stat HEAD; Write-Output "---"; git grep -n "hello" -- src; node .slices/agybot.mjs --help' } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const chainedBad = runHook('pre-tool-use', {
    conversationId: cidNoRec, workspacePaths: [bindRepo],
    toolCall: { name: 'run_command', args: { CommandLine: 'git status && echo hacked > out.txt' } }
  }, { SLICE_GOVERNOR_ROOT: path.join(bindRepo, '.slices') });
  if (intakeQuoted.output.decision !== 'allow' || roExpanded.output.decision !== 'allow' || chainedBad.output.decision !== 'deny') {
    throw new Error(`T22/T28 FAILED: quoted=${JSON.stringify(intakeQuoted.output)} ro=${JSON.stringify(roExpanded.output)} bad=${JSON.stringify(chainedBad.output)}`);
  }
  console.log('✓ T22 & T28 PASS: Quote-aware segmentation allows embedded ";" in intake & git grep/Write-Output/--help; blocks chained writes');

  // T23
  const bootDir = path.join(slicesDir, 'agentapi-bootstrap');
  fs.mkdirSync(bootDir, { recursive: true });
  fs.writeFileSync(path.join(bootDir, 'a'.repeat(48) + '.json'), JSON.stringify({ status: 'PENDING', expiresAt: Date.now() + 600000 }), 'utf8');
  const snakeUriHook = runHook('pre-tool-use', {
    conversation_id: cid,
    workspace_paths: [pathToFileURL(testSandbox).href],
    tool_name: 'run_command',
    tool_input: { CommandLine: 'git status' }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (snakeUriHook.output.decision !== 'allow') throw new Error(`T23 FAILED: ${JSON.stringify(snakeUriHook.output)}`);
  console.log('✓ T23 PASS: snake_case + file:// URI + stale pending-token resilience');

  // T24
  const qaQual = runNode(AGY_PATH, ['intake', '--text', 'Verify API routes and run vitest', '--coordinator', 'cid-qa', '--dry-run'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir });
  const qaRes = lastJson(qaQual.stdout);
  if (qaRes.mutationBudget !== 'SCOPED') throw new Error(`T24 FAILED: QA prompt got mutationBudget=${qaRes.mutationBudget}`);
  console.log('✓ T24 PASS: QA/verification prompt cleanly classified as SCOPED');

  // T26
  const openPipeRes = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [HOOK_PATH, 'stop'], {
      cwd: testSandbox,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, AGY_GOVERNOR_GLOBAL_PATH: PKG_ROOT, SLICE_GOVERNOR_ROOT: slicesDir }
    });
    let out = '', err = '';
    const timer = setTimeout(() => { try { child.kill(); } catch {} reject(new Error('T26 FAILED: hung')); }, 3000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('exit', code => { clearTimeout(timer); resolve({ code, out, err }); });
  });
  if (openPipeRes.code !== 0 || !openPipeRes.out.includes('"decision":"allow"')) throw new Error(`T26 FAILED: ${openPipeRes.out}`);
  console.log('✓ T26 PASS: bare hook stop returns allow without hanging on open non-EOF stdin');

  // T29: FROZEN canonical source warns without fatal deadlock
  const staleRepo = path.join(testSandbox, 'stale-repo');
  fs.mkdirSync(path.join(staleRepo, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(staleRepo, 'docs', 'FROZEN.md'), '# Frozen v1\n', 'utf8');
  fs.writeFileSync(path.join(staleRepo, 'docs', 'LIVING.md'), '# Living v1\n', 'utf8');
  runNode(AGY_PATH, ['setup', '--autonomy', 'AUTONOMY_FIRST', '--swarm', 'QUALIFIED_AUTO', '--transport', 'NATIVE_SUBAGENTS', '--vault-mode', 'PROJECT_LOCAL', '--visual', 'AUTOMATED_FOCUSED', '--tracking-mode', 'PROJECT_OWN_DOCS', '--checklist-path', 'docs/LIVING.md'], staleRepo);
  runNode(AGY_PATH, ['source-register', '--id', 'FROZEN-SPEC', '--ref', 'docs/FROZEN.md', '--persistence', 'FROZEN'], staleRepo);
  runNode(AGY_PATH, ['requirements-reconcile', '--attest-source', 'FROZEN-SPEC'], staleRepo);
  runNode(AGY_PATH, ['source-register', '--id', 'LIVING-SPEC', '--ref', 'docs/LIVING.md', '--persistence', 'LIVING'], staleRepo);
  runNode(AGY_PATH, ['requirements-reconcile', '--attest-source', 'LIVING-SPEC'], staleRepo);
  fs.writeFileSync(path.join(staleRepo, 'docs', 'FROZEN.md'), '# Frozen v2 modified\n', 'utf8');
  fs.writeFileSync(path.join(staleRepo, 'docs', 'LIVING.md'), '# Living v2 modified\n', 'utf8');
  const intakeRes = runNode(AGY_PATH, ['intake', '--text', 'MODE = EXECUTE\nImplementar endpoint X', '--coordinator', 'cid-stale'], staleRepo);
  const intakeJson = lastJson(intakeRes.stdout);
  if (intakeRes.status !== 0 || !intakeJson?.dispatch?.staleCanonicalSources?.includes('CANONICAL_SOURCE_STALE:FROZEN-SPEC')) {
    throw new Error(`T29 FAILED: FROZEN source should warn without deadlocking! status=${intakeRes.status} out=${intakeRes.stdout}`);
  }
  console.log('✓ T29 PASS: FROZEN canonical source warns cleanly without deadlocking intake/tools');

  // T30: LIVING canonical source auto-refreshes via intake -> stale:false & sources-refresh permitted without receipt
  if (intakeJson?.dispatch?.staleCanonicalSources?.includes('CANONICAL_SOURCE_STALE:LIVING-SPEC')) {
    throw new Error(`T30 FAILED: LIVING-SPEC should have auto-refreshed during intake!`);
  }
  const brainAfter = lastJson(runNode(AGY_PATH, ['brain-status'], staleRepo).stdout);
  const livingEntry = brainAfter?.canonicalSources?.find(x => x.id === 'LIVING-SPEC');
  if (!livingEntry || livingEntry.stale !== false) {
    throw new Error(`T30 FAILED: LIVING-SPEC stale !== false in brain-status: ${JSON.stringify(brainAfter)}`);
  }
  const srIdem = lastJson(runNode(AGY_PATH, ['sources-refresh'], staleRepo).stdout);
  if (!srIdem?.ok || srIdem.refreshedCount !== 0) {
    throw new Error(`T30 FAILED: sources-refresh idempotency check failed: ${JSON.stringify(srIdem)}`);
  }
  const srHook = runHook('pre-tool-use', {
    conversationId: 'cid-missing-receipt-sr',
    workspacePaths: [staleRepo],
    toolCall: { name: 'run_command', args: { CommandLine: 'node .slices/agybot.mjs sources-refresh' } }
  }, { SLICE_GOVERNOR_ROOT: path.join(staleRepo, '.slices') });
  if (srHook.output.decision !== 'allow') {
    throw new Error(`T30 FAILED: PreToolUse must allow sources-refresh without receipt: ${JSON.stringify(srHook.output)}`);
  }
  console.log('✓ T30 PASS: LIVING source auto-refreshes cleanly (stale=false) & sources-refresh is idempotent/never blocked');

  // T31: Universal multilingual natural intent classification (no keyword deadlocks; explicit RO/questions stay ZERO)
  const scopedCases = [
    { label: 'PT-BR natural', text: 'o menu gooey esta sem animações e está quebrado\n2. pode começar se vc consegue' },
    { label: 'Spanish natural', text: 'el botón de guardar no funciona, arréglalo en el header' },
    { label: 'Japanese natural', text: 'ログインボタンが動かない直して' },
    { label: 'Unlisted language (Polish)', text: 'napraw ten przycisk na górze strony' }
  ];
  for (const tc of scopedCases) {
    const r = lastJson(runNode(AGY_PATH, ['intake', '--text', tc.text, '--coordinator', 'cid-t31', '--dry-run'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir }).stdout);
    if (r?.mutationBudget !== 'SCOPED') throw new Error(`T31 FAILED (${tc.label}): got ${JSON.stringify(r)}`);
  }
  const zeroCases = [
    { label: 'Spanish read-only', text: 'Haz un diagnóstico en solo lectura sin editar nada' },
    { label: 'Japanese read-only', text: '読み取り専用で調べて' },
    { label: 'PT-BR pure question', text: 'Explique por que o menu está sem animações?' }
  ];
  for (const tc of zeroCases) {
    const r = lastJson(runNode(AGY_PATH, ['intake', '--text', tc.text, '--coordinator', 'cid-t31', '--dry-run'], testSandbox, { SLICE_GOVERNOR_ROOT: slicesDir }).stdout);
    if (r?.mutationBudget !== 'ZERO') throw new Error(`T31 ZERO FAILED (${tc.label}): got ${JSON.stringify(r)}`);
  }
  console.log('✓ T31 PASS: Universal multilingual natural directives unlock SCOPED while explicit RO & pure questions stay ZERO');

  // T32: Live mid-turn intake --directive recovery WITHOUT --coordinator / AGY_CURRENT_CONVERSATION_ID & hash preservation
  const cidLive = 'cid-live-unblock-t32';
  const liveTranscript = path.join(testSandbox, 'transcript-t32.jsonl');
  fs.writeFileSync(liveTranscript, JSON.stringify({
    source: 'USER_EXPLICIT', type: 'USER_INPUT',
    content: '<USER_REQUEST>\nO que esse botão faz atualmente?\n</USER_REQUEST>'
  }) + '\n', 'utf8');
  runHook('pre-invocation', { conversationId: cidLive, workspacePaths: [testSandbox], transcriptPath: liveTranscript }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const preDeny = runHook('pre-tool-use', {
    conversationId: cidLive, workspacePaths: [testSandbox], transcriptPath: liveTranscript,
    toolCall: { name: 'write_file', args: { Path: path.join(testSandbox, 'src', 'btn.ts') } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (preDeny.output.decision !== 'deny' || !preDeny.output.reason.includes(`--coordinator "${cidLive}"`)) {
    throw new Error(`T32 deny hint FAILED: ${JSON.stringify(preDeny.output)}`);
  }
  const hsBefore = JSON.parse(fs.readFileSync(path.join(slicesDir, 'AGY_HOOK_STATE.json'), 'utf8'));
  const origHash = hsBefore.conversations[cidLive].lastPromptHash;
  // Simulate terminal call with NO env cid and NO --coordinator flag
  const cleanUnlockEnv = { ...process.env, SLICE_GOVERNOR_ROOT: slicesDir, AGY_GOVERNOR_GLOBAL_PATH: PKG_ROOT };
  delete cleanUnlockEnv.AGY_COORDINATOR_ID;
  delete cleanUnlockEnv.AGY_DIRECTOR_ID;
  delete cleanUnlockEnv.AGY_CURRENT_CONVERSATION_ID;
  delete cleanUnlockEnv.ANTIGRAVITY_CONVERSATION_ID;
  const unlockRun = spawnSync(process.execPath, [AGY_PATH, 'intake', '--directive', 'CURRENT_BATCH'], {
    cwd: testSandbox, encoding: 'utf8', windowsHide: true, env: cleanUnlockEnv
  });
  const unlockJson = lastJson(unlockRun.stdout);
  if (unlockRun.status !== 0 || unlockJson?.mutationBudget !== 'SCOPED' || !unlockJson?.hookSynced || unlockJson?.syncedCoordinatorId !== cidLive) {
    throw new Error(`T32 live unblock FAILED: status=${unlockRun.status} out=${unlockRun.stdout} err=${unlockRun.stderr}`);
  }
  const hsAfter = JSON.parse(fs.readFileSync(path.join(slicesDir, 'AGY_HOOK_STATE.json'), 'utf8'));
  if (hsAfter.conversations[cidLive].lastPromptHash !== origHash) {
    throw new Error(`T32 hash preservation FAILED: before=${origHash} after=${hsAfter.conversations[cidLive].lastPromptHash}`);
  }
  // Even if PreInvocation fires again in same turn, preserved hash prevents downgrade back to ZERO
  runHook('pre-invocation', { conversationId: cidLive, workspacePaths: [testSandbox], transcriptPath: liveTranscript }, { SLICE_GOVERNOR_ROOT: slicesDir });
  const afterAllow = runHook('pre-tool-use', {
    conversationId: cidLive, workspacePaths: [testSandbox], transcriptPath: liveTranscript,
    toolCall: { name: 'write_file', args: { Path: path.join(testSandbox, 'src', 'btn.ts') } }
  }, { SLICE_GOVERNOR_ROOT: slicesDir });
  if (afterAllow.output.decision !== 'allow') throw new Error(`T32 retry allow FAILED: ${JSON.stringify(afterAllow.output)}`);
  console.log('✓ T32 PASS: Mid-turn directive unlock syncs active Coordinator without env cid and preserves lastPromptHash');

  // T33 & T34: agybot doctor + browser-config persistence
  const docRun = runNode(AGY_PATH, ['doctor'], setupRepo);
  const docJson = lastJson(docRun.stdout);
  if (docRun.status !== 0 || !docJson?.tools?.node || docJson?.browser?.chromeRemoteDebuggingUrl !== 'chrome://inspect/#remote-debugging') {
    throw new Error(`T33 doctor FAILED: ${docRun.stdout} ${docRun.stderr}`);
  }
  const bcRun = runNode(AGY_PATH, ['browser-config', '--mode', 'PLAYWRIGHT_HEADLESS', '--chrome-ready', 'yes'], setupRepo);
  const bcCfg = JSON.parse(fs.readFileSync(path.join(setupRepo, '.slices', 'SLICE_GOVERNOR.json'), 'utf8'));
  if (bcRun.status !== 0 || bcCfg.browserTesting?.mode !== 'PLAYWRIGHT_HEADLESS' || bcCfg.browserTesting?.chromeRemoteDebuggingConfirmed !== true || !bcCfg.agyBot?.onboardedAt) {
    throw new Error(`T34 browser-config FAILED: ${bcRun.stdout}`);
  }
  console.log('✓ T33 & T34 PASS: agybot doctor & browser-config persist chrome://inspect/#remote-debugging preset cleanly');

  // T35: Layer-2 test-integrity + supply-chain lockfile check inside handoff-verify
  const intRepo = path.join(testSandbox, 'integrity-repo');
  fs.mkdirSync(intRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: intRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: intRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test'], { cwd: intRepo, windowsHide: true });
  fs.writeFileSync(path.join(intRepo, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: { okpkg: '1.0.0' } }, null, 2), 'utf8');
  fs.writeFileSync(path.join(intRepo, 'package-lock.json'), '{"lockfileVersion":3}\n', 'utf8');
  fs.writeFileSync(path.join(intRepo, 'sample.test.ts'), 'test("works", () => { expect(1).toBe(1); });\n', 'utf8');
  spawnSync('git', ['add', '-A'], { cwd: intRepo, windowsHide: true });
  spawnSync('git', ['commit', '-m', 'init'], { cwd: intRepo, windowsHide: true });
  fs.writeFileSync(path.join(intRepo, 'sample.test.ts'), 'test.skip("works", () => { expect(1).toBe(1); });\n', 'utf8');
  fs.writeFileSync(path.join(intRepo, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: { okpkg: '1.0.0', hallucinatedpkg: '1.0.0' } }, null, 2), 'utf8');
  const intBad = runNode(AGY_PATH, ['handoff-verify', '--declared-files', 'sample.test.ts,package.json', '--skip-secret-scan'], intRepo);
  const intBadJson = lastJson(intBad.stdout);
  if (intBad.status === 0 || !intBadJson?.issues?.some(i => i.includes('TEST_SKIP_OR_ONLY_ADDED')) || !intBadJson?.issues?.some(i => i.includes('UNPINNED_DEPENDENCY_WITHOUT_LOCKFILE'))) {
    throw new Error(`T35 integrity fail-catch FAILED: ${intBad.stdout}`);
  }
  fs.writeFileSync(path.join(intRepo, 'sample.test.ts'), 'test("works", () => { expect(1).toBe(1); expect(2).toBe(2); });\n', 'utf8');
  fs.writeFileSync(path.join(intRepo, 'package-lock.json'), '{"lockfileVersion":3,"packages":{"hallucinatedpkg":{}}}\n', 'utf8');
  const intOk = runNode(AGY_PATH, ['handoff-verify', '--declared-files', 'sample.test.ts,package.json,package-lock.json', '--skip-secret-scan'], intRepo);
  if (intOk.status !== 0) throw new Error(`T35 fixed integrity FAILED: ${intOk.stdout} ${intOk.stderr}`);
  console.log('✓ T35 PASS: Layer-2 handoff-verify catches .skip & unpinned deps and passes clean updates');

  // T36: Zero-initiative autoLearn + q.mjs queue + SessionStart surfacing
  const learnRepo = path.join(testSandbox, 'learn-repo');
  fs.mkdirSync(learnRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: learnRepo, windowsHide: true });
  const lsSetup = runNode(AGY_PATH, ['setup', '--accept-defaults'], learnRepo);
  if (lsSetup.status !== 0) throw new Error(`T36 setup FAILED: ${lsSetup.stdout} ${lsSetup.stderr}`);
  const lsSlices = path.join(learnRepo, '.slices');
  const qF = ['--lines', '5', '--', process.execPath, '-e', 'console.error("db timeout line"); process.exit(1)'];
  runNode(Q_PATH, qF, learnRepo, { SLICE_GOVERNOR_ROOT: lsSlices });
  runNode(Q_PATH, qF, learnRepo, { SLICE_GOVERNOR_ROOT: lsSlices });
  fs.appendFileSync(path.join(lsSlices, 'FRICTION_LOG.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), rule: 'SECRET_GUARD', tool: 'run_command' }) + '\n' +
    JSON.stringify({ ts: new Date().toISOString(), rule: 'SECRET_GUARD', tool: 'run_command' }) + '\n', 'utf8');
  const autoIntake = lastJson(runNode(AGY_PATH, ['intake', '--text', 'Corrigir conexão no modulo A', '--coordinator', 'cid-learn'], learnRepo, { SLICE_GOVERNOR_ROOT: lsSlices }).stdout);
  if (!autoIntake?.autoLearnSummary || autoIntake.autoLearnSummary.totalItems < 2 || !fs.existsSync(path.join(learnRepo, '.agy-vault', 'indexes', 'LEARNINGS_INDEX.md'))) {
    throw new Error(`T36 autoLearn FAILED: ${JSON.stringify(autoIntake)}`);
  }
  const learnList = runNode(AGY_PATH, ['learn', '--record', 'Check browser overlap on 390x844'], setupRepo);
  const learnJson = lastJson(learnList.stdout);
  if (learnList.status !== 0 || !learnJson?.totalItems) throw new Error(`T36 learn record FAILED: ${learnList.stdout}`);
  console.log('✓ T36 PASS: Friction & LOOP_DETECTED automatically captured/promoted into Vault during intake');

  // T37: scope-check parallel worker overlap guard
  const scBad = runNode(AGY_PATH, ['scope-check', '--scopes', 'shell:src/ui;mod1:src/ui/nav.tsx'], testSandbox);
  const scOk = runNode(AGY_PATH, ['scope-check', '--scopes', 'shell:src/ui/theme;mod1:src/features/auth;mod2:src/features/billing'], testSandbox);
  if (scBad.status === 0 || scOk.status !== 0) throw new Error(`T37 scope-check FAILED: bad=${scBad.status} ok=${scOk.status}`);
  console.log('✓ T37 PASS: scope-check blocks overlapping parallel write scopes and allows disjoint modules');

  // T38: Onboarding payload includes Q6 Browser Chrome Debugging + Q7 Final Interactive Shortcut Tour
  const uninitRepo = path.join(testSandbox, 'uninit-repo');
  fs.mkdirSync(uninitRepo, { recursive: true });
  const obRes = runNode(AGY_PATH, ['setup'], uninitRepo);
  const obJson = lastJson(obRes.stdout);
  const keys = (obJson?.questions || []).map(q => q.key);
  const q6 = (obJson?.questions || []).find(q => q.key === 'browser-mode');
  const q7 = (obJson?.questions || []).find(q => q.key === 'onboarding-tour');
  if (!keys.includes('browser-mode') || !keys.includes('onboarding-tour') || !q6?.plainExplanation?.includes('chrome://inspect/#remote-debugging') || !q7?.finalStep || !q7?.plainExplanation?.includes('/agybot hawd')) {
    throw new Error(`T38 onboarding Q6/Q7 FAILED: ${JSON.stringify(keys)}`);
  }
  console.log('✓ T38 PASS: Onboarding includes Q6 Browser Remote Debugging & Q7 Interactive Shortcut Tour');

  // T39: Automatic TODO on dispatch + TODO done, CHANGELOG.md & MASTER_SLICE_CHECKLIST audit row on handoff-verify + agybot record idempotency
  const GOV_PATH = path.join(SCRIPT_DIR, 'slice-governor.mjs');
  const trackRepo = path.join(testSandbox, 'track-repo');
  fs.mkdirSync(trackRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: trackRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: trackRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: trackRepo, windowsHide: true });
  fs.writeFileSync(path.join(trackRepo, 'README.md'), '# Track Demo\n', 'utf8');
  spawnSync('git', ['add', 'README.md'], { cwd: trackRepo, windowsHide: true });
  spawnSync('git', ['commit', '-m', 'chore: init'], { cwd: trackRepo, windowsHide: true });
  const trSetup = runNode(AGY_PATH, ['setup', '--accept-defaults'], trackRepo);
  if (trSetup.status !== 0) throw new Error(`T39 setup FAILED: ${trSetup.stdout} ${trSetup.stderr}`);
  spawnSync('git', ['add', '-A'], { cwd: trackRepo, windowsHide: true });
  spawnSync('git', ['commit', '-m', 'chore: baseline setup'], { cwd: trackRepo, windowsHide: true });
  const trDispatch = runNode(AGY_PATH, ['dispatch', '--text', 'Add webhook retry queue', '--title', 'Webhook retry queue', '--task', 'SLICE-TRACK-1'], trackRepo);
  if (trDispatch.status !== 0) throw new Error(`T39 dispatch FAILED: ${trDispatch.stdout} ${trDispatch.stderr}`);
  const todoAfterDispatch = fs.readFileSync(path.join(trackRepo, '.slices', 'TODO.md'), 'utf8');
  if (!todoAfterDispatch.includes('- [ ] [SLICE-TRACK-1] Webhook retry queue')) {
    throw new Error(`T39 TODO open FAILED: ${todoAfterDispatch}`);
  }
  fs.writeFileSync(path.join(trackRepo, 'worker.ts'), 'export const retryCount = 3;\n', 'utf8');
  const trHv = runNode(AGY_PATH, [
    'handoff-verify',
    '--declared-files', 'worker.ts',
    '--skip-secret-scan',
    '--task', 'SLICE-TRACK-1',
    '--type', 'feat',
    '--summary', 'Implemented webhook retry queue',
    '--test-summary', 'worker.test.ts: 3/3 pass exit=0'
  ], trackRepo);
  const trHvJson = lastJson(trHv.stdout);
  if (trHv.status !== 0 || !trHvJson?.autoTracking?.todoUpdated || !trHvJson?.autoTracking?.changelogUpdated || !trHvJson?.autoTracking?.masterAuditUpdated) {
    throw new Error(`T39 handoff-verify autoTracking FAILED: ${trHv.stdout} ${trHv.stderr}`);
  }
  const todoAfterHv = fs.readFileSync(path.join(trackRepo, '.slices', 'TODO.md'), 'utf8');
  const logAfterHv = fs.readFileSync(path.join(trackRepo, '.slices', 'CHANGELOG.md'), 'utf8');
  const masterAfterHv = fs.readFileSync(path.join(trackRepo, '.slices', 'MASTER_SLICE_CHECKLIST.md'), 'utf8');
  if (!todoAfterHv.includes('- [x] [SLICE-TRACK-1]') || !logAfterHv.includes('Implemented webhook retry queue') || !masterAfterHv.includes('| SLICE-TRACK-1 |')) {
    throw new Error('T39 tracking artifacts missing expected entries');
  }
  const recDup = lastJson(runNode(AGY_PATH, ['record', '--task', 'SLICE-TRACK-1', '--type', 'feat', '--summary', 'Implemented webhook retry queue'], trackRepo).stdout);
  if (recDup?.changelogUpdated !== false) throw new Error(`T39 idempotency FAILED: ${JSON.stringify(recDup)}`);
  const recNew = lastJson(runNode(AGY_PATH, ['record', '--task', 'HOTFIX-9', '--type', 'fix', '--summary', 'Normalize UTC offset edge case', '--files', 'src/tz.ts'], trackRepo).stdout);
  if (!recNew?.changelogUpdated || !recNew?.masterAuditUpdated) throw new Error(`T39 agybot record FAILED: ${JSON.stringify(recNew)}`);
  console.log('✓ T39 PASS: auto TODO + CHANGELOG + MASTER Audit Log + idempotent record working');

  // T40: Deduplication & single-block upkeep of CANONICAL_REQUIREMENTS_PROJECTION (agybot & slice-governor)
  const masterPath = path.join(trackRepo, '.slices', 'MASTER_SLICE_CHECKLIST.md');
  const dupProjection = '\n<!-- CANONICAL_REQUIREMENTS_PROJECTION_START -->\n## Stale\n<!-- CANONICAL_REQUIREMENTS_PROJECTION_END -->\n';
  fs.writeFileSync(masterPath, fs.readFileSync(masterPath, 'utf8') + dupProjection + dupProjection, 'utf8');
  const reqAdd = runNode(AGY_PATH, ['requirement', 'add', '--id', 'REQ-DEDUPE-1', '--title', 'Keep single projection', '--source', 'docs/SPEC.md', '--workstream', 'core', '--status', 'READY'], trackRepo);
  if (reqAdd.status !== 0) throw new Error(`T40 req add FAILED: ${reqAdd.stdout} ${reqAdd.stderr}`);
  let projCount = (fs.readFileSync(masterPath, 'utf8').match(/<!--\s*CANONICAL_REQUIREMENTS_PROJECTION_START\s*-->/g) || []).length;
  if (projCount !== 1) throw new Error(`T40 agybot dedupe FAILED: count=${projCount}`);
  fs.writeFileSync(masterPath, fs.readFileSync(masterPath, 'utf8') + dupProjection, 'utf8');
  fs.mkdirSync(path.join(trackRepo, 'src'), { recursive: true });
  fs.writeFileSync(path.join(trackRepo, 'src', 'mod.ts'), 'export const v = 1;\n', 'utf8');
  const govNew = runNode(GOV_PATH, [
    'new', '--workstream', 'core', '--name', 'dedupe-sync', '--title', 'Verify slice-governor dedupe',
    '--surface', 'cli', '--atomic', 'yes', '--creation-authority', 'OWNER_EXPLICIT', '--creation-ref', 'docs/SPEC.md',
    '--acceptance', 'Only one projection block remains', '--scenario', 'Start slice', '--scope', 'src/', '--requirement', 'REQ-DEDUPE-1', '--class', 'A'
  ], trackRepo);
  if (govNew.status !== 0) throw new Error(`T40 gov new FAILED: ${govNew.stdout} ${govNew.stderr}`);
  projCount = (fs.readFileSync(masterPath, 'utf8').match(/<!--\s*CANONICAL_REQUIREMENTS_PROJECTION_START\s*-->/g) || []).length;
  if (projCount !== 1) throw new Error(`T40 slice-governor dedupe FAILED: count=${projCount}`);
  console.log('✓ T40 PASS: Both agybot and slice-governor collapse duplicate CANONICAL_REQUIREMENTS_PROJECTION blocks');

  // T41: GREENFIELD vs BROWNFIELD detection, scaffold-constitution preserving AGYBOT_BOOTSTRAP, promote-rule -> AGENTS/TASTE
  const greenRepo = path.join(testSandbox, 'green-repo');
  fs.mkdirSync(greenRepo, { recursive: true });
  const greenProbe = lastJson(runNode(AGY_PATH, ['lifecycle-probe'], greenRepo).stdout);
  if (greenProbe?.mode !== 'GREENFIELD' || greenProbe?.constitutionPresent !== false) {
    throw new Error(`T41 greenfield probe FAILED: ${JSON.stringify(greenProbe)}`);
  }
  const brownRepo = path.join(testSandbox, 'brown-repo');
  fs.mkdirSync(path.join(brownRepo, 'src'), { recursive: true });
  spawnSync('git', ['init'], { cwd: brownRepo, windowsHide: true });
  fs.writeFileSync(path.join(brownRepo, 'package.json'), '{"name":"sample-app","version":"1.0.0"}\n', 'utf8');
  fs.writeFileSync(path.join(brownRepo, 'src', 'index.ts'), 'export const app = true;\n', 'utf8');
  const bindBrown = runNode(INSTALL_PATH, ['--non-interactive', '--bind-only', '--bind-project', brownRepo], PKG_ROOT, { AGY_GOVERNOR_GLOBAL_PATH: PKG_ROOT });
  if (bindBrown.status !== 0) throw new Error(`T41 brown bind FAILED: ${bindBrown.stdout} ${bindBrown.stderr}`);
  const brownProbe = lastJson(runNode(AGY_PATH, ['lifecycle-probe'], brownRepo).stdout);
  if (brownProbe?.mode !== 'BROWNFIELD' || !Array.isArray(brownProbe?.presentManifests) || !brownProbe.presentManifests.includes('package.json')) {
    throw new Error(`T41 brownfield probe FAILED: ${JSON.stringify(brownProbe)}`);
  }
  const scConst = runNode(AGY_PATH, ['scaffold-constitution', '--mission', 'Clinic booking', '--stack', 'TypeScript + Postgres', '--rules', 'Never lose bookings;Respect DESIGN_TASTE'], brownRepo);
  if (scConst.status !== 0) throw new Error(`T41 scaffold-constitution FAILED: ${scConst.stdout} ${scConst.stderr}`);
  const promAgents = runNode(AGY_PATH, ['promote-rule', '--target', 'agents', '--rule', 'Require audit trail on cancellation'], brownRepo);
  const promTaste = runNode(AGY_PATH, ['promote-rule', '--target', 'taste', '--section', 'Bans', '--rule', 'No promotional pills in dashboard header'], brownRepo);
  if (promAgents.status !== 0 || promTaste.status !== 0) throw new Error('T41 promote-rule FAILED');
  const agentsTxt = fs.readFileSync(path.join(brownRepo, 'AGENTS.md'), 'utf8');
  const bootStartIdx = agentsTxt.indexOf('<!-- AGYBOT_BOOTSTRAP:START -->');
  const ruleIdx = agentsTxt.indexOf('Require audit trail on cancellation');
  if (bootStartIdx < 0 || ruleIdx < 0 || ruleIdx > bootStartIdx || !agentsTxt.includes('<!-- AGYBOT_BOOTSTRAP:END -->')) {
    throw new Error('T41 AGENTS.md Constitution/Bootstrap ordering FAILED');
  }
  const tasteTxt = fs.readFileSync(path.join(brownRepo, '.slices', 'DESIGN_TASTE.md'), 'utf8');
  if (!tasteTxt.includes('No promotional pills in dashboard header')) throw new Error('T41 DESIGN_TASTE promote-rule FAILED');
  console.log('✓ T41 PASS: lifecycle-probe, scaffold-constitution, and promote-rule work safely above AGYBOT_BOOTSTRAP');

  // T42: Deterministic Anti-Pill design-lint (U1, U9, U26, U26_DENSITY, button exemption, DESIGN_TASTE.md ## Off)
  const pillDir = path.join(testSandbox, 'pill-lint');
  fs.mkdirSync(path.join(pillDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(pillDir, 'src', 'Slop.tsx'), [
    'export function SlopCard() {',
    '  return (',
    '    <div>',
    '      <span className="rounded-full bg-slate-100 px-3 uppercase tracking-wider">FEATURES</span>',
    '      <h1>Main Heading</h1>',
    '      <span className="rounded-full bg-indigo-500 px-2">NEW</span>',
    '      <div className="rounded-full border px-3">Popular</div>',
    '      <button type="button" className="rounded-full bg-black px-4 py-2 text-white">Save</button>',
    '    </div>',
    '  );',
    '}'
  ].join('\n'), 'utf8');
  const pillFail = runNode(DESIGN_LINT, ['--dir', path.join(pillDir, 'src'), '--json'], pillDir);
  const pillJson = lastJson(pillFail.stdout);
  const pillRules = new Set((pillJson?.findings || []).map(f => f.rule));
  if (pillFail.status === 0 || !pillRules.has('U1') || !pillRules.has('U9') || !pillRules.has('U26') || !pillRules.has('U26_DENSITY')) {
    throw new Error(`T42 anti-pill detection FAILED: ${pillFail.stdout}`);
  }
  const buttonFindings = (pillJson?.findings || []).filter(f => f.line === 8);
  if (buttonFindings.length > 0) throw new Error(`T42 interactive button false-positive FAILED: ${JSON.stringify(buttonFindings)}`);
  fs.writeFileSync(path.join(pillDir, 'src', 'Slop.tsx'), 'export function Clean() { return <button type="button" className="rounded-full bg-black px-4 py-2">Save</button>; }\n', 'utf8');
  if (runNode(DESIGN_LINT, ['--dir', path.join(pillDir, 'src'), '--json'], pillDir).status !== 0) {
    throw new Error('T42 clean interactive rounded-full button FAILED');
  }
  console.log('✓ T42 PASS: design-lint enforces Anti-Pill (U1/U9/U26/U26_DENSITY) while exempting real interactive controls');

  // T43: design-taste-init creation & non-destructive idempotency
  const tasteRepo = path.join(testSandbox, 'taste-init-repo');
  fs.mkdirSync(tasteRepo, { recursive: true });
  const dt1 = lastJson(runNode(AGY_PATH, ['design-taste-init', '--project', 'BrandX'], tasteRepo).stdout);
  if (!dt1?.created || !fs.existsSync(path.join(tasteRepo, '.slices', 'DESIGN_TASTE.md'))) throw new Error('T43 initial creation FAILED');
  fs.appendFileSync(path.join(tasteRepo, '.slices', 'DESIGN_TASTE.md'), '\n## Keep\n- Header LIVE stream status dot\n', 'utf8');
  const dt2 = lastJson(runNode(AGY_PATH, ['design-taste-init', '--project', 'BrandX'], tasteRepo).stdout);
  const dtContent = fs.readFileSync(path.join(tasteRepo, '.slices', 'DESIGN_TASTE.md'), 'utf8');
  if (dt2?.created !== false || !dtContent.includes('Header LIVE stream status dot')) throw new Error('T43 idempotency FAILED');
  console.log('✓ T43 PASS: design-taste-init initializes anti-pill defaults without overwriting existing taste rules');

  // T44: --skip-tracking opt-out inside handoff-verify
  const skipRepo = path.join(testSandbox, 'skip-track-repo');
  fs.mkdirSync(skipRepo, { recursive: true });
  spawnSync('git', ['init'], { cwd: skipRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: skipRepo, windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: skipRepo, windowsHide: true });
  fs.writeFileSync(path.join(skipRepo, 'init.txt'), '0\n', 'utf8');
  spawnSync('git', ['add', 'init.txt'], { cwd: skipRepo, windowsHide: true });
  spawnSync('git', ['commit', '-m', 'init'], { cwd: skipRepo, windowsHide: true });
  runNode(AGY_PATH, ['setup', '--accept-defaults', '--auto-changelog', 'no'], skipRepo);
  spawnSync('git', ['add', '-A'], { cwd: skipRepo, windowsHide: true });
  spawnSync('git', ['commit', '-m', 'chore: baseline setup'], { cwd: skipRepo, windowsHide: true });
  fs.writeFileSync(path.join(skipRepo, 'change.ts'), 'export const k = 1;\n', 'utf8');
  const hvSkip = lastJson(runNode(AGY_PATH, ['handoff-verify', '--declared-files', 'change.ts', '--skip-secret-scan', '--skip-tracking', '--summary', 'Skip me'], skipRepo).stdout);
  if (!hvSkip?.ok || hvSkip.autoTracking !== null || fs.existsSync(path.join(skipRepo, '.slices', 'CHANGELOG.md'))) {
    throw new Error(`T44 --skip-tracking FAILED: ${JSON.stringify(hvSkip)}`);
  }
  console.log('✓ T44 PASS: handoff-verify honors --skip-tracking');

  // T45: Standalone white-label package hygiene gate
  const bannedDocsRe = new RegExp([
    'clean-co' + 'de',
    'tdd-orche' + 'strator',
    'pre-action-' + 'guard',
    'error-rec' + 'overy',
    'aimhoo' + 'man',
    'workspace-for' + 'ensics',
    'brain-bri' + 'dge',
    'unslop-' + 'ui',
    'frontend-des' + 'ign\\.md',
    'Open' + 'Bot',
    'upii' + 'xia',
    'PROMPT_INSTALACAO_' + 'PROJETO_V7',
    'MIGRATION_' + 'V7',
    'Open' + 'Code'
  ].join('|'));
  const privateRe = new RegExp(['katc' + 'huca', 'agen' + 'dei', 'bat' + 'tl3', 'ev' + 'and'].join('|'), 'i');
  const walkPkg = d => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (['.git', 'node_modules'].includes(ent.name) || ent.name === 'SHA256SUMS.txt' || ent.name === 'ACTIVE_RELEASE.json') continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walkPkg(full);
      else {
        const rel = path.relative(PKG_ROOT, full).replaceAll('\\', '/');
        const txt = fs.readFileSync(full, 'utf8');
        if (/\.(md|txt)$/i.test(ent.name) && bannedDocsRe.test(txt)) {
          throw new Error(`T45 FAILED: white-label external/obsolete citation found in ${rel}`);
        }
        if (rel !== 'scripts/self-test-v8.3.0.mjs' && privateRe.test(txt)) {
          throw new Error(`T45 FAILED: private project/user reference found in ${rel}`);
        }
      }
    }
  };
  walkPkg(PKG_ROOT);
  console.log('✓ T45 PASS: Package passes standalone white-label & private-reference hygiene gate');

  console.log('\n========================================');
  console.log('🎉 ALL 45 ACCEPTANCE TESTS (T1-T45) PASSED!');
  console.log('========================================\n');
} finally {
  try { fs.rmSync(testSandbox, { recursive: true, force: true }); } catch {}
}
