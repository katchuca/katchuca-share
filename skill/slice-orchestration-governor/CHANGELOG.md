# v8.3.0 — Real Automatic Tracking, Greenfield/Brownfield Playbooks, Anti-Pill Gate & White-Label Hygiene

### Fixes & Reliability
- **Duplicate `CANONICAL_REQUIREMENTS_PROJECTION` Fix (`slice-governor.mjs` + `agybot.mjs`):** Fixed unescaped regex character class in `slice-governor.mjs` (`syncRequirementsProjectionInMaster`) and added `dedupeProjectionBlocks` in `autonomy-engine.mjs` so repeated projections in `MASTER_SLICE_CHECKLIST.md` collapse cleanly into one authoritative block.
- **Automatic End-to-End TODO, CHANGELOG & Non-Slice Audit Tracking:**
  - `cmdDispatch` opens TODO ledger entries automatically (`recordAutoTaskStart`).
  - Verified `handoff-verify` (and idempotent `agybot record`) checks off TODOs, prepends structured dated entries to `changelogPath` (`autoUpdateChangelog`), and writes lightweight Audit Log rows in `MASTER_SLICE_CHECKLIST.md` (`<!-- AUDIT_LOG_APPEND -->`) even when fixes/features/deploys bypass formal `gate.json` slices (`--skip-tracking` opts out).

### Architecture, Design & Lifecycle Upgrades
- **Greenfield & Brownfield Playbooks (`lifecycle-probe`, `scaffold-constitution`, `design-taste-init`, `promote-rule`):** Automatically detects repositories built from scratch vs existing codebases; writes Product Constitutions above `AGYBOT_BOOTSTRAP` in `AGENTS.md`; scaffolds `.slices/DESIGN_TASTE.md`; and routes chat feedback into `AGENTS.md`, `DESIGN_TASTE.md`, or Vault learnings (`references/greenfield-and-brownfield-playbooks.md`).
- **Deterministic Anti-Pill & Anti-Slop Design Gate (`design-lint.mjs` `U1`, `U9`, `U26`, `U26_DENSITY`):** Rejects eyebrow-pill spam above headings, fake hardcoded `NEW`/`AI`/`PRO`/`LIVE`/`FREE`/`BETA` pills, non-interactive `rounded-full` status pills, and `>= 3` pill overcrowding per file while exempting interactive buttons/links/tabs and respecting `.slices/DESIGN_TASTE.md` (`## Keep` / `## Off`).
- **100% Standalone White-Label Cleanup:** Removed external skill citations and obsolete v7 document links across docs, scripts, and runtime headers while keeping silent `.slices/DESIGN_TASTE.md` fallback compatibility.

# v8.2.0 — Total Autonomy, Universal Intent, Browser Preflight & Layer-2 Integrity

### Root Causes & Gaps Fixed
- **Language-agnostic human intent classification (`autonomy-engine.mjs` + `agybot.mjs`):** Replaced narrow PT/EN verb whitelisting with multilingual explicit `READ_ONLY` + pure-question detection and universal `AUTONOMY_FIRST` fallback (`SCOPED`), preventing lockouts on natural requests in Portuguese, Spanish, Japanese, Polish, German, French, etc.
- **Reliable mid-turn `intake --directive` unblock (`agybot.mjs` + `antigravity-hook.mjs`):** `BLOQUEADO_POR_INTAKE` now prints `--coordinator "<cid>"`; `cmdIntake` resolves the most recent active `COORDINATOR` in `AGY_HOOK_STATE.json` even when shell env omits `AGY_CURRENT_CONVERSATION_ID`; and directive-unlock preserves the turn's `lastPromptHash` so subsequent `PreInvocation` checks keep `SCOPED`.

### Total Autonomy & Quality Upgrades
- **Antigravity Chrome Debugging (`chrome://inspect/#remote-debugging`) + Playwright Preflight (`browser-verification-and-preflight.md` + `browser-config`):** Onboarding (`Q6`) and mid-task 1-click guided `/grill-me` handle Antigravity's `chrome_devtools` MCP change seamlessly, persist `browserTesting` presets, and enforce real pointer clicks, `console.error == 0`, desktop `1280x720` + mobile `390x844` overlap checks, and full page reload persistence.
- **Zero-Initiative Auto-Learning (`autoLearn` + `learn` + `q.mjs`):** `FRICTION_LOG.jsonl` recurrences and `q.mjs` `LOOP_DETECTED` events auto-capture into `.slices/AUTO_LEARNINGS.json` and `.agy-vault/learnings/` during `intake`, surfacing `AUTO_LEARNINGS_PENDING` in `SessionStart`.
- **Conversational Shortcut Tour at Onboarding End (`Q7`):** Even under Total Autonomy, onboarding finishes in chat by introducing optional manual commands (`/agybot hawd`, `status`, `todo`, `doctor`, `browser-config`, `learn`, `setup`, `pause`).
- **Layer-2 Anti-Cheating, Disjoint Scopes & Environment Doctor (`test-integrity`, `scope-check`, `doctor`):** Automatic `handoff-verify` checks catch `.skip`/`.only`, assertion reductions, unauthorized gate/lint config changes, and unpinned `package.json` dependencies without lockfile updates; `scope-check` detects parallel worker path collisions; `doctor` inspects Git/Node/Python/hooks/Zero-Shadow/browser readiness.
- **Closed Self-Repair Loop & Read-Only Reviewer Rigor (`v8-orchestration-and-subagents.md`):** Documented 3-round bounded Writer/QA self-repair loop, `Pre-Fix Red Check`, 7-Rung Escalation Selector, 1-sentence-per-file "Watermelon" summary, `file:line | 1-line fix` reviewer contract, optional Class C/D Cross-Model review, and Untrusted Content Firewall.

# v8.1.1 — Auto-Refreshing LIVING Canonical Sources & Recovery Verb Guarantees

### Fixes & Self-Healing Improvements
- **Auto-refresh for `LIVING` canonical sources (`refreshLivingSources` + `sources-refresh`):** `agybot intake` and `cmdDispatch` automatically update `sourceFingerprint`, `lastProjectedSourceFingerprint`, `lastReconciledAt`, and `coverageAttestation` when a tracked `persistenceMode: LIVING` source evolves on disk (e.g., roadmap/checklist commits), keeping `brain-status` `stale: false` with zero manual intervention while still surfacing drift on non-`LIVING` (`FROZEN`/`SNAPSHOT`) sources.
- **Explicit idempotent `sources-refresh` command:** Added `node .slices/agybot.mjs sources-refresh [--all]` for explicit reconciliation.
- **Recovery & browser tool clarity:** Added `sources-refresh` to always-allowed Governor recovery/read commands in `PreToolUse`, and documented in `SessionStart` that browser/MCP tools (`browser`, `chrome_devtools`) are never blocked by `PreToolUse`.

# v8.1.0 — Generic GitHub-Ready Plug-and-Play Release, Zero-Deadlock Hooks & Clean Backups

### Breaking Cleanup & Hygiene
- **Zero Clutter & Single Outside-Discovery Backup:** Global upgrades store at most **1 backup** of the previous version outside discovery (`~/.gemini/backups/skills/slice-orchestration-governor-prev`) and automatically prune/move any accumulated `.backup-*` shadow directories inside `~/.gemini/config/skills/` and `~/.gemini/antigravity/skills/`. Removed 17 legacy migration/prompt reports and 19 obsolete v3–v8.0.1 test scripts from the package.
- **100% Generic & Project-Agnostic:** Stripped all private project references/markers so the skill is ready to publish directly on GitHub and run cleanly on any machine/OS.

### Reliability & Plug-and-Play Upgrades
- **Quote-Aware Shell Segmentation (`splitCommandSegments`):** Ignores `;`, `|`, `&&`, and newlines inside `'...'`/`"..."` quotes so `agybot.mjs intake --text "a; b"` never misclassifies and deadlocks itself in `PreToolUse`.
- **Expanded Safe Read-Only & Recovery Commands:** Permits `git grep`, `Write-Output`, PowerShell object pipes (`Select-Object`, `Where-Object`), `--help`, `source-register`, and `requirements-reconcile` cleanly while still blocking `>`, `.env*` reads, `--no-verify`, and destructive git commands.
- **Non-Deadlocking Canonical Source Drift:** `cmdDispatch` treats canonical doc hash drift as a structured warning instead of crashing `PreInvocation` into `ORCHESTRATION_BLOCKED` circular lockouts (strict failure remains opt-in via `--strict-stale-source`).
- **Zero Git Status Pollution (`.git/info/exclude`):** `bindProject` and `ensureInit` automatically add `.slices/`, `.agy-vault/`, `.agy-backups/`, `.scratch/` (plus untracked `.agents/hooks.json`) to local `.git/info/exclude`, clean legacy `.agents/node.{bat,cmd}` workarounds, and accept `--enable-qualified-auto` when migrating v7 projects.

# v8.0.1 — Hook CWD Resilience, Intake Self-Recovery Fix & TTY Self-Check

### Root Causes Fixed
- **Hook `MODULE_NOT_FOUND` when Antigravity runs `.agents/hooks.json` with `CWD = .agents/`**: Antigravity resolves/executes hook commands relative to `.agents/`, causing relative `node ".slices/agy-hook.mjs" <phase>` to fail before reaching the handler and lock all tools fail-closed. `install.mjs --bind-project` now writes normalized absolute hook paths (`node "<PROJECT_ROOT>/.slices/agy-hook.mjs" <phase>`) in `.agents/hooks.json`.
- **Self-recovery `agybot intake` deadlock inside `PreToolUse`**: When `!r` (no `PreInvocation` receipt yet), `PreToolUse` previously denied `run_command` calling `agybot.mjs intake --directive ...` (the very command suggested by `BLOQUEADO_POR_INTAKE`). `PreToolUse` now allows single-segment `agybot.mjs intake|bootstrap|status|...` and verified multi-segment read-only commands immediately, and `agybot intake` syncs `AGY_HOOK_STATE.json` when bound to a `--coordinator` / `AGY_CURRENT_CONVERSATION_ID`.
- **Forwarder CWD drift & TTY `stdin` hang**: `.slices/*.mjs` forwarders now inject `AGY_PROJECT_ROOT` & `SLICE_GOVERNOR_ROOT`; `antigravity-hook.mjs` strips trailing `.agents`/`.slices`, converts `file://` URIs, supports camelCase + snake_case hook payloads, avoids TTY `stdin` blocking via `--self-check` / `stdin.isTTY`, restricts `BOOTSTRAP_UNVERIFIED` pending-token check to `AGENTAPI_ONLY`, and recognizes QA/verification prompts cleanly.
- **Anti-Orphan Binding Hardening (`globalRuntimePath` integrity)**: `install.mjs --global-only` never binds the CWD git repo; `--bind-project` validates that `globalRuntimePath` exists with `scripts/antigravity-hook.mjs`, refuses volatile paths (`AppData\Local\Temp`, `%TEMP%`, `zip-verify`) by default (`globalRuntimePath deve apontar para instalação estável; nunca para área de verificação/extração temporária`), and runs post-bind hook `stop --self-check` from `.agents/` before succeeding.

# v8.0.0 — Zero-Shadow Global Runtime, Native Subagent Orchestration & Full Engineering Harness

### Highlights & Extracted Inspirations
- **Zero-Shadow Global Runtime**: Eliminates `.agents/skills/slice-orchestration-governor` project-local skill copies and shims (legacy dirs auto-backed up to `.agy-backups/skills/`). Projects hold portable forwarders in `.slices/*.mjs` pointing to `~/.gemini/config/skills/slice-orchestration-governor`. Global upgrades apply immediately without re-onboarding.
- **Native Isolated Subagent Orchestration (NATIVE_SUBAGENTS)**: Restores native Antigravity subagents (`invoke_subagent`, `research`, `self`) by risk class (A/B/C/D) and fixes the v7 `declaredAuth` SOLO override bug.
- **Expanded Onboarding + Auto-TODO Tracking**: Adds Q5 (`tracking.mode`: `GOVERNOR_MANAGED` vs `PROJECT_OWN_DOCS`) and `agybot todo` + `TODO_LEDGER` hook injection.
- **Full Engineering Harness & Anti-Slop Quality Gates:** Adds Class-calibrated Spec + C4 file-cited trace, Simplifier pass, 2-pass P0-P3 Review, STRIDE/OWASP security pass, `design-lint.mjs` + `AGY_UX_V2`, `agybot hawd`, `secret-scan.mjs`, `q.mjs` (2-fail LOOP breaker), and `agybot handoff-verify`.

# v7.0.3 — Hardening de Integridade de Arquivos, Commits por Batch e Evidência Estrita em Handoffs

### Incidentes Observados & Causas Raiz
- **Incidente 1 (Destruição por reversão via Git & Prisma em descoberta)**: Agente executou `npx prisma format` seguido de `git checkout` em `prisma/schema.prisma` que acumulava 3 semanas de evolução não commitada, revertendo o schema ao HEAD e destruindo o trabalho (recuperado apenas via cache interno do client).
- **Incidente 2 (Vulnerabilidade de repositório sem commits / cópia única)**: Repositório com ~1.900 arquivos alterados não commitados há semanas, criando risco crítico de perda total a qualquer comando incorreto de escrita.
- **Incidente 3 (Handoffs com alegações falsas / incompletas)**: Handoff declarou "known failures" inexistentes, divergência de contagem de arquivos alterados (14 declarados vs 13 reais) e PASS agregado sobre suíte que rodou apenas um subconjunto de testes.

### Defesas e Invariantes Implementadas
- **Item 1: Proibição de Comandos Destrutivos em Arquivo Não Commitado**:
  - `git checkout`, `git restore`, `git reset` e `git stash` estritamente bloqueados sobre arquivos com alterações locais;
  - Reversão segura permitida exclusivamente por cópia física em `.scratch/` com registro de SHA-256;
  - `npx prisma format` e `npx prisma db pull` classificados como mutação pesada e bloqueados em batches de descoberta (`READ_ONLY`, `mutationBudget=ZERO`);
  - Declaração prévia obrigatória de comando e arquivos-alvo antes de escrever em arquivos rastreados.
- **Item 2: Commit por Batch e Snapshot de Segurança (Segunda Cópia)**:
  - Todo batch de implementação finaliza com commit próprio nomeado pelo batch (`feat(<BATCH>): ...`);
  - Pendências não commitadas > 1 dia tratadas como risco operacional alto declarado no handoff;
  - Criação obrigatória de snapshot inicial (`chore(snapshot): ...`) em repositórios acumulados antes de iniciar novo batch;
  - Auditoria pré-commit obrigatória para barrar segredos (`.env*`), builds (`.next*`, caches) e validar o volume total.
- **Item 3: Handoff é Alegação, Não Resultado (Evidência Estrita)**:
  - Contagem de testes por arquivo executado (`<arquivo>: # tests / # pass / # fail / exit code`); PASS agregado ("todas verdes") é sumariamente rejeitado como VERDE POR ESCOPO;
  - Contagem física de arquivos alterados validada contra o filesystem; qualquer divergência invalida o batch;
  - Falhas preexistentes só podem ser aceitas com comprovação documental (mtime/diff ou diagnóstico `arquivo:linha`);
  - Alterações em schemas exigem verificação de integridade imediata com hash gravado no handoff.

# v7.0.2 — Ergonomia Operacional, Desbloqueio Acionável e Desdobramento Remoto Autorizado

### Sintomas & Causas Raiz
- **Leitura reflexiva do código do hook pelo agente**: Comandos de escrita locais (`git worktree move`) ou remotos de infraestrutura (`ssh`, `scp`, `docker compose`, `wrangler pages deploy`) eram negados com mensagens genéricas sem comando de ação (`PRE_TASK_ORCHESTRATION_MISSING`), induzindo o agente a inspecionar o código de `antigravity-hook.mjs` e perdendo de 20 a 30 minutos por lote.
- **Deadlock de fila em mensagens enfileiradas / adendos**: Quando o humano enviava múltiplos prompts no mesmo turno (ex: mensagem principal + adendo curto), o hook recalculava o hash do último prompt isoladamente, invalidando o recibo anterior ou classificando adendos como `QUESTION`/`STATUS_CHECK`, reduzindo o orçamento a `MUTATION_BUDGET_ZERO` e travando o turno com agente idle em "sends after agent finishes working".
- **Falta de caminhos para operações de deploy remoto e worktrees**: `ssh`, `scp`, `rsync`, `docker`, `wrangler`, `kubectl` e `git worktree` não constavam da allowlist operacional do Coordenador, mesmo em lotes com autorização explícita (`MODE = EXECUTE`, `DEPLOY = YES`).

### Correções Implementadas
- **Mensagem de negação acionável**: Toda negação de intake agora informa exatamente o comando de desbloqueio: `node scripts/agybot.mjs intake --directive "<id do batch>"` e instrução explícita: `"NUNCA leia o código-fonte do hook para descobrir por que um comando foi negado; execute o intake acima."`
- **Suporte a `--directive <id>` em `agybot intake`**: Permite o desbloqueio direto sem a necessidade de redigitar todo o `--text` do prompt.
- **Auto-intake e permissão para comandos de deploy e worktree**: Lotes com declaração de execução autorizada (`MODE = EXECUTE`, `DEPLOY = YES`, `VPS_DEPLOY = YES`, `GIT_COMMIT = YES`, `EXECUTE = YES`) liberam automaticamente `git worktree` e ferramentas de deploy remoto (`ssh`, `scp`, `rsync`, `docker`, `docker compose`, `wrangler`, `kubectl`), mantendo o Coordenador como executor SOLO sem forçar criação desnecessária de especialistas ou chamadas ao AgentAPI.
- **Garantia de recibo único para múltiplos prompts no mesmo turno**: `collectTurnPrompts` agrega mensagens consecutivas do usuário no mesmo turno, preservando o recibo de intake e orçamento de mutação autorizados mesmo quando adendos são anexados.
- **Prevenção de deadlock de fila no evento `Stop`**: O hook `stop` para o Coordenador retorna `allow` imediatamente quando o agente está idle, permitindo que mensagens da fila sejam entregues sem retenção artificial.
- **Proteção invariante contra comandos destrutivos**: Comandos de destruição não autorizada (`git reset --hard`, `git clean -f`, `rm -rf`, `rmdir /s /q`) continuam estritamente bloqueados.
- **Suíte de testes de aceite T1 a T7**: `scripts/self-test-v7.0.2.mjs` valida formalmente os cenários de escrita local, remota, deploy, guarda destrutiva, adendos de turno, liberação de stop e negação acionável com auto-recuperação.

# v7.0.1 — Antigravity AgentAPI response validation and bootstrap handshake

- Keeps real persistent specialist conversations when `AGENTAPI_ONLY` is configured (no native-subagent fallback inside legacy AgentAPI mode).
- Rejects API-level errors with exit code zero, malformed JSON, diagnostic UUIDs and unconfirmed/misdirected message acknowledgements.
- Validates host session/project context, limits subprocess lifetime, sanitizes failures and removes the undocumented creation title flag.
- Resolves the initial role-registration race with a project-bound bootstrap token/real hook acknowledgement; saves each returned chat ID before proceeding.
- Preserves partial-team IDs and uncertain-creation records instead of automatically duplicating conversations.
- Adds deterministic transport/role-race regression coverage. Local fake-transport PASS is explicitly distinct from live Antigravity acceptance.
- See `references/agentapi-transport-v7.0.1.md` for environment, compatibility, recovery and live-validation rules.

# v7.0.0 — Antigravity Native Hooks + Durable Orchestration Lifecycle

### Added
- Native Antigravity workspace hook enforcement through `.agents/hooks.json` managed key `agybot-v7`.
- `SessionStart`, `PreInvocation`, `PreToolUse`, and `Stop` runtime enforcement.
- Automatic per-human-turn `agybot intake` before Coordinator model invocation.
- Hard `PreToolUse` denial for `invoke_subagent`, `define_subagent`, `send_message`, `manage_subagents`, role-wall violations, unauthorized writes and control-plane tampering.
- Persistent project-level specialist team reused across tasks and Coordinator chats.
- Dynamic playbooks: `DIRECT_COORDINATOR`, `FAST_FIX`, `DISCOVER_BUILD`, `FULL_GOVERNED`, `REVIEW_GATE`, `AUDIT_DISCOVERY`.
- Structured specialist outcomes: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`.
- Durable orchestration journal and per-role outcome artifacts under `.slices/orchestrations/<taskId>/`.
- `swarm-rescue` bounded same-phase retry and orchestration `report`.
- Mid-task course-change routing to the currently active specialist without duplicate team creation.
- Stop hook that prevents active specialists from silently abandoning a phase.

### Changed
- `AGENTS.md` is now fallback/compatibility policy; native hooks are the primary enforcement plane.
- Specialist phase completion automatically advances the selected playbook and returns final outcome to the current Coordinator.
- New Coordinator conversations rebind to the same project team instead of creating per-Coordinator swarms.
- Internal specialist/Coordinator IPC bypasses human intake to avoid recursive orchestration.
- Reports never estimate provider cost/token usage when the host does not expose it.

### Preserved
- Global canonical runtime + lightweight project binding.
- Directive-aware read-only classification and explicit intent override.
- Real AgentAPI conversations for Agy roles and zero native subagent transport.
- Human/product authority, canonical requirement lineage, fingerprint-bound gates, project-local Vault/state, dirty-worktree preservation, and no automatic commit/push/reset.

# v6.3.1 — Windows Self-Test Portability + Unified AgentAPI Runner

- Fixes the Windows Node.js `EINVAL` self-test failure caused by launching a temporary `.cmd` AgentAPI mock directly with `spawnSync`.
- Replaces the shell-dependent mock with a platform-neutral Node executable + explicit `AGY_AGENTAPI_PREFIX_JSON` prefix arguments.
- Keeps production `language_server.exe` execution direct and **does not enable `shell:true`** for user-controlled prompts.
- Routes `swarm-send` and `swarm-health --probe` through the same `runAgentApi()` transport helper used by conversation creation and dispatch.
- Preserves all v6.3 directive-aware intent fixes, mandatory positional bootstrap prompt, real-conversation enforcement, dispatch authorization and managed `AGENTS.md` bootstrap.

# v6.3 — Directive-Aware Intake + AgentAPI Transport Hardening

- Fixes false `STRICT_READ_ONLY_DISCOVERY` classification caused by incidental technical text such as `PostgreSQL READ ONLY` and identifiers containing `ReadOnly`.
- Gives explicit `--intent` precedence over textual heuristics.
- Fixes Antigravity AgentAPI conversation creation by supplying the required non-empty positional prompt to `new-conversation`.
- Adds role-scoped bootstrap prompts for Architect, Builder, QA and Auditor.
- Persists dispatch authorization before the first specialist task envelope.
- Keeps required specialists on real AgentAPI conversations; native `invoke_subagent` remains invalid.
- Makes read-only `status`/`bootstrap` reporting non-mutating.
- Validates source release before global replacement and rolls back on post-install self-test failure.
- Preserves the v6.2.4 managed `AGENTS.md` bootstrap architecture and project-agnostic global binding model.

# v6.2.4 — Always-on Bootstrap + Executable Intake

- Adds real `agybot intake` entrypoint.
- Project binding installs/updates a managed bootstrap block in root `AGENTS.md` without replacing project rules.
- Context refresh/question/status/read-only intents are zero-mutation and cannot auto-repair governance state.
- Mutable work automatically enters dispatch; users no longer need to mention the skill or ask to create agents.
- Dispatch authorization is persisted under `.slices/dispatch-authorizations/`.
- Real AgentAPI specialist transport and native-subagent prohibition remain enforced.

# v6.2.3
- Enforces visible AgentAPI chats for Agy specialist roles.
- Prohibits `invoke_subagent`/native ephemeral subagents as Architect/Builder/QA/Auditor substitutes.
- Adds Class C/D verifier blockers for missing real chat bindings or wrong transport.
- Makes swarm-health fail on non-AgentAPI specialist transport.

# Changelog

## 6.2.2 — Global Canonical Runtime & Project Binding

- replaces full project-local Governor copies with lightweight binding shims;
- introduces `GLOBAL_CANONICAL_LATEST_APPROVED_INSTALLED` runtime resolution;
- adds `/agybot runtime` / `runtime-status`;
- blocks substantial work when a legacy full project-local runtime would shadow the global release;
- installer backs up legacy local runtimes outside `.agents/skills` and creates forwarding proxies;
- project bindings automatically follow later globally approved installed releases without per-project reinstall;
- preserves project-local `.slices`, Vault, MASTER, rules, canonical product sources and swarm state;
- product batches no longer need Governor version pins.

## 6.2.1 — Dynamic Swarm Runtime & Engineering Brain Preflight

- Made substantial-work qualification a mandatory Coordinator preflight through `agybot dispatch`.
- Added dynamic `requiredRoles[]` composition across read-only, Class A, B, C and D work.
- Implemented missing `agentapi new-conversation` lifecycle with conversation-ID parsing and automatic role binding.
- Added `swarm-ensure`; strengthened `swarm-health` to validate every role required by the current task rather than only the Coordinator.
- Added `brain-status` and dispatch Brain checks for canonical sources, requirements, MASTER, Vault and task lineage.
- Class C/D now require full Coordinator + Architect + Builder + QA + Auditor separation during execution, not only a reviewer at the end.
- Added compatible automatic control-plane patch upgrade on first project use; no resending historical project decisions.
- Clarified context economy vs token economy: specialist isolation can improve focus/review while increasing total token usage, so team composition is risk/contract-driven.


## 6.2.0 — Semantic Closure Hardening

### Added
- schemaVersion 9 for new/upgraded state;
- mandatory onboarding/setup visual authority choice: HUMAN_MANUAL, HYBRID, AUTOMATED_FOCUSED;
- explainable visual-policy autodetection;
- dynamic final-diff/symbol Class C/D escalation;
- `reclassify --slice` command;
- fingerprint-bound approvals (source, contract, requirement revision, evidence, checks, visual artifact);
- requirement `executionRefs[]` / `closureEvidenceRefs[]` lineage;
- requirement `INPUT_REQUIRED` and `REVIEW_REQUIRED` states;
- material decision propagation into requirement revision and slice semantic contracts;
- canonical-source projection fingerprints/attestation and stale detection;
- sensitive decision-scope authority enforcement;
- structured `ACCEPTED_CURRENT_BEHAVIOR` / `DEFERRED_TO_TRIGGER` dispositions;
- protected environment resource effects and authority tracking;
- stronger workstream closure over tasks, decisions, findings, transfers, blockers and source freshness;
- closure manifest digest including requirement revision + approvals + evidence/check fingerprints;
- schema v9 templates and new semantic-closure/visual-policy references;
- authoritative v6.2 self-test covering the above.

### Changed
- HUMAN_MANUAL now always requires HUMAN_PRODUCT on web/mixed slices, including Class A;
- HUMAN_MANUAL forbids automated visual PASS but still permits technical DOM/runtime evidence;
- HYBRID explicitly requires automated visual audit + human approval;
- requirements waiting for product input/review cannot open new execution;
- Class C and Class D both require independent engineering review;
- MASTER projection shows requirement revision and execution lineage.

### Compatibility
- existing project history is preserved; no reset/reimport is required;
- historical approvals are preserved but become stale when their governed fingerprint changes;
- legacy references/tests remain packaged for compatibility/regression context.

# v6.2.0 — Project-Aware First-Use Onboarding

- Global installation now explicitly explains that one skill install serves all projects; each project receives separate configuration and Vault state.
- Added automatic first-use project detection contract (`bootstrap` / `first-use`) so users do not need to know `/agybot setup`.
- Added `project-probe` / `vault-recommend` with explainable Vault recommendations based on project structure (`.agy-vault`, `.obsidian`, `docs/`, `specs/`, PACOTE-like sources, Markdown density, Git workspace).
- Guided installer now names the detected project, explains that setup applies only to that project, and states that future projects are configured on first use without reinstalling.
- Added lay-user command guide with natural-language equivalents; commands remain optional shortcuts.
- `status` now returns `PROJECT_SETUP_REQUIRED` rather than a technical error when the current project has not been onboarded.
- Schema remains **8**; this patch changes onboarding/UX behavior, not gate data shape.

# v6.1.1 — Guided Install + Visual UX Polish Gate

- Added lay-user guided installer (`INSTALAR_WINDOWS.bat`, `INSTALAR_MAC_LINUX.sh`, `scripts/install.mjs`).
- Checksum verification is automatic and hidden from normal onboarding.
- Added mandatory `AGY_UX_V1` Visual UX Polish Gate for newly-created web/mixed slices.
- Red Team Auditor must visually inspect screenshots plus DOM/context; screenshot existence alone cannot satisfy the gate.
- Added explicit checks for wrapping, clipping/overflow, hierarchy, spacing, user-language/jargon, redundancy/cognitive load, affordance/ergonomics, design-system consistency, responsive behavior, and contrast/accessibility.
- Two failed UX audits require implementation review; unresolved post-review quality escalates to human review.
- Existing schema <=7 gates remain backward-verifiable; new v6.1.1 gates use schema 8.

# Changelog

## 6.1.1 (Autonomous Engineering Vault)

- Added `scripts/agybot.mjs` as the Agy Bot control plane with lay-user onboarding, configurable autonomy, qualified swarm activation, `/unagybot` semantics, Vault location selection, requirements/tasks, research artifacts, role audits, visual escalation and real AgentAPI dispatch.
- Added `CANONICAL_PRODUCT_SOURCES` and durable canonical requirements projection. MASTER is an execution index, never a replacement for product specs.
- Added hard workstream closure rules: missing slices do not cancel requirements; open/active/blocked requirements prevent closure.
- Added Task Ledger + Progress Ledger and terminal task/refinement semantics.
- Added multi-swarm registry and structured `AGY_SWARM_IPC_v6.1` envelopes with real handoff hop counting.
- Added autonomy-first, coordinator-only human interface and coordinator-only external research.
- Added untrusted-content / privileged-action separation to reduce prompt-injection blast radius.
- Added enforceable role-audit commands and coordinator product-write prohibition.
- Added two-attempt visual validation with implementation review and human escalation instead of fake visual PASS.
- Added `COORDINATOR_APPROVED_SCOPE` slice authority, valid only when bound to an existing non-terminal canonical requirement.
- Added schemaVersion 7 for new v6.1 state while preserving verifier compatibility with schema versions 3–6.
- Added `self-test-v6.1.mjs`.
- Corrected v6 wording: `/GRILL-ME` is no longer described as automatic promotion; v6.1 autonomously canonizes only non-material technical learnings and escalates material decisions according to policy.

## 6.0.0 (Agy Bot Autonomous Swarm Edition)

Major release introducing the **Agy Bot Autonomous Swarm**, full inter-agent IPC via Antigravity's native `agentapi`, web research guidance, `/grill-me` rule promotion, and the strict Human Escalation Firewall. Reconciles all internal versioning inconsistencies to schemaVersion 6.

### Added
- **5-Node Agy Bot Autonomous Swarm**:
  - Full native orchestration across 5 specialized conversational nodes:
    - **Node 0**: Coordenador Geral / Diretor (Specs, Web Research, Batch Gate, Rule Updates).
    - **Node 1**: Lead Orchestrator (Architect / Governor - DAG decomposition, slice management, `/grill-me`).
    - **Node 2**: TDD Builder (Developer - Red-Green-Refactor, code inside `writeScopes`).
    - **Node 3**: Playwright QA & Healer (Dev server, headless browser, `console.error == 0`).
    - **Node 4**: Red Team Auditor (Adversarial review, Session Separation Invariant, Class C/D gates).
  - Native Antigravity CLI IPC via `language_server.exe agentapi new-conversation` and `agentapi send-message`.
  - Swarm CLI commands in governor: `swarm-status` and `swarm-export`.
  - Comprehensive architectural specification in `references/agy-bot-swarm-architecture.md`.
- **Strict Human Escalation Firewall**:
  - Human user is contacted exclusively for pivotal product/business trade-offs.
  - All software errors, failing tests, build breaks, package conflicts, and technical research are 100% autonomously resolved within the swarm.
- **Web Research & Rule Promotion Loop**:
  - Node 0 uses `search_web` to discover external APIs, documentation, and best practices.
  - Automatic promotion of `/grill-me` learnings into rules and constitutional invariants.
- **Harmonized Versioning & Schema Alignment**:
  - Upgraded schemaVersion to 6 and governorVersion to 6.0.0 across all templates, configs, and validators.
  - Reconciled `INSTALL.md` and `references/gate-record-template.json` to complete parity.
  - Added `agySwarm` routing object and anti-thrashing fields to gate records.

### Changed
- `verify-slice-gate.mjs` expanded to validate schemaVersion 6 and governorVersion 6.x while preserving full backwards compatibility for 3.3.x, 4.x, and 5.x.
- `SKILL.md` elevated to v6.0.0 with dedicated Agy Bot Swarm routing and CLI instructions.

## 5.0.0 (Autonomous Second Brain & Enterprise Engineering OS)

Synthesis release merging Slice Orchestration Governor v4.0 with Karpathy-style Second Brain knowledge vaults and anti-entropy hygiene.

### Added
- **Second Brain Knowledge Vault**:
  - `vault-init` command to scaffold Obsidian-native directory structure (`raw/`, `wiki/`, `user/`, `projects/`, `context/`).
  - Strict segregation between immutable captures (`raw/`) and synthesized living documentation (`wiki/`).
  - Automatic `wiki/index.md` compilation and cross-referencing.
- **Knowledge Compiler (`compile`)**:
  - Compiles raw source notes into structured Karpathy-style wiki articles with metadata, tags, and citations.
- **Librarian Anti-Entropy Hygiene (`audit`)**:
  - Enforces strict line count limits: State files <= 20 lines, context memory files <= 200 lines.
  - Comprehensive broken `[[wikilink]]` scanner across the vault.
  - Orphaned slice and gate detector.
- **Role Walls & Permission Matrix**:
  - Enforces explicit separation between Chief Orchestrator, TDD Builder, Knowledge Compiler, and Librarian.
- **Obsidian Native Integration**:
  - Graph view ready with native `[[wikilinks]]`, tags, and Markdown callouts (`[!NOTE]`, `[!TIP]`).
- **Complete Template Suite**:
  - Scaffolding templates in `templates/` for projects, memory, todo, lessons, raw sources, and wiki articles.

### Changed
- Upgraded schemaVersion to 5 and governorVersion to 5.0.0 while preserving backwards compatibility for 3.3.x and 4.x.

## 4.0.0 (Autonomous Enterprise Edition)

Major release unifying all global autonomy harnesses, eliminating anti-thrashing loops, introducing tiered slice classes, and providing zero-dependency Git resilience.

### Added
- **Tiered Slice Classes (A, B, C, D)**:
  - Class A (`MICRO_HOTFIX`): < 50 lines changed, <= 3 files. Automated engineering only; waives independent review; Playwright headless run optional if visible inline (`--inline-ui`).
  - Class B (`PRODUCT_FEATURE`): Standard feature development.
  - Class C (`SECURITY_MUTATION`): Mandatory Adversarial Red Team review for auth, schema, migration, payment, RLS, crypto.
  - Class D (`STRUCTURAL_MIGRATION`): Cross-workstream DAG lock & release seal for > 10 files or architectural changes.
- **Auto-Detection (`detect-class`)**: Automatically inspects working tree / files and classifies slices.
- **Anti-Thrashing Impasse Circuit Breaker**: Capped at 2 consecutive failed repairs. Shifts status to `IMPASSE_TRIPPED` and requires `--pivot-hypothesis` to unlock.
- **Git-Resilient Pure Node.js Fallback Engine**: Uses SHA-256 tree hashing when `git.exe` is missing or uninitialized.
- **Playwright MCP Gate Integration**: Browser runtime assertion of `console.error == 0` with Class A inline exemption.
- **Micro-Router `SKILL.md`**: Reduced to under 150 lines with modular reference routing.
- **Workspace Forensics & Memory Bridge**: Added `scan` and `brain-recall` commands.

### Changed
- Upgraded schemaVersion to 4 and governorVersion to 4.0.0 with backwards compatibility.
- Streamlined `SKILL.md` token load by 75%.
- Hardened all child process and Git invocation methods against `ENOENT` crashes.

## 3.3.0

Evidence-semantics and closure-integrity release.

### Added

- semantic `contractState` revisions/fingerprints bound to evidence and checks;
- per-gate input fingerprints and selective `AFFECTED_ONLY` check reuse;
- `mutation-outcome` post-COMMIT reconciliation with retry/idempotency proof;
- `side-effect-frontier` ordering/zero-side-effect proof;
- `reconcile-suite` failure-frontier classification for whole authorized scopes;
- external blocker gate-level/independence classification;
- structured human findings and reference-fidelity invariants;
- formal gate transfer with inherited debt and final-seal enforcement;
- stage-qualified pipeline claims;
- new v3.3 references, migration guide, CLI coverage, and self-tests.

### Changed

- final evidence now binds to both source and contract fingerprints;
- PASS checks record input scopes/fingerprints and contract fingerprint;
- `AFFECTED_ONLY` may reuse an earlier check only when those fingerprints remain current;
- web/mixed work must explicitly resolve reference-fidelity mode.

## 3.2.0

Hardening release focused on lessons from real multi-agent slice execution while remaining fully project-agnostic.

### Added

- `READ_ONLY_DIAGNOSTIC` slice kind with zero-mutation diagnostic contract.
- Claim-time dirty-worktree provenance snapshot.
- Per-change provenance, hunk review, touched-by-slice, and scope disposition.
- Hard write-scope enforcement with explicit authorized expansion categories.
- Structured `claimLedger` contradiction detection.
- `INDEPENDENT_ENGINEERING_REVIEW` authority and high-risk policy.
- Configurable visual acceptance: `AUTOMATED_FOCUSED`, `HUMAN_MANUAL`, `HYBRID`.
- Mutation-safety audit contract.
- Material note `durableDisposition` and `promotionDisposition`.
- Status-aware durable-memory routing, including provisional findings and open decisions.
- `/GRILL-ME` `MODIFY` replacement-candidate requirement.
- Truth-reconciliation and semantic-dimension guidance.
- New references for worktree provenance, read-only diagnostics, claim consistency, and mutation safety.

### Fixed

- Durable notes no longer route all non-learning statuses into Canonical Decisions.
- A modified promotion candidate can no longer be considered resolved without a resolved replacement.
- A slice can no longer close cleanly after silently changing a path outside its declared write scope.

## 3.1.0

Introduced process-safe shared-state locking, authority provenance, stale invalidation, progressive memory, `/GRILL-ME` exactness, change manifests, data/surface safety, and multi-agent DAG hardening.
