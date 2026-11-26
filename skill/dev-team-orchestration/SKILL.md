---
name: dev-team-installation
version: 3.0.0
description: >-
  Instalador Universal e Agnóstico de Plataforma de Equipes de Desenvolvimento Autônomas.
  Provisiona uma equipe de 7 especialistas (Tech Lead, Arquiteto, Builder, UI/UX, Frontend, QA e
  Gate Auditor) governada pelo Slice Orchestration Governor v8.3.0 (Zero-Shadow Global Engine),
  AGY_UX_V2 (Anti-Pill / DESIGN_TASTE.md), Craft Design, Cinematic Site Components e
  agent-desktop v1.2.0 (opcional para apps desktop). Gera adaptadores prontos para OpenMausBot,
  OpenBot, Paperclip, Grok Bot, OpenClaw e runtimes CLI/MCP genéricos.
---

# Dev Team Installation Skill — Universal Multi-Platform (v3.0.0)

Esta skill provisiona e vincula uma equipe autônoma de 7 especialistas a **qualquer projeto local** (`GREENFIELD` ou `BROWNFIELD`) e gera os arquivos de equipe no formato exato de **qualquer plataforma agêntica**:

- **OpenMausBot** (`openmausbot.propose_team_setup.json` — compatível com `propose_team_setup`, silhuetas e cores)
- **OpenBot** (`openbot.team_setup.json` — departamentos, papéis, modelos configuráveis e instruções)
- **Paperclip** (`paperclip.company_pack.yaml` + `paperclip_agents/*.yaml` — org chart `reportsTo`, `executionPolicy` com Review/Approval, `isolatedWorkspaces`, `skills`)
- **Grok Bot / OpenClaw / Subagentes Genéricos** (`grok-bot.team.json` + `generic-agents.md`)
- **Canônico Agnóstico** (`team_spec.canonical.json` — especificação neutra para qualquer orquestrador ou CLI como Codex, Claude Code, Gemini CLI, OpenCode ou Antigravity)

---

## 1. Como Usar (Qualquer Plataforma)

### Ativação por Comando / Chat
Quando o usuário pedir no chat (em qualquer plataforma):
> **"Quero um time de dev para operar o projeto [NOME_DO_PROJETO] em [CAMINHO_ABSOLUTO] usando a skill dev-team-installation"**

Ou especificando uma plataforma:
> **"Crie o time para [NOME] em [CAMINHO] no formato Paperclip / OpenBot / OpenMausBot / Grok Bot"**

### Passos Determinísticos de Instalação
1. **Vincular o projeto e gerar os adaptadores:**
   ```bash
   python scripts/bind_project.py --project-name "<NOME>" --project-path "<CAMINHO>" --platform all
   ```
   Opções principais:
   - `--platform`: `all` (padrão), `openmausbot`, `openbot`, `paperclip`, `grok-bot`, `generic`
   - `--lifecycle`: `auto` (padrão — detecta `GREENFIELD` vs `BROWNFIELD`), `greenfield`, `brownfield`
   - `--team-name`: nome da equipe/departamento (padrão: `<NOME> Devs`)
   - `--model`: modelo padrão opcional (ex.: `auto`, `gemini-3.8-flash`, `gpt-6-luna`, `grok-4.7`)
   - `--instance-id`: ID de instância/provedor opcional (para OpenMausBot/OpenBot)
   - `--adapter-runtime`: runtime de execução no Paperclip (ex.: `auto`, `codex`, `claude_local`, `opencode`, `grok`, `gemini`, `process`)
   - `--autonomy`: `AUTONOMY_FIRST` (padrão), `BALANCED`, `OWNER_GUIDED`
   - `--visual`: `HYBRID` (padrão), `HUMAN_MANUAL`, `AUTOMATED_FOCUSED`
   - `--browser-mode`: `CHROME_DEVTOOLS_OR_PLAYWRIGHT` (padrão), `CHROME_DEVTOOLS`, `PLAYWRIGHT_HEADLESS`, `MANUAL_ONLY`
   - `--tracking-mode`: `auto` (padrão), `GOVERNOR_MANAGED`, `PROJECT_OWN_DOCS`
   - `--skip-setup`: pula o `agybot setup` automático caso prefira responder o `/grill-me` interativo no chat
   - `--force-global-sync` / `--sync-companions`: força reinstalação verificada por `SHA256SUMS.txt` do motor global v8.3.0 e sincroniza `craft-design` e `cinematic-site-components`
   - `--skip-global-sync`: pula a sincronização do `slice-orchestration-governor` v8.3.0 para `~/.gemini/config/skills/`

2. **O que o script faz automaticamente:**
   - Valida a integridade via `SHA256SUMS.txt` e instala/atualiza o **Slice Orchestration Governor v8.3.0** na pasta global canônica (`~/.gemini/config/skills/slice-orchestration-governor`), mantendo no máximo 1 backup fora de descoberta (`Zero-Shadow` — sem cópias duplicadas dentro do projeto).
   - Em projetos `GREENFIELD` (do zero), cria a Constituição do Produto (`AGENTS.md`), `DESIGN.md` e a base documental enxuta (`docs/SPEC.md`, `docs/ARCHITECTURE_C4.md`, `docs/ROADMAP.md`). Em `BROWNFIELD`, preserva regras e telas existentes (`UNMENTIONED_UI_IS_FROZEN`).
   - Executa `install.mjs --bind-project <CAMINHO> --non-interactive` para criar os forwarders portáteis em `.slices/` (`agybot.mjs`, `agy-hook.mjs`, `slice-governor.mjs`, `verify-slice-gate.mjs`, `secret-scan.mjs`, `design-lint.mjs`, `q.mjs`), configurar `.agents/hooks.json` (`agybot-v8`), atualizar `.git/info/exclude` e inserir o bloco `<!-- AGYBOT_BOOTSTRAP:START -->` no `AGENTS.md`.
   - Executa `agybot setup` (quando ainda não há `.slices/SLICE_GOVERNOR.json`) inicializando `AUTONOMY_FIRST`, `QUALIFIED_AUTO`, `NATIVE_SUBAGENTS`, `.agy-vault/`, `.slices/TODO.md`, `.slices/CHANGELOG.md`, `.slices/MASTER_SLICE_CHECKLIST.md` e `browserTesting` (`chrome://inspect/#remote-debugging` + Playwright fallback), além de registrar `docs/SPEC.md` como fonte `LIVING` (`SPEC-PRIMARY`) em projetos `GREENFIELD` e inicializar `.slices/DESIGN_TASTE.md` (`design-taste-init` Anti-Pill `U1`/`U9`/`U26`).
   - Carrega as 7 instruções em `roles/` usando variáveis portáteis (`{{PROJECT_NAME}}`, `{{PROJECT_ROOT}}`, `{{PLATFORM_NAME}}`, `{{COORDINATION_CHANNEL}}`, `{{TEAM_NAME}}`) e grava os adaptadores prontos em `<CAMINHO>/.slices/team-adapters/`.

3. **Aplicar na plataforma de destino:**
   - **OpenMausBot / OpenBot:** Leia `.slices/team-adapters/openmausbot.propose_team_setup.json` (ou `openbot.team_setup.json`), ajuste os IDs de modelo/instância conforme `list_team_setup` se necessário, e aplique com `propose_team_setup`.
   - **Paperclip:** Importe `.slices/team-adapters/paperclip.company_pack.yaml` ou crie os agentes com os arquivos individuais em `.slices/team-adapters/paperclip_agents/*.yaml` (já configurados com `reportsTo`, `executionPolicy` e `isolatedWorkspaces`).
   - **Grok Bot / OpenClaw / Genérico:** Utilize `.slices/team-adapters/grok-bot.team.json` ou os prompts consolidados em `.slices/team-adapters/generic-agents.md`.

---

## 2. A Equipe Provisionada (7 Especialistas — Padrão v8.3.0)

| # | Papel | Responsabilidade Canônica (v8.3.0) | Avatar / Cor |
|---|---|---|---|
| 1 | **Tech Lead & Coordenador (Chief)** | Orquestração por Classe A/B/C/D, Total Autonomy (`AUTONOMY_FIRST`), escopos disjuntos (`scope-check`), `hawd`, `autoLearn`, continuidade de thread/ticket | `star` / `yellow` |
| 2 | **Arquiteto de Software (Spec)** | Rastreamento C4 Outside-In (`file:line`), contratos, máquinas de estado, `ARCHITECTURE_C4.md`, Firewall de Conteúdo Não Confiável (Read-Only em código) | `hexagon` / `teal` |
| 3 | **Builder (Implementação)** | Implementação dentro de `writeScopes`, `Pre-Fix Red Check`, `Simplify Pass` obrigatório, `test-integrity`, `secret-scan`, runner `q.mjs` | `squircle` / `coral` |
| 4 | **UI/UX & Design System** | Guardião do `.slices/DESIGN_TASTE.md` (`Keep`/`Bans`/`Off`), `REUSE -> VARIANT -> EXTEND -> NEW`, Anti-Pill e Anti-Slop (`AGY_UX_V2` U1–U26) | `diamond` / `green` |
| 5 | **Frontend & Componentes** | 4 estados completos de UI, acessibilidade semântica, micro-interações 60fps (`cinematic-site-components`), `design-lint --changed` antes do handoff | `capsule` / `blue` |
| 6 | **QA & Validação Real** | Loop fechado de auto-reparo (máx. 3 rodadas + `LOOP_DETECTED`), Playwright / `chrome://inspect/#remote-debugging`, `1280x720` + `390x844`, reload persistence, `agent-desktop` v1.2.0 quando desktop | `circle` / `red` |
| 7 | **Auditor de Portões (Gate Auditor)** | Reviewer Read-Only (`[P0-P3] file:line \| fix`), STRIDE/OWASP, `AGY_UX_V2`, paridade física (`handoff-verify`), bloqueio de `.skip`/deps sem lockfile | `shield` / `orange` |

---

## 3. Atalhos de Operação no Projeto (v8.3.0)

Mesmo em Autonomia Total, a pessoa usuária ou qualquer bot pode acionar os comandos em `.slices/agybot.mjs`:

- `status` — estado atual, ciclo (`GREENFIELD`/`BROWNFIELD`), modo de navegador e runtime
- `hawd` — resumo verificado do que foi feito + decisões humanas pendentes
- `todo` / `record` — acompanha e registra entregas, fixes e deploys em `TODO.md` + `CHANGELOG.md` + `MASTER_SLICE_CHECKLIST.md`
- `promote-rule` — promove regra durável para `AGENTS.md`, `.slices/DESIGN_TASTE.md` ou `.agy-vault/`
- `doctor` / `browser-config` — diagnóstico completo (Git, Node, Python, Zero-Shadow, hooks e `chrome://inspect/#remote-debugging` vs Playwright)
- `learn --promote` — revisa e promove aprendizados automáticos de fricções e loops

---

## 4. Motores Integrados (`core-engines/`)

- **`slice-orchestration-governor/` (v8.3.0 — espelho integral dos 90 arquivos do release oficial):** Motor global Zero-Shadow com `AUTONOMY_FIRST`, classificação de intenção multilíngue, playbooks `GREENFIELD`/`BROWNFIELD`, `DESIGN_TASTE.md`, anti-pill `design-lint.mjs`, `test-integrity`, `scope-check`, `q.mjs`, `secret-scan`, `handoff-verify`, preflight de navegador e suíte `self-test-v8.3.0.mjs` (`T1`–`T45`).
- **`craft-design/`:** Diretrizes de craft visual, quiet chrome, grid de 4px e prevenção de slop.
- **`cinematic-site-components/`:** Glossário completo de componentes, motion e layouts cinematográficos.
- **`agent-desktop/` (v1.2.0, opcional):** Automação desktop por árvore de acessibilidade (apenas quando o projeto alvo é aplicativo desktop; nunca forçado em backend ou web).

---

## 5. Estrutura do Pacote

- `SKILL.md`: Guia de ativação multiplataforma.
- `VERSION` & `CHANGELOG.md`: Controle de versão semântica (v3.0.0).
- `README.md`: Guia rápido de uso para qualquer bot agêntico.
- `core-engines/`: Motores atualizados (`slice-orchestration-governor` v8.3.0 completo, `craft-design`, `cinematic-site-components`, `agent-desktop` v1.2.0).
- `roles/`: Prompts/SOULs canônicos e agnósticos de plataforma dos 7 especialistas.
- `templates/project-binding/`: Constituição do produto, design system e documentos Greenfield.
- `adapters/`: Esquemas de referência e documentação por plataforma (`openmausbot`, `openbot`, `paperclip`, `grok-bot`, `generic`).
- `scripts/`: `bind_project.py` (instalador universal multiplataforma) e `install_agent_desktop.py`.
