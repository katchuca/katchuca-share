# Dev Team Installation v3.0.0 (Multiplataforma + Slice Governor v8.3.0)

Pacote instalador universal para montar uma equipe de 7 especialistas de engenharia governados pelo **Slice Orchestration Governor v8.3.0** (distribuição oficial completa com `self-test-v8.3.0.mjs` `T1`–`T45` e `SHA256SUMS.txt`).

## Pré-requisitos
- **Python 3.10+** (para `scripts/bind_project.py`)
- **Node.js 18+** (para os scripts do `slice-orchestration-governor` v8.3.0 em `.slices/agybot.mjs` e `design-lint.mjs`)
- **Opcional (somente apps desktop):** `npm` para `scripts/install_agent_desktop.py` (`agent-desktop@1.2.0`)

## Instalação Rápida em Qualquer Projeto

```bash
python scripts/bind_project.py \
  --project-name "MeuProjeto" \
  --project-path "/caminho/para/MeuProjeto" \
  --platform all
```

Opções úteis:
- `--platform all|openmausbot|openbot|paperclip|grok-bot|generic`
- `--autonomy AUTONOMY_FIRST|BALANCED|OWNER_GUIDED`
- `--browser-mode CHROME_DEVTOOLS_OR_PLAYWRIGHT|CHROME_DEVTOOLS|PLAYWRIGHT_HEADLESS|MANUAL_ONLY`
- `--tracking-mode auto|GOVERNOR_MANAGED|PROJECT_OWN_DOCS`
- `--force-global-sync` / `--sync-companions` (valida `SHA256SUMS.txt` e sincroniza também `craft-design` e `cinematic-site-components`)
- `--skip-setup` (deixa a configuração interativa `/grill-me` para o primeiro chat no projeto)

### Plataformas Geradas em `<PROJECT_ROOT>/.slices/team-adapters/`
1. **`team_spec.canonical.json`** — Especificação universal neutra.
2. **`openmausbot.propose_team_setup.json`** — Payload pronto para `propose_team_setup` no OpenMausBot.
3. **`openbot.team_setup.json`** — Payload pronto para OpenBot.
4. **`paperclip.company_pack.yaml` + `paperclip_agents/*.yaml`** — Pacote de org chart e Execution Policy para Paperclip (`paperclip.ing`).
5. **`grok-bot.team.json` + `generic-agents.md`** — Bundle JSON e Markdown para Grok Bot, OpenClaw e agentes CLI/HTTP genéricos.

## Comandos Principais Pós-Vínculo (dentro do projeto)
```bash
node .slices/agybot.mjs doctor
node .slices/agybot.mjs lifecycle-probe
node .slices/agybot.mjs status
node .slices/agybot.mjs hawd
node .slices/agybot.mjs todo
node .slices/agybot.mjs record --type feat --summary "Resumo da entrega"
node .slices/agybot.mjs design-lint --changed
```
