#!/usr/bin/env node
/**
 * Quiet Unpiped Runner + Loop Breaker (v8.0.0, inspired by UAK `q`).
 * Preserves exact exit codes, stores full log in .slices/logs/, returns 1 line on success
 * or bounded tail on failure, and raises LOOP_DETECTED after 2 identical failures.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
let tailLines = Number(process.env.Q_LINES || 40);
let sepIdx = argv.indexOf('--');
const cmdArgs = sepIdx >= 0 ? argv.slice(sepIdx + 1) : argv;
if (argv[0] === '--lines' && argv[1]) {
  tailLines = Number(argv[1]) || 40;
  const start = sepIdx >= 0 ? sepIdx + 1 : 2;
  cmdArgs.splice(0, cmdArgs.length, ...argv.slice(start));
}
if (!cmdArgs.length) {
  console.error('Usage: node scripts/q.mjs [--lines 40] -- <command...>');
  process.exit(2);
}

const root = process.cwd();
const slicesDir = process.env.SLICE_GOVERNOR_ROOT ? path.resolve(process.env.SLICE_GOVERNOR_ROOT) : path.join(root, '.slices');
const logsDir = path.join(slicesDir, 'logs');
fs.mkdirSync(logsDir, { recursive: true });

// Keep last 20 q logs
try {
  const existing = fs.readdirSync(logsDir).filter(n => /^q-\d+-\d+\.log$/.test(n)).sort();
  for (const old of existing.slice(0, Math.max(0, existing.length - 19))) {
    fs.rmSync(path.join(logsDir, old), { force: true });
  }
} catch {}

const logPath = path.join(logsDir, `q-${Date.now()}-${process.pid}.log`);
const sigPath = path.join(logsDir, 'q-last-fail.json');
const started = Date.now();
const cmdLine = cmdArgs.join(' ');

let res = cmdArgs.length === 1
  ? spawnSync(cmdArgs[0], { cwd: root, shell: true, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 })
  : spawnSync(cmdArgs[0], cmdArgs.slice(1), { cwd: root, shell: false, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
if (res.error && res.error.code === 'ENOENT' && cmdArgs.length > 1) {
  res = spawnSync(cmdArgs.join(' '), { cwd: root, shell: true, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
}

const combined = `${res.stdout || ''}${res.stderr ? `\n${res.stderr}` : ''}`;
fs.writeFileSync(logPath, combined, 'utf8');
const secs = ((Date.now() - started) / 1000).toFixed(1);
const code = res.status ?? 1;
const lines = combined.split(/\r?\n/);
const nonEmpty = lines.filter(l => l.trim().length > 0);

if (code === 0) {
  try { fs.rmSync(sigPath, { force: true }); } catch {}
  const last = (nonEmpty[nonEmpty.length - 1] || '-').slice(0, 160);
  console.log(`OK exit=0 ${secs}s · ${last}`);
  process.exit(0);
}

console.log(`FAIL exit=${code} ${secs}s · ${lines.length} lines · log ${logPath}`);
for (const l of lines.slice(-tailLines)) console.log(l.slice(0, 300));

const cmdSig = crypto.createHash('sha256').update(cmdLine).digest('hex').slice(0, 16);
const normTail = nonEmpty.slice(-15).join('\n').replace(/\d+/g, 'N');
const failSig = crypto.createHash('sha256').update(normTail).digest('hex').slice(0, 16);

let prev = {};
try { prev = JSON.parse(fs.readFileSync(sigPath, 'utf8')); } catch {}
const count = prev.cmdSig === cmdSig && prev.failSig === failSig ? Number(prev.count || 1) + 1 : 1;
fs.writeFileSync(sigPath, JSON.stringify({ cmdSig, failSig, count, updatedAt: new Date().toISOString() }, null, 2) + '\n', 'utf8');

if (count >= 2) {
  try {
    const qQueue = path.join(logsDir, 'AUTO_LEARNINGS_QUEUE.jsonl');
    fs.appendFileSync(qQueue, JSON.stringify({ ts: new Date().toISOString(), type: 'LOOP_DETECTED', cmd: cmdLine.slice(0, 120), count, tailHash: failSig, logPath }) + '\n', 'utf8');
  } catch {}
  console.log(`LOOP_DETECTED: esta checagem falhou exatamente igual ${count} vezes seguidas. Pare de tentar a mesma abordagem cegamente: releia o erro no log e mude a hipótese ou escale ao Coordenador.`);
}
process.exit(code);
