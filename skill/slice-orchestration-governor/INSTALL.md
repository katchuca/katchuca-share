# Install — Slice Orchestration Governor v8.3.0

## Distribution model (GitHub & Cross-Machine Plug-and-Play)

One clean global engine per user/machine:

```text
~/.gemini/config/skills/slice-orchestration-governor
```

When upgrading, the single prior version backup is kept **outside discovery** at `~/.gemini/backups/skills/slice-orchestration-governor-prev` (maximum 1 backup, zero stale shadows inside `~/.gemini/config/skills/`).

Each bound repository stays clean:
- Portable forwarders in `.slices/` (`agy-hook.mjs`, `agybot.mjs`, `slice-governor.mjs`, `secret-scan.mjs`, `design-lint.mjs`, `q.mjs`) pointing to `~/.gemini/config/skills/slice-orchestration-governor`;
- Managed Antigravity hook key `agybot-v8` in `.agents/hooks.json` using normalized machine-local absolute paths (CWD-resilient even when Antigravity runs hooks from `.agents/`);
- `.slices/`, `.agy-vault/`, `.agy-backups/`, `.scratch/` (plus untracked `.agents/hooks.json`) automatically added to local `.git/info/exclude` so Git stays clean for PRs and GitHub cloning;
- Managed fallback/bootstrap block in `AGENTS.md`.

## Quick Install / Upgrade (Any Computer)

**Windows:** extract the release folder or clone from GitHub and run `INSTALAR_WINDOWS.bat`

**macOS / Linux:**
```bash
bash INSTALAR_MAC_LINUX.sh
```

Or install global engine only via CLI:
```bash
node scripts/install.mjs --non-interactive --global-only
```

## Bind or Upgrade Any Existing Project

Inside (or targeting) any project repository:
```bash
node ~/.gemini/config/skills/slice-orchestration-governor/scripts/install.mjs --non-interactive --bind-only --bind-project /path/to/project
```

Check full environment readiness (Git, Node, Python, Zero-Shadow, hooks, and browser Chrome Remote Debugging `chrome://inspect/#remote-debugging` vs Playwright):
```bash
node .slices/agybot.mjs doctor
```

Existing `onboardedAt`, Vault, `tracking`, and project rules are preserved automatically (zero re-onboarding), while predictive v8.3.0 Total Autonomy defaults (`autoLearn`, `autoUpdateTodo`, `autoUpdateChangelog`, `autoRepairMaxRounds=3`, `testIntegrityGuard`, `browserTesting`) are enabled seamlessly.

## Authoritative Verification Gate

```bash
node --check scripts/agybot.mjs scripts/autonomy-engine.mjs scripts/antigravity-hook.mjs scripts/install.mjs scripts/slice-governor.mjs scripts/secret-scan.mjs scripts/design-lint.mjs scripts/q.mjs scripts/self-test-v8.3.0.mjs
node scripts/self-test-v8.3.0.mjs
```
