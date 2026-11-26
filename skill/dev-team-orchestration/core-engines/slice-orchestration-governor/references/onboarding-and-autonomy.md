# Agy Bot Onboarding, Total Autonomy & HAWD — v8.3.0

## Core Principle: Zero Manual Initiative (`AUTONOMY_FIRST`)
Agy Bot operates **autonomously by default** on every project unless the owner explicitly selects `BALANCED`, `OWNER_GUIDED`, or `MANUAL_ONLY` during onboarding. Users never have to remember to invoke `todo`, `learn`, `sources-refresh`, `test-integrity`, or retry handoffs manually:
- `intake` automatically refreshes `LIVING` canonical sources and captures/promotes recurring learnings from `FRICTION_LOG.jsonl` and `q.mjs` loops.
- `dispatch` and verified `handoff-verify` / `record` automatically keep `TODO.md`, `CHANGELOG.md`, and `MASTER_SLICE_CHECKLIST.md` up to date (zero duplicate requirement projections).
- `q.mjs` logs bounded command failures and trips `LOOP_DETECTED` after 2 identical failures.
- Self-repair loops run up to `autoRepairMaxRounds` (`3` by default) before interrupting via `hawd` + `ask_question`.
- `handoff-verify` automatically enforces physical file parity, `secret-scan`, and Layer-2 `test-integrity`.

## Global Install vs. Zero Re-Onboarding Across Upgrades
- Single global engine at `~/.gemini/config/skills/slice-orchestration-governor`, keeping at most 1 previous version backup outside discovery (`~/.gemini/backups/skills/slice-orchestration-governor-prev`).
- Upgrading the global skill upgrades every bound project immediately while preserving `onboardedAt`, `visualAcceptancePolicy`, `browserTesting`, `tracking`, and autonomy choices.
- `.slices/`, `.agy-vault/`, `.agy-backups/`, `.scratch/` (plus untracked `.agents/hooks.json`) live in local `.git/info/exclude` for 100% clean `git status`.

## First-Use Conversational Onboarding (`/grill-me` / `/agybot setup`)
Run `node .slices/agybot.mjs doctor` / `project-probe`, then present onboarding questions via real interactive `ask_question` UI (one at a time, preserving defaults for Total Autonomy):

1. **Autonomy level (`autonomy`):** `AUTONOMY_FIRST` *(recommended — Total Autonomy)* | `BALANCED` | `OWNER_GUIDED`
2. **Orchestration mode (`swarm`):** `QUALIFIED_AUTO` *(recommended — native isolated subagents by Class A/B/C/D)* | `EXPLICIT_ONLY` | `ENGINEERING_ALWAYS`
3. **Engineering Vault (`vault-mode`):** `PROJECT_LOCAL` (`.agy-vault`) | `AGY_GLOBAL` | `CUSTOM`
4. **Visual Acceptance Policy (`visual`):** `HUMAN_MANUAL` | `HYBRID` | `AUTOMATED_FOCUSED`
5. **Slices, TODO/Checklist & Changelog Tracking (`tracking-mode`):** `GOVERNOR_MANAGED` vs `PROJECT_OWN_DOCS`
6. **Browser Verification & Debugging Mode (`browser-mode`):**
   - `CHROME_DEVTOOLS_OR_PLAYWRIGHT` *(recommended — Playwright headless when available + Antigravity `chrome_devtools` MCP via external Chrome `chrome://inspect/#remote-debugging`)*
   - `CHROME_DEVTOOLS` | `PLAYWRIGHT_HEADLESS` | `MANUAL_ONLY`
   - Includes exact Chrome setup note (`chrome://inspect/#remote-debugging` -> enable Remote debugging -> click Allow).
7. **Final Step — Interactive Conversational Shortcut Tour (`onboarding-tour`):**
   - **Mandatory in chat!** Even when the user selects Total Autonomy, the Coordinator finishes onboarding by presenting the optional manual shortcuts right inside the `/grill-me` prompt (`/agybot hawd`, `/agybot status`, `/agybot todo`, `/agybot doctor`, `/agybot browser-config`, `/agybot learn`, `/agybot setup`, `/agybot pause`) so the user starts knowing how to inspect or steer at any time.

## HAWD (`hawd` / `/agybot hawd`)
1. Inspect verified workspace/task state read-only (including uncommitted files > 24h warning).
2. Separate **Verified Progress**, **Agent-Solvable Next Steps**, and **Human Pending Blockers**.
3. Present blockers prioritized by impact (`ask_question`, max 3 per turn) with recommendation. Never ask for secrets/passwords in chat.
