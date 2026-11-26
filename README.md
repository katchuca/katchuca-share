<div align="center">

# kaTcHuca share.

**Biblioteca pública e gratuita de Skills, Ferramentas, Prompts e Materiais Técnicos do ecossistema kaTcHuca.**

[![Hub Oficial](https://img.shields.io/badge/Hub_Oficial-share.katchuca.workers.dev-54E2E7?style=for-the-badge&logo=cloudflareworkers&logoColor=151516)](https://share.katchuca.workers.dev)
[![Licença](https://img.shields.io/badge/Licença-CC_BY--NC_4.0_(Não_Comercial)-F0AA3B?style=for-the-badge)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills_Disponíveis-2-FF2D5A?style=for-the-badge)](./skill)

[Acessar Hub & Desbloquear por Link](https://share.katchuca.workers.dev) · [Cursos & Ecossistema](https://share.katchuca.workers.dev/cursos) · [Apps & Jogos](https://share.katchuca.workers.dev/projetos) · [Artigos (Substack)](https://katchuca.substack.com/)

</div>

---

> [!NOTE]
> **Veio de um vídeo ou postagem no X, YouTube ou Instagram?**
> Cole o link da postagem direto em **[share.katchuca.workers.dev](https://share.katchuca.workers.dev)** para encontrar a skill exata citada no conteúdo, instruções passo a passo e arquivos prontos.
> Se curtiu o acervo, deixe uma **⭐ Star** neste repositório para acompanhar as próximas liberações!

---

## Segmentos do Repositório

| # | Pasta | O que você encontra aqui | Status |
|:-:|:--|:--|:--|
| 01 | [`skill/`](./skill/) | Skills instaláveis para agentes de IA (Antigravity, OpenMausBot, OpenBot, Paperclip, Grok Bot, Claude Code, Cursor, Codex) | Ativo |
| 02 | [`tool/`](./tool/) | Scripts, utilitários e automações práticas | Em expansão |
| 03 | [`prompt/`](./prompt/) | Prompts estruturados e frameworks de produção | Em expansão |
| 04 | [`article/`](./article/) | Códigos e anexos dos ensaios no Substack | Em expansão |
| 05 | [`course/`](./course/) | Materiais complementares e guias de estudo | Em expansão |
| 06 | [`app/`](./app/) | Documentações públicas e demos de aplicativos | Em expansão |
| 07 | [`game/`](./game/) | Recursos abertos e devlogs de jogos | Em expansão |

---

## Catálogo de Skills (`skill/`)

### 1. [`slice-orchestration-governor`](./skill/slice-orchestration-governor/) — `v8.3.0`

**Governador de engenharia autônoma Plug-and-Play para agentes de IA**, com classificação multilíngue de intenção, runtime global *Zero-Shadow*, playbooks Greenfield/Brownfield, auto-atualização de `TODO` / `CHANGELOG` / `MASTER`, preflight de navegador (`chrome://inspect/#remote-debugging` + Playwright), guarda anti-pill `AGY_UX_V2`, integridade Layer-2 de testes, self-repair limitado a 3 rodadas e varredura `secret-scan`.

#### Instalação rápida direto do GitHub

**Windows (PowerShell):**
```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git "$env:TEMP\ks"; git -C "$env:TEMP\ks" sparse-checkout set skill/slice-orchestration-governor; node "$env:TEMP\ks\skill\slice-orchestration-governor\scripts\install.mjs" --non-interactive --global-only; Remove-Item -Recurse -Force "$env:TEMP\ks"
```

**macOS / Linux (Terminal):**
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git /tmp/ks && git -C /tmp/ks sparse-checkout set skill/slice-orchestration-governor && node /tmp/ks/skill/slice-orchestration-governor/scripts/install.mjs --non-interactive --global-only && rm -rf /tmp/ks
```

**Vincular em qualquer projeto depois de instalar:**
```bash
node ~/.gemini/config/skills/slice-orchestration-governor/scripts/install.mjs --non-interactive --bind-only --bind-project .
```

> Veja todos os detalhes em [`skill/slice-orchestration-governor/INSTALL.md`](./skill/slice-orchestration-governor/INSTALL.md) ou em **[share.katchuca.workers.dev/r/slice-orchestration-governor](https://share.katchuca.workers.dev/r/slice-orchestration-governor)**.

---

### 2. [`dev-team-orchestration`](./skill/dev-team-orchestration/) — `v3.0.0`

**Construtor multiplataforma de time autônomo de 7 especialistas com Tech Lead**, preparado para **OpenMausBot**, **OpenBot**, **Paperclip**, **Grok Bot**, **OpenClaw** e runtimes agênticos CLI/MCP — provisiona Tech Lead, Arquiteto, Builder, UI/UX, Frontend, QA e Gate Auditor conversando entre si sob governança do Slice Governor v8.3.0.

#### Instalação rápida direto do GitHub (Windows / macOS / Linux)

**Windows (PowerShell):**
```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git "$env:TEMP\ks-team"; git -C "$env:TEMP\ks-team" sparse-checkout set skill/dev-team-orchestration; python "$env:TEMP\ks-team\skill\dev-team-orchestration\scripts\bind_project.py" --project-name "MeuProjeto" --project-path . --platform all; Remove-Item -Recurse -Force "$env:TEMP\ks-team"
```

**macOS / Linux (Terminal):**
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/katchuca/katchuca-share.git /tmp/ks-team && git -C /tmp/ks-team sparse-checkout set skill/dev-team-orchestration && python3 /tmp/ks-team/skill/dev-team-orchestration/scripts/bind_project.py --project-name "MeuProjeto" --project-path . --platform all && rm -rf /tmp/ks-team
```

> Pré-requisitos: **Git**, **Python 3.10+** e **Node.js 18+**. Plataformas geradas em `.slices/team-adapters/` (`openmausbot`, `openbot`, `paperclip`, `grok-bot`, `generic`). Página no hub: **[share.katchuca.workers.dev/r/dev-team-orchestration](https://share.katchuca.workers.dev/r/dev-team-orchestration)**.

---

## Como usar este repositório

1. **Instale direto via GitHub:** use os comandos de terminal acima para baixar somente a pasta da skill que deseja sem clonar arquivos desnecessários.
2. **Explore arquivo por arquivo:** todas as pastas permanecem descompactadas no repositório para que você possa ler `SKILL.md`, `scripts/`, `roles/` e `references/` antes de instalar.
3. **Precisa do `.zip` pronto?** Os pacotes `.zip` ficam disponíveis exclusivamente na aba **[Releases](https://github.com/katchuca/katchuca-share/releases)** e nos botões de download de **[share.katchuca.workers.dev](https://share.katchuca.workers.dev)**, mantendo as pastas do repositório limpas.

---

## Licença (Uso Gratuito — Comercialização Proibida)

Este repositório é distribuído sob a licença **[CC BY-NC 4.0 (Atribuição-NãoComercial 4.0 Internacional)](./LICENSE)**:

- **Permitido:** usar, estudar, adaptar e compartilhar gratuitamente em uso pessoal, educacional ou fluxos próprios com atribuição a **kaTcHuca**.
- **Proibido:** vender, revender, empacotar em infoprodutos pagos ou comercializar qualquer skill, prompt ou código deste acervo sem autorização expressa por escrito.

---

<div align="center">

### Acompanhe os conteúdos & novos lançamentos

[![YouTube](https://img.shields.io/badge/YouTube-@katchuca-FF0000?style=flat-square&logo=youtube&logoColor=white)](https://www.youtube.com/katchuca)
[![X](https://img.shields.io/badge/X-@evandromoisinho-111111?style=flat-square&logo=x&logoColor=white)](https://x.com/evandromoisinho)
[![Instagram](https://img.shields.io/badge/Instagram-@katchuca.nft-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/katchuca.nft)
[![Substack](https://img.shields.io/badge/Substack-katchuca-FF6719?style=flat-square&logo=substack&logoColor=white)](https://katchuca.substack.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-katchuca-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/katchuca/)

</div>
