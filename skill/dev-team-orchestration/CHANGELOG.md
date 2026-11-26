# CHANGELOG — Dev Team Installation Skill

Todas as alterações notáveis deste pacote são documentadas neste arquivo em UTF-8, seguindo versionamento semântico.

---

## [3.0.0] — 2026-11-26

### Adicionado
- **Arquitetura Universal Multiplataforma (`adapters/` + `scripts/bind_project.py` v3.0.0):**
  - Remoção do acoplamento exclusivo ao OpenMausBot e a um `instanceId`/modelo fixo.
  - Novo parâmetro `--platform` (`all | openmausbot | openbot | paperclip | grok-bot | generic`) gerando adaptadores prontos em `.slices/team-adapters/`:
    - `team_spec.canonical.json` (contrato neutro de equipe, papéis, permissões e portões).
    - `openmausbot.propose_team_setup.json` (pronto para `propose_team_setup`, com silhuetas `mascotBody` e cores exclusivas).
    - `openbot.team_setup.json` (compatível com OpenBot).
    - `paperclip.company_pack.yaml` e `paperclip_agents/*.yaml` (org chart `reportsTo`, `executionPolicy` Review -> QA/Auditor e Approval -> Humano, `isolatedWorkspaces`, `skills`).
    - `grok-bot.team.json` e `generic-agents.md` (prontos para Grok Bot, OpenClaw e runtimes CLI/subagentes genéricos).
- **Motor Principal Atualizado e Auditado contra o Release Oficial `slice-orchestration-governor-v8.3.0.zip`:**
  - Espelho integral dos 90 arquivos oficiais do pacote `v8.3.0` em `core-engines/slice-orchestration-governor/` (incluindo instaladores, `examples/`, `references/`, `templates/`, `SHA256SUMS.txt` e suíte `self-test-v8.3.0.mjs` `T1`–`T45`), sem arquivos locais de máquina (`ACTIVE_RELEASE.json` removido da distribuição).
  - Arquitetura **Zero-Shadow Global Runtime**: `bind_project.py` valida integridade por `SHA256SUMS.txt` antes de pular a sincronização global em `~/.gemini/config/skills/slice-orchestration-governor` (com flags `--force-global-sync` e `--sync-companions`) e vincula o projeto via forwarders portáteis em `.slices/`, `.agents/hooks.json` (`agybot-v8`) e `.git/info/exclude`.
  - Inicialização completa pós-vínculo via `agybot setup` (`.slices/SLICE_GOVERNOR.json`, `.agy-vault/`, `.slices/TODO.md`, `.slices/CHANGELOG.md`, `.slices/MASTER_SLICE_CHECKLIST.md`, `browserTesting` e `SPEC-PRIMARY` registrado como `LIVING` em `GREENFIELD`), preservando preferências existentes em projetos `BROWNFIELD` (`UNMENTIONED_UI_IS_FROZEN`).
  - Gate de Design `AGY_UX_V2` com `.slices/DESIGN_TASTE.md` (`Keep`/`Bans`/`Off`) e bloqueio determinístico Anti-Pill (`U1`, `U9`, `U26`, `U26_DENSITY`).
  - Loop fechado de auto-reparo (máx. 3 rodadas + disjuntor `LOOP_DETECTED` em `q.mjs`), verificação Layer-2 (`test-integrity`, `secret-scan`, `scope-check`, `handoff-verify`) e preflight de navegador (`chrome://inspect/#remote-debugging` + Playwright fallback, `1280x720` + `390x844` + reload persistence).
- **Templates e SOULs Portáteis (`roles/01..07`):**
  - Reescrita completa das 7 instruções em formato agnóstico de plataforma e sistema operacional (caminhos com `/`, variáveis `{{PLATFORM_NAME}}`, `{{COORDINATION_CHANNEL}}`, `{{TEAM_NAME}}`).
  - Incorporação explícita da Matriz de Muro de Papéis, Firewall de Conteúdo Não Confiável, `Simplify Pass`, `Pre-Fix Red Check` e Reviewer Read-Only `[P0-P3]`.

### Alterado
- `core-engines/cinematic-site-components/`: Atualizado com a versão mais recente do diretório global de skills.
- `scripts/install_agent_desktop.py`: Generalizado para o ecossistema multiplataforma (OpenMausBot / OpenBot / Paperclip / Grok Bot).
- `CHANGELOG.md`: Encoding corrigido integralmente para UTF-8 limpo sem BOM.

---

## [2.2.0] — 2026-11-08

### Adicionado
- Integração canônica do motor `agent-desktop` (Vercel Labs, Apache-2.0, versão fixada `1.2.0`) com script `scripts/install_agent_desktop.py` e regras de realismo operacional (headless vs headed), PowerShell quoting (`'@ref'`) e sanitização de dados privados.

---

## [2.1.0] — 2026-11-04

### Adicionado
- Política canônica de ciclo de vida de threads e preservação de contexto por lote (reutilização da mesma thread por Batch/Workstream, proibição de chats descartáveis).

---

## [2.0.0] — 2026-11-03

### Adicionado
- Identidade visual exclusiva por especialista (`mascotBody` e cores) e motores `Slice Orchestration Governor v7.0.1`, `Unslop Craft Design` e `Cinematic Site Components`.

---

## [1.0.0] — 2026-11-02

### Adicionado
- Versão inicial do provisionador de equipe de desenvolvimento autônoma.
