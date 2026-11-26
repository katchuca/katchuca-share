# Slice Orchestration Governor v8.3.0

> **GitHub-Ready Plug-and-Play Total-Autonomy Engineering Governor (Multilingual · Auto TODO/CHANGELOG/MASTER · Greenfield/Brownfield Playbooks · Anti-Pill Gate · Chrome Debugging & Playwright Preflight · Layer-2 Integrity)**

## Why v8.3.0
1. **Real Automatic Tracking (`autoUpdateTodo` + `autoUpdateChangelog` + Audit Log):** `dispatch` opens TODO entries automatically, verified `handoff-verify` (or explicit `agybot record`) closes TODOs, prepends structured dated entries to `CHANGELOG.md`, and logs non-slice work into `MASTER_SLICE_CHECKLIST.md` (`--skip-tracking` opts out).
2. **Duplicate-Free `MASTER_SLICE_CHECKLIST.md` Projection:** Both `agybot.mjs` and `slice-governor.mjs` collapse repeated `CANONICAL_REQUIREMENTS_PROJECTION` blocks deterministically.
3. **Greenfield & Brownfield Playbooks (`lifecycle-probe`, `scaffold-constitution`, `design-taste-init`, `promote-rule`):** Automatically detects projects built from scratch vs existing codebases, places Product Constitution above `AGYBOT_BOOTSTRAP` in `AGENTS.md`, scaffolds `.slices/DESIGN_TASTE.md`, and persists chat rules into `AGENTS.md`, `DESIGN_TASTE.md`, or Vault learnings.
4. **Deterministic Anti-Pill & Anti-Slop Design Gate (`design-lint` U1/U9/U26/U26_DENSITY):** Flags decorative eyebrow-pills, hardcoded fake `NEW`/`AI`/`PRO`/`LIVE`/`FREE`/`BETA` pills, non-interactive `rounded-full` pills, and pill overcrowding (`>= 3`), while preserving interactive buttons/tabs and `.slices/DESIGN_TASTE.md` (`## Keep`/`## Off`).
5. **100% Standalone White-Label & Zero-Shadow Package:** Universal multilingual intent classification, `intake --directive` mid-turn recovery, `chrome://inspect/#remote-debugging` + Playwright preflight, `autoLearn`, Layer-2 `test-integrity`, `scope-check`, `doctor`, and `.git/info/exclude` cleanliness.

See [INSTALL.md](INSTALL.md) for quick setup & project binding. Authoritative release gate: `node scripts/self-test-v8.3.0.mjs`.

## What changed in v8.2.0
- Universal language-agnostic intent classification (`AUTONOMY_FIRST`), mid-turn `intake --directive` unblock, Chrome Remote Debugging (`chrome://inspect/#remote-debugging`) + Playwright preflight, `autoLearn`, `doctor`, `scope-check`, Layer-2 `test-integrity`, and Onboarding Q7 shortcut tour.

## What changed in v8.1.1
- Auto-refreshing `LIVING` canonical sources (`refreshLivingSources` + `sources-refresh`) and explicit clarification that `browser` / `chrome_devtools` MCP tools are never blocked by `PreToolUse`.

Authoritative local release gate in v8.1.1: `node scripts/self-test-v8.1.1.mjs`.

## What changed in v8.1.0

## What changed in v8.0.1
- **CWD-Resilient `.agents/hooks.json` (`node "<PROJECT_ROOT>/.slices/agy-hook.mjs" <phase>`)**: Fixes `MODULE_NOT_FOUND` when Antigravity launches hooks from `.agents/`, passes `AGY_PROJECT_ROOT`/`SLICE_GOVERNOR_ROOT` in `.slices/*.mjs` forwarders, supports `--self-check` & non-blocking `stdin.isTTY` for startup `.bat`/shell checks, and adds camelCase/snake_case/`file://` normalization.
- **Zero-Deadlock Intake & Segmented Read-Only Guard**: `PreToolUse` always permits self-unblock `agybot.mjs intake` & verified multi-segment read-only inspection (`git status`, `Get-ChildItem`, etc.), and `agybot intake` directly updates `AGY_HOOK_STATE.json` when invoked by the Coordinator.
- **Anti-Orphan Binding Guard**: `globalRuntimePath` deve apontar para instalação estável (`~/.gemini/config/skills/slice-orchestration-governor`); nunca para área de verificação/extração temporária (`Temp` / `zip-verify`). `install.mjs --global-only` nunca vincula repositórios, e `--bind-project` valida `stop --self-check` ao final.

Authoritative local release gate: `node scripts/self-test-v8.0.1.mjs`.

## What changed in v8.0.0
1. **Zero-Shadow Global Runtime (`install.mjs --bind-project`)**:
   - No `.agents/skills/slice-orchestration-governor/` copy or shim is created in repositories anymore; any existing legacy local skill directory is safely moved to `.agy-backups/skills/`.
   - Repositories receive lightweight portable forwarders in `.slices/` (`agy-hook.mjs`, `agybot.mjs`, `slice-governor.mjs`, `secret-scan.mjs`, `design-lint.mjs`, `q.mjs`) pointing to the canonical global runtime at `~/.gemini/config/skills/slice-orchestration-governor`.
   - Updating the global skill immediately activates new features and rules in every bound repo **without losing or repeating onboarding**.
2. **Native Subagent Orchestration (`NATIVE_SUBAGENTS` default)**:
   - Class `A/B/C/D` routing now orchestrates native isolated subagents (`invoke_subagent` `research` / `self`) with Spec + C4 file-cited trace (`fulfills`), Worker + Simplifier pass, Diff-driven QA (`q.mjs`), 2-pass `P0`–`P3` Code Review, and STRIDE/OWASP Security Review (`references/v8-orchestration-and-subagents.md`).
   - `.agents/hooks.json` uses managed key `agybot-v8` invoking `node ".slices/agy-hook.mjs" <phase>` (with `AGENTAPI_ONLY` still available when explicitly configured).
3. **Onboarding v8 + Auto-TODO Tracking (`tracking`)**:
   - Streamlined 5-question setup adds `tracking.mode` (`GOVERNOR_MANAGED` vs `PROJECT_OWN_DOCS`) for project TODO, slice checklist, and changelog paths.
   - `agybot hawd` and `agybot todo` keep progress, human blockers, friction events, and uncommitted age risk (`>24h`) transparent.
4. **Hardening-3 + `secret-scan` + `design-lint` + `q.mjs` + `AGY_UX_V2`**:
   - Combines v7.0.3 data-loss guards (`.scratch/` physical revert + SHA-256, `prisma format/db pull` block in `READ_ONLY`) with `.env*` read protection, `--no-verify` commit blocking, unpiped test logging (`q.mjs`), anti-slop UI linting (`design-lint.mjs` + `.slices/DESIGN_TASTE.md`), and `agybot handoff-verify`.

Authoritative local release gate: `node scripts/self-test-v8.0.0.mjs`.

## v7.0.3 — Hardening de Integridade de Arquivos, Commits e Handoffs

Esta versão implementa as defesas nascidas de incidentes operacionais reais:
- **Item 1: Proibição de Comandos Destrutivos em Arquivos Não Commitados**:
  - `git checkout`, `git restore`, `git reset` e `git stash` estritamente bloqueados sobre arquivos com alterações não commitadas para impedir destruição irreversível;
  - Reversões permitidas exclusivamente via cópia física em `.scratch/` com conferência de SHA-256;
  - `npx prisma format` e `npx prisma db pull` bloqueados em batches de descoberta / `READ_ONLY`;
  - Declaração prévia obrigatória de comando e alvo antes de escrever em arquivos rastreados.
- **Item 2: Commit por Batch e Snapshot de Segurança (Segunda Cópia)**:
  - Todo batch de implementação finaliza com commit próprio nomeado (`feat(<BATCH>): ...`);
  - Pendências não commitadas > 1 dia tratadas como risco operacional declarado no handoff;
  - Repositório com pendências acumuladas exige snapshot inicial antes de alterações de código;
  - Auditoria obrigatória pré-commit (bloqueio de segredos `.env*`, builds `.next*`, tamanho total).
- **Item 3: Handoff é Alegação, Não Resultado (Evidência Estrita)**:
  - Contagem de testes por arquivo executado (`# tests / # pass / # fail / exit code`); PASS agregado ("todas verdes") é rejeitado como VERDE POR ESCOPO;
  - Contagem física de arquivos alterados com verificação no filesystem; divergência invalida o batch;
  - Falha preexistente só é aceita com prova (mtime/diff ou diagnóstico `arquivo:linha`);
  - Alterações de schema exigem validação de integridade imediata com hash no handoff.

Authoritative local gate: `node scripts/self-test-v7.0.3.mjs`.

## v7.0.2 — Ergonomia Operacional, Desbloqueio Acionável e Deploy Autorizado

Esta versão corrige a fricção de governança no hook de pré-execução e no comando de intake:
- **Mensagem de negação acionável**: Toda negação agora instrui explicitamente o comando `node scripts/agybot.mjs intake --directive "<id do batch>"`.
- **Regra anti-introspecção**: NUNCA leia o código-fonte do hook (`antigravity-hook.mjs`) para descobrir por que um comando foi negado; execute o intake indicado.
- **Suporte a `--directive <id>`**: Permite desbloqueio direto sem a necessidade de reescrever o texto completo do turno humano.
- **Auto-intake e suporte a deploy remoto**: Operações com declaração explícita de autorização (`MODE = EXECUTE`, `DEPLOY = YES`) autorizam automaticamente `git worktree` e ferramentas de deploy remoto (`ssh`, `scp`, `rsync`, `docker`, `wrangler`, `kubectl`).
- **Garantia de recibo único para adendos**: Múltiplas mensagens humanas no mesmo turno não sobrescrevem ou anulam o orçamento do lote autorizado.
- **Prevenção de deadlock de fila no evento `Stop`**: O hook `stop` para o Coordenador libera imediatamente quando idle, garantindo entrega de mensagens enfileiradas.

Authoritative local gate: `node scripts/self-test-v7.0.2.mjs`.

## v7.0.1 transport correction (Antigravity only)

Read [references/agentapi-transport-v7.0.1.md](references/agentapi-transport-v7.0.1.md) before using the legacy `AGENTAPI_ONLY` transport mode. In default `NATIVE_SUBAGENTS` mode, `intake`/`dispatch` uses isolated native Antigravity subagents directly without persistent AgentAPI session setup. For legacy `AGENTAPI_ONLY`, role creation uses the positional bootstrap prompt without `--title`, real persistent chats are preserved/reused, and model selection remains controlled by Antigravity.

Authoritative local gate: `node scripts/self-test-v7.0.1.mjs`. Tests use a fake AgentAPI transport, not real model calls; live Antigravity acceptance remains separate.

> **Antigravity-native orchestration release:** critical enforcement moves from model reminders into official workspace hooks. The project keeps one persistent technical team, selects a playbook per task, records durable phase outcomes/journal, and can rescue blocked work without creating duplicate specialist chats.

## Why v7 exists

v6.x proved that prompts and `AGENTS.md` alone are not a reliable control plane: a Coordinator could skip intake, a specialist could stop without handoff, or native subagents could reappear. v7 makes the Antigravity runtime enforce those boundaries.

The installer manages `.agents/hooks.json` under the single key `agybot-v7` and preserves unrelated hooks. `AGENTS.md` remains project policy plus a fallback when hooks are unavailable.

## Native Antigravity lifecycle enforcement

- `SessionStart` identifies whether a conversation is Coordinator or a persistent specialist.
- `PreInvocation` automatically executes `agybot intake` once per new human Coordinator turn before the model runs.
- `PreToolUse` denies native subagent tools, forbidden writes, role-wall violations and control-plane tampering.
- `Stop` prevents an active specialist from silently abandoning its phase and requests a structured `swarm-complete` outcome.

The hook state is persisted in `.slices/AGY_HOOK_STATE.json`; duplicate model invocations inside the same human turn reuse the same receipt rather than redispatching.

## Persistent project team

A project owns one reusable specialist team:

```text
Coordinator (current human-facing chat)
    ├── ARCHITECT
    ├── BUILDER
    ├── QA
    └── AUDITOR
```

The first task creates only missing roles through real Antigravity AgentAPI conversations. Later tasks and later Coordinator chats reuse the same conversation IDs. `invoke_subagent` is never a valid substitute for Agy roles.

## Dynamic playbooks

Risk class still defines the minimum required roles, but v7 selects an execution playbook rather than forcing every task through one fixed sequence:

- `DIRECT_COORDINATOR`
- `FAST_FIX`
- `DISCOVER_BUILD`
- `FULL_GOVERNED`
- `REVIEW_GATE`
- `AUDIT_DISCOVERY`

Class C/D remain fully governed. Parallel worktrees are intentionally **not** enabled by default because existing dirty worktrees and owner-controlled git policy must be preserved.

## Structured outcomes, journal and rescue

Each specialist finishes with exactly one outcome:

- `DONE`
- `DONE_WITH_CONCERNS`
- `BLOCKED`
- `NEEDS_CONTEXT`

`BLOCKED` and `NEEDS_CONTEXT` return to the Coordinator and do not silently advance. `swarm-rescue` retries the same phase with a bounded budget. Durable state lives under:

```text
.slices/orchestrations/<taskId>/
  task.json
  prompt.txt
  journal.jsonl
  phases/<ROLE>/outcome.json
```

A new human instruction during an active task is journaled as a course change and routed to the active specialist instead of spawning another team. Reports never invent token/cost data; unavailable host usage is reported as unavailable.

## Global runtime model

- canonical engine: `~/.gemini/config/skills/slice-orchestration-governor`
- project binding: `.agents/skills/slice-orchestration-governor`
- native hook config: `.agents/hooks.json`
- release policy: `GLOBAL_CANONICAL_LATEST_APPROVED_INSTALLED`

Project-specific truth remains project-local: `.slices`, Vault, MASTER, requirements, product sources, evidence and policy.

## Install

Windows: extract and run `INSTALAR_WINDOWS.bat`.

macOS/Linux: extract and run `bash INSTALAR_MAC_LINUX.sh`.

For any new or existing project, run `node ~/.gemini/config/skills/slice-orchestration-governor/scripts/install.mjs --non-interactive --bind-only --bind-project <PROJECT_DIR>` (or use the interactive installers). The installer validates the source release before global replacement, preserves the single previous backup outside discovery (`~/.gemini/backups/skills/slice-orchestration-governor-prev`), binds the project cleanly in `.slices/`, preserves existing `AGENTS.md` content above `AGYBOT_BOOTSTRAP`, and registers the managed `agybot-v8` hook key in `.agents/hooks.json`.

See [INSTALL.md](INSTALL.md), [VALIDATION.md](VALIDATION.md), [references/greenfield-and-brownfield-playbooks.md](references/greenfield-and-brownfield-playbooks.md), and [references/global-runtime-and-project-binding.md](references/global-runtime-and-project-binding.md).

## Semantic Closure + Agy Bot Engineering Vault

### Instalação simples
**Windows:** descompacte e execute `INSTALAR_WINDOWS.bat`.

**macOS/Linux:** descompacte e execute `bash INSTALAR_MAC_LINUX.sh`.

O instalador faz backup da versão anterior, valida o pacote, roda o self-test v7.0.1 e oferece o onboarding. Não é necessário recriar o histórico do projeto.

## O que muda na 6.2
A 6.2 endurece os problemas que apareceram em uso real depois da v5/v6.1:

- **Classificação dinâmica pelo diff/símbolos finais.** Alteração comercial/billing/RLS/retention pode subir para Class C mesmo dentro de arquivo com nome genérico.
- **Aprovação presa ao fingerprint exato.** Reviewer/humano aprova source + contract + requirement revision + evidence/check manifest; drift torna aprovação stale.
- **Requirement com lineage.** Um requirement pode ter slice principal, DC1, DC2 e refinements; PASS de slice não fecha requirement.
- **`INPUT_REQUIRED` / `REVIEW_REQUIRED`.** Produto pendente não executa silenciosamente.
- **Decisão humana propaga revision/contract.** Resposta real do PO atualiza requirement/contract e invalida prova antiga afetada.
- **Freshness da fonte canônica.** PACOTE/PRD alterado depois da projeção bloqueia “acabou” até reconciliar.
- **Authority para decision scopes sensíveis.** Discovery não vira regra de produto.
- **`ACCEPTED_CURRENT_BEHAVIOR` + future trigger.** Limitações intencionais ficam documentadas sem virar bug aberto.
- **Recursos do ambiente protegidos.** Runtime/container/provider pré-existente não pode ser parado/mutado sem autoridade.
- **Fechamento de workstream mais forte.** Requirements, tasks, decisions, findings, transfers, blockers e source freshness entram no gate.
- **Closure manifest.** Fechamento inclui requirement revision + approvals + evidence/check manifest.

## Escolha visual no onboarding
A setup pergunta obrigatoriamente quem pode aprovar visualmente:

1. `HUMAN_MANUAL` — só humano valida aparência final;
2. `HYBRID` — automação + humano validam;
3. `AUTOMATED_FOCUSED` — só automação valida.

A skill detecta o projeto e recomenda uma opção com explicação. A recomendação nunca substitui a escolha do usuário.

## Fonte de produto x execução

```text
PRD / PACOTE / SPEC / ISSUE SYSTEM
              ↓
Canonical Requirements Index
              ↓
MASTER / .slices / Vault
              ↓
Slice / Task execution lineage
              ↓
Closure evidence + disposition
```

`.slices` é projeção executável; não substitui a verdade completa do produto.

## Agy Bot
Equipe típica quando o trabalho justificar:
1. Coordinator
2. Architect
3. Builder
4. QA
5. Auditor

Perguntas simples continuam solo sob `QUALIFIED_AUTO`.

## Comandos úteis
O usuário não precisa decorar comandos; linguagem natural continua sendo a UX principal.

```bash
node scripts/agybot.mjs help
node scripts/agybot.mjs status
node scripts/agybot.mjs requirements
node scripts/agybot.mjs requirements-reconcile
node scripts/slice-governor.mjs reclassify --slice <id>
```

## Compatibilidade
- estado novo: schemaVersion 9;
- histórico antigo preservado;
- verifier continua aceitando schemas legados suportados;
- nenhuma migração destrutiva de projeto é exigida;
- aprovação antiga pode ficar stale se o estado aprovado mudou.

Veja `MIGRATION_V6.2.md`, `VALIDATION.md`, `references/semantic-closure-hardening-v6.2.md` e `references/visual-validation-v6.2.md`.



## v6.3 — Always-on project bootstrap
A global skill can be available without being invoked by a fresh project chat. v6.3 closes that gap: project binding now also installs a **managed bootstrap block** in the root `AGENTS.md` while preserving all existing rules. The block forces each project request through the executable `agybot intake` entrypoint before project execution.

- `CONTEXT_REFRESH`, questions, status and strict read-only discovery: `MUTATION_BUDGET=ZERO`;
- implementation/refinement/closure: intake automatically qualifies and dispatches;
- specialist roles use real AgentAPI conversations, never native `invoke_subagent`;
- failures in read-only reconciliation are reported without auto-repair;
- future global releases update the engine while the project keeps the same lightweight binding and bootstrap rule.

The managed block uses stable `<!-- AGYBOT_BOOTSTRAP:START -->` / `<!-- AGYBOT_BOOTSTRAP:END -->` markers so upgrades replace only that block, not the user's project rules.

## v6.2.3 — One global engine, project bindings only

The Governor runtime is now single-source globally. Projects no longer keep a full pinned copy under `.agents/skills`; they keep a lightweight binding shim that forwards to the latest approved version installed globally. This prevents project-local version drift from shadowing newer global releases.

- canonical engine: `~/.gemini/config/skills/slice-orchestration-governor`;
- release channel: `LATEST_APPROVED_INSTALLED`;
- project binding: `.agents/skills/slice-orchestration-governor/PROJECT_BINDING.json`;
- legacy full local runtimes are backed up to `.agy-backups/skills/`;
- `.slices`, Vault, MASTER, project rules and canonical product sources remain local and untouched;
- user batches do not need Governor version numbers.

Use `/agybot runtime` or `node scripts/agybot.mjs runtime-status` to inspect the actually active runtime.

## v6.2.1 — Automatic team lifecycle
The Coordinator now runs a mandatory substantial-work dispatch preflight. A non-technical user does not choose agents manually. The runtime decides which roles are justified, creates missing specialist chats through Antigravity AgentAPI, and records the task in the Engineering Brain before implementation.

`Class C` and `Class D` use the full Architect → Builder → QA → Auditor separation. Smaller/read-only work uses fewer roles to avoid unnecessary overhead.

Use `node scripts/agybot.mjs brain-status`, `qualify`, or `dispatch` for diagnostics/automation.

`swarm-next` advances a task through only the specialist roles selected by `dispatch`, preserving a clean technical context per role.

## v6.3 hardening

### Directive-aware intent classification
Technical strings such as `ReadOnly` identifiers or `PostgreSQL READ ONLY` do not override an implementation directive. Explicit `--intent` wins over heuristics.

### Current AgentAPI contract
Specialist creation uses:

```powershell
language_server.exe agentapi new-conversation "<NON_EMPTY_ROLE_BOOTSTRAP_PROMPT>"
language_server.exe agentapi send-message <CONVERSATION_ID> "<STRUCTURED_TASK_ENVELOPE>"
```

### Safer installation
The installer validates the source release before replacing the global runtime and restores the prior runtime if post-install validation fails.
