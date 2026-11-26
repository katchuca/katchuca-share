# Segmento 01 — Skills (`skill/`)

Todas as skills públicas gratuitas do ecossistema **kaTcHuca** ficam organizadas aqui em pastas individuais descompactadas.

> **Uso gratuito (CC BY-NC 4.0):** uso livre com atribuição; proibida comercialização ou revenda. Veja [`../LICENSE`](../LICENSE).

---

## Catálogo de Skills Disponíveis

| # | Skill | Versão | O que faz | Hub / Desbloqueio |
|:-:|:--|:--:|:--|:--|
| 1 | [`slice-orchestration-governor`](./slice-orchestration-governor/) | `v8.3.0` | Governador de engenharia autônoma *Zero-Shadow* para agentes de código (Greenfield/Brownfield, TODO/CHANGELOG automáticos, `design-lint`, `secret-scan`, preflight Chrome/Playwright) | [share.katchuca.workers.dev/r/slice-orchestration-governor](https://share.katchuca.workers.dev/r/slice-orchestration-governor) |
| 2 | [`dev-team-orchestration`](./dev-team-orchestration/) | `v3.0.0` | Construtor automático de **time de dev com 7 bots especialistas + Tech Lead** que conversam entre si (**OpenMausBot**, **OpenBot**, **Paperclip**, **Grok Bot**, **OpenClaw** e CLIs/MCP) | [share.katchuca.workers.dev/r/dev-team-orchestration](https://share.katchuca.workers.dev/r/dev-team-orchestration) |

---

## Instalação Direta do GitHub

### 1. `slice-orchestration-governor` (`v8.3.0`)

**Windows (PowerShell):**
```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git "$env:TEMP\ks"; git -C "$env:TEMP\ks" sparse-checkout set skill/slice-orchestration-governor; node "$env:TEMP\ks\skill\slice-orchestration-governor\scripts\install.mjs" --non-interactive --global-only; Remove-Item -Recurse -Force "$env:TEMP\ks"
```

**macOS / Linux:**
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git /tmp/ks && git -C /tmp/ks sparse-checkout set skill/slice-orchestration-governor && node /tmp/ks/skill/slice-orchestration-governor/scripts/install.mjs --non-interactive --global-only && rm -rf /tmp/ks
```

### 2. `dev-team-orchestration` (`v3.0.0`)

**Windows (PowerShell):**
```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git "$env:TEMP\ks-team"; git -C "$env:TEMP\ks-team" sparse-checkout set skill/dev-team-orchestration; python "$env:TEMP\ks-team\skill\dev-team-orchestration\scripts\bind_project.py" --project-name "MeuProjeto" --project-path . --platform all; Remove-Item -Recurse -Force "$env:TEMP\ks-team"
```

**macOS / Linux:**
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git /tmp/ks-team && git -C /tmp/ks-team sparse-checkout set skill/dev-team-orchestration && python3 /tmp/ks-team/skill/dev-team-orchestration/scripts/bind_project.py --project-name "MeuProjeto" --project-path . --platform all && rm -rf /tmp/ks-team
```

---

## Estrutura de Referência
- [`_template/`](./_template/) — modelo base para novas skills (`SKILL.md`, `README.md`, `scripts/`, `references/`).
