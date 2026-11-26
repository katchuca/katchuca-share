# Adaptadores Multiplataforma (v3.0.0)

Ao executar `scripts/bind_project.py`, os arquivos abaixo são gerados automaticamente dentro de `<PROJECT_ROOT>/.slices/team-adapters/` com as instruções dos 7 especialistas já parametrizadas para o projeto:

- **`team_spec.canonical.json`**: Especificação agnóstica de plataforma (papéis, permissões, cores/ícones, regras v8.3.0).
- **`openmausbot.propose_team_setup.json`**: Payload pronto para `propose_team_setup` no **OpenMausBot**.
- **`openbot.team_setup.json`**: Payload pronto para provisionamento de equipe no **OpenBot**.
- **`paperclip.company_pack.yaml`** + **`paperclip_agents/*.yaml`**: Org chart hierárquico (`reportsTo`), `executionPolicy` (Review -> QA/Auditor, Approval -> Humano), `isolatedWorkspaces` e lista de skills para **Paperclip** (`paperclip.ing`).
- **`grok-bot.team.json`** + **`generic-agents.md`**: Definição JSON + guia Markdown para **Grok Bot**, **OpenClaw**, subagentes CLI (`Codex`, `Claude Code`, `Gemini CLI`, `OpenCode`) ou endpoints HTTP/Process customizados.
