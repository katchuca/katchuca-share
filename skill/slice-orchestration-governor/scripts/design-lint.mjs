#!/usr/bin/env node
/**
 * Static UI & Anti-Slop / Anti-Pill Linter for Slice Orchestration Governor v8.3.0.
 * Enforces AGY_UX_V2 heuristics with project taste file (.slices/DESIGN_TASTE.md) precedence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const out = { file: null, dir: null, changed: false, base: 'main', surface: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' && argv[i + 1]) out.file = argv[++i];
    else if (a === '--dir' && argv[i + 1]) out.dir = argv[++i];
    else if (a === '--changed') { out.changed = true; if (argv[i + 1] && !argv[i + 1].startsWith('--')) out.base = argv[++i]; }
    else if (a === '--surface') out.surface = true;
    else if (a === '--json') out.json = true;
  }
  return out;
}

function loadDisabledRules(root) {
  const disabled = new Set();
  for (const rel of ['.slices/DESIGN_TASTE.md', '.unslop-ui/taste.md']) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
    let inOff = false;
    for (const l of lines) {
      if (/^##\s+Off\b/i.test(l)) { inOff = true; continue; }
      if (/^##\s+/.test(l)) { inOff = false; continue; }
      if (inOff) {
        const m = l.match(/[-*]\s*(U\d+(?:_DENSITY)?|T\d+)/i);
        if (m) disabled.add(m[1].toUpperCase());
      }
    }
  }
  return disabled;
}

function collectUiFiles(dir, root, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist', 'build', '.slices', '.agents'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) collectUiFiles(full, root, acc);
    else if (/\.(tsx|jsx|css|html)$/i.test(ent.name)) acc.push(path.relative(root, full).replaceAll('\\', '/'));
  }
  return acc;
}

function changedUiFiles(root, base) {
  const p = spawnSync('git', ['diff', '--name-only', '--diff-filter=ACMR', base], { cwd: root, encoding: 'utf8', windowsHide: true });
  const files = p.status === 0 ? p.stdout.split(/\r?\n/).filter(Boolean) : [];
  const statusP = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (statusP.status === 0) {
    for (const line of statusP.stdout.split(/\r?\n/)) {
      const m = line.match(/^..\s+(.+)$/);
      if (m) files.push(m[1].trim().replaceAll('"', ''));
    }
  }
  return [...new Set(files)].filter(f => /\.(tsx|jsx|css|html)$/i.test(f));
}

const isInteractiveLine = l => /<(?:button|a|input|select|textarea)\b|onClick=|onChange=|href=|role=["'](?:button|tab|switch|link)["']|type=["'](?:submit|button)["']/i.test(l);
const isNonPillCircle = l => /\b(?:avatar|spinner|animate-spin|sr-only|aria-hidden|switch|toggle|progress|skeleton)\b/i.test(l)
  || (/\bw-(?:1|1\.5|2|2\.5|3|3\.5|6|7|8|9|10|11|12|14|16)\b/.test(l) && /\bh-(?:1|1\.5|2|2\.5|3|3\.5|6|7|8|9|10|11|12|14|16)\b/.test(l) && !/\bpx-\d+/.test(l));

const CHECKS = [
  {
    id: 'U1', surface: false,
    re: /<(?:span|div|p)\b[^>]*?(?:\brounded-full\b|\buppercase\b[^>\n]*\btracking-(?:wider|widest)\b)/i,
    guard: (l, lines, idx) => {
      if (isInteractiveLine(l)) return false;
      const nearby = lines.slice(idx + 1, idx + 5).join('\n');
      return /<h[1-3]\b/i.test(nearby);
    },
    msg: 'Decorative eyebrow label/pill above heading (U1: let the heading carry the hierarchy)'
  },
  {
    id: 'U9', surface: false,
    re: /<(?:span|div)\b[^>]*?(?:\brounded-full\b|\bbadge\b|\bpill\b)[^>]*>[^<{]*\b(?:LIVE|AO VIVO|NEW|NOVO|AI|IA|PRO|BETA|FREE|GR[AÁ]TIS|HOT|POPULAR|FEATURED|RECOMMENDED)\b/i,
    guard: l => !isInteractiveLine(l) && !/\{[^}]*(?:&&|\?)/.test(l),
    msg: 'Hardcoded promotional/status badge without live conditional state (U9)'
  },
  {
    id: 'U26', surface: false,
    re: /<(?:span|div)\b[^>]*\brounded-full\b[^>]*>/i,
    guard: l => !isInteractiveLine(l) && !isNonPillCircle(l) && /\b(?:px-|py-|border\b|bg-)/i.test(l),
    msg: 'Non-interactive decorative rounded-full pill (U26: avoid pill clutter unless explicit button/tab or ## Keep)'
  },
  { id: 'U10', surface: false, re: /animate-pulse/, guard: l => !/skeleton|placeholder/i.test(l), msg: 'Static/decorative animate-pulse without skeleton semantics (only keep if bound to real live state)' },
  { id: 'U24', surface: false, re: /\b(border-l-4|border-t-\[3px\]|border-r-4|shadow-\[inset_4px_0_0_)/, guard: l => !/role=["']alert["']|alert|error|warning/i.test(l), msg: 'Unsemantic colored edge accent stripe (AI tell U24)' },
  { id: 'U19', surface: false, re: /\b(font-black|font-extrabold)\b|font-weight\s*:\s*(800|900)\b/, guard: () => true, msg: 'Extra-heavy font weight (U19: prefer 500/600 tokens unless canonical)' },
  { id: 'U20', surface: false, re: /\b(transition-all|animate-bounce|whileInView)\b/, guard: () => true, msg: 'Decorative motion / transition-all (U20: transition explicit properties at 150ms)' },
  { id: 'U18', surface: false, re: /\b(m|p|gap|space)[trblxy]?-\[(\d+)px\]/, guard: l => {
    const m = l.match(/\b(?:m|p|gap|space)[trblxy]?-\[(\d+)px\]/);
    if (!m) return false;
    const px = Number(m[1]);
    return px % 4 !== 0 && ![2, 6, 10, 14].includes(px);
  }, msg: 'Off-scale arbitrary spacing (U18: snap to project spacing tokens / 4px grid)' },
  { id: 'U17', surface: true, re: /\bbg-clip-text\b|shadow-\[0_0_\d+px_/, guard: () => true, msg: 'Decorative gradient text or colored glow (U17 --surface)' },
  { id: 'U21', surface: false, re: />[^<\n]{1,40}\s→\s*<\/|\b(Learn more|Saiba mais|Clique aqui|Click here)\s*→/, guard: () => true, msg: 'Decorative arrow glyph after button/link label (U21)' },
];

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const disabled = loadDisabledRules(root);

let targets = [];
if (args.file) {
  targets = [args.file];
} else if (args.changed) {
  targets = changedUiFiles(root, args.base);
} else if (args.dir) {
  targets = collectUiFiles(path.resolve(root, args.dir), root);
} else {
  for (const cand of ['web/src', 'src', 'app']) {
    if (fs.existsSync(path.join(root, cand))) {
      targets = collectUiFiles(path.join(root, cand), root);
      break;
    }
  }
}

const findings = [];
for (const rel of targets) {
  const abs = path.resolve(root, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  let nonInteractivePillsInFile = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/design-lint:\s*ok/i.test(line)) continue;
    for (const c of CHECKS) {
      if (disabled.has(c.id)) continue;
      if (c.surface && !args.surface) continue;
      if (c.re.test(line) && c.guard(line, lines, i)) {
        if (c.id === 'U26') nonInteractivePillsInFile++;
        findings.push({ file: rel, line: i + 1, rule: c.id, message: c.msg });
      }
    }
  }
  if (nonInteractivePillsInFile >= 3 && !disabled.has('U26_DENSITY') && !disabled.has('U26')) {
    findings.push({
      file: rel,
      line: 1,
      rule: 'U26_DENSITY',
      message: `Excessive pill density (${nonInteractivePillsInFile} non-interactive rounded-full pills in one file); flatten into clean typography or hairline borders.`
    });
  }
}

if (args.json) {
  console.log(JSON.stringify({ ok: findings.length === 0, filesScanned: targets.length, surfaceMode: args.surface, disabledRules: [...disabled], findings }, null, 2));
} else if (findings.length > 0) {
  for (const f of findings.slice(0, 40)) console.log(`DESIGN_LINT ${f.file}:${f.line} [${f.rule}] ${f.message}`);
  if (findings.length > 40) console.log(`DESIGN_LINT ... +${findings.length - 40} more`);
  console.log(`DESIGN_LINT_FAIL findings=${findings.length} files=${targets.length}`);
} else {
  console.log(`DESIGN_LINT_PASS files=${targets.length} surface=${args.surface}`);
}
process.exit(findings.length > 0 ? 1 : 0);
