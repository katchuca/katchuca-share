# Antigravity Native Hook Enforcement — v8.0.1

## Primary Control Plane (`.agents/hooks.json`)
Managed key: `agybot-v8` (legacy key `agybot-v7` is automatically upgraded/migrated while preserving unrelated project hook keys). Because Antigravity may execute hook commands with `CWD = .agents/`, `install.mjs --bind-project` writes an **absolute** path per machine (`node "<PROJECT_ROOT>/.slices/agy-hook.mjs" <event>`), forwarding with `AGY_PROJECT_ROOT` & `SLICE_GOVERNOR_ROOT` to the single global canonical engine (`~/.gemini/config/skills/slice-orchestration-governor/scripts/antigravity-hook.mjs`). Use `--self-check` for non-blocking startup verification in launch scripts.

## Events

### SessionStart
- Identifies whether the conversation is `COORDINATOR` or an active specialist.
- Injects `AGY_HOOKS_V8_ACTIVE=TRUE`, `AGY_HOOK_ROLE`, active `TODO_LEDGER` / `CHANGELOG_LEDGER`, `SWARM_POLICY`, and `ORCHESTRATION_TRANSPORT` (`NATIVE_SUBAGENTS` by default).

### PreInvocation
- Aggregates consecutive human messages in the current turn (`collectTurnPrompts`) so addenda/queued messages preserve existing receipts (`TURN_ADDENDUM_ATTACHED=TRUE`) and never downgrade budget to `ZERO`.
- Automatically executes `agybot intake` once per real human Coordinator turn and persists the receipt in `.slices/AGY_HOOK_STATE.json`.
- Passes compact pointers/status markers (`AGY_HOOK_INTAKE_RECEIPT`, `RISK_CLASS`, `REQUIRED_ROLES`, `TODO_LEDGER`, `TRACKING_MODE`).

### PreToolUse (Fail-Closed + Segmented Command Guard)
Parses shell commands across `;`, `&&`, `||`, `|`, and newlines so chained dangerous commands cannot bypass checks:
- **Anti-Destruction (Item 1):** strictly blocks `git checkout` on files/paths, `git restore`, `git reset`, `git stash`, `git clean -f`, `git push --force`, `rm -rf`, `rmdir /s /q`. Safe file reverts require physical backup in `.scratch/` with SHA-256.
- **Schema Protection (Item 1):** blocks `npx prisma format` and `npx prisma db pull` in `READ_ONLY` / discovery / `mutationBudget=ZERO` turns.
- **Secret Protection (`guard`):** blocks reading `.env` files via shell (`cat .env`, `Get-Content .env`, `< .env`, excluding `.env.example`/`.sample`/`.template`) and blocks `git commit --no-verify` / `-n` bypasses.
- **Remote Deploy & Worktree Fast-Path:** allows `ssh`, `scp`, `rsync`, `docker`, `docker compose`, `wrangler`, `kubectl`, and `git worktree` when batch authorization is declared (`MODE = EXECUTE`, `DEPLOY = YES`, etc.) without blocking non-destructive infra batches.
- **Native Subagents (`v8`):** `invoke_subagent`, `send_message`, and `manage_subagents` are **AUTHORIZED** under `orchestrationTransport = NATIVE_SUBAGENTS` (default) so Coordinator can dispatch clean read-only `SPEC`/`research`, isolated `QA`/`R2` verifiers, and `Code/Security Review` subagents! Only blocked if a project explicitly opts into `AGENTAPI_ONLY`.
- **Actionable Denial (`BLOQUEADO_POR_INTAKE`):** every intake denial prints the exact unblock command (`node .slices/agybot.mjs intake --directive "<id>"`) and warns: **NUNCA leia o código-fonte do hook**.
- **Friction Blackbox Telemetry:** records hook denials anonymously to `.slices/FRICTION_LOG.jsonl` so recurring friction patterns are visible.

### Stop
- Returns `{ decision: 'allow' }` immediately for idle Coordinator turns (zero queue deadlocks).
- Bounds specialist stop-continue checks if an active specialist phase is incomplete.
