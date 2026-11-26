#!/usr/bin/env node
/**
 * Secret Scanner for Slice Orchestration Governor v8.0.0.
 * Inspects staged, tracked, or directory files without ever printing secret values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const out = { mode: 'tracked', dir: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--staged') out.mode = 'staged';
    else if (a === '--tracked') out.mode = 'tracked';
    else if (a === '--dir' && argv[i + 1]) { out.mode = 'dir'; out.dir = argv[++i]; }
    else if (a === '--json') out.json = true;
  }
  return out;
}

const ENV_ALLOW = /^\.env\.(example|sample|template|dist)$/i;
const RULES = [
  { id: 'SEC_PRIVATE_KEY', re: /-----BEGIN ([A-Z0-9 ]+ )?PRIVATE KEY-----/ },
  { id: 'SEC_CLOUD_ACCESS', re: /\b(AKIA|ASIA)[A-Z0-9]{16}\b|\bAIza[A-Za-z0-9_-]{35}\b/ },
  { id: 'SEC_GITHUB', re: /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { id: 'SEC_ANTHROPIC', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'SEC_OPENAI', re: /\b(sk-proj-[A-Za-z0-9_-]{20,}|sk-svcacct-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,})\b/ },
  { id: 'SEC_SLACK', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'SEC_CLOUD_SECRET', re: /(aws_secret_access_key|aws_session_token|accountkey)[\s"'=:]+[a-z0-9+/=]{40,}/i },
];

function gitFiles(root, mode) {
  const args = mode === 'staged'
    ? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
    : ['ls-files', '-z'];
  const p = spawnSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (p.status !== 0) return null;
  return p.stdout.split('\0').filter(Boolean);
}

function walkDir(dir, base = dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist', 'build'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(full, base, acc);
    else acc.push(path.relative(base, full).replaceAll('\\', '/'));
  }
  return acc;
}

function readTargetContent(root, rel, mode) {
  if (mode === 'staged') {
    const p = spawnSync('git', ['show', `:${rel}`], { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
    return p.status === 0 ? p.stdout : '';
  }
  const abs = path.resolve(root, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return '';
  if (fs.statSync(abs).size > 2 * 1024 * 1024) return '';
  return fs.readFileSync(abs, 'utf8');
}

const args = parseArgs(process.argv.slice(2));
const root = args.mode === 'dir' && args.dir ? path.resolve(args.dir) : process.cwd();
const files = args.mode === 'dir' ? walkDir(root) : (gitFiles(root, args.mode) ?? walkDir(root));

const findings = [];
for (const rel of files) {
  const base = path.basename(rel);
  if ((base === '.env' || base.startsWith('.env.')) && !ENV_ALLOW.test(base)) {
    findings.push({ path: rel, line: 1, rule: 'SEC_ENV_FILE' });
  }
  if (/\.(png|jpe?g|webp|gif|ico|woff2?|ttf|zip|pdf|mp4|lock)$/i.test(base)) continue;
  const text = readTargetContent(root, rel, args.mode);
  if (!text || text.includes('\u0000')) continue;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        findings.push({ path: rel, line: i + 1, rule: rule.id });
      }
    }
  }
}

if (args.json) {
  console.log(JSON.stringify({ ok: findings.length === 0, mode: args.mode, filesScanned: files.length, findings }, null, 2));
} else if (findings.length > 0) {
  for (const f of findings) console.error(`SECRET_FOUND: ${f.path}:${f.line} ${f.rule}`);
  console.error(`SECRET_SCAN_FAILED findings=${findings.length} files=${files.length} mode=${args.mode}`);
} else {
  console.log(`SECRET_SCAN_PASS files=${files.length} mode=${args.mode}`);
}
process.exit(findings.length > 0 ? 1 : 0);
