# agent-desktop — Motor Canônico de Automação Desktop & Acessibilidade

> **Fonte Oficial:** [https://github.com/vercel-labs/agent-desktop](https://github.com/vercel-labs/agent-desktop)  
> **Licença:** Apache-2.0 (Vercel Labs)  
> **Mapeamento:** Integração para equipes de desenvolvimento autônomas no OpenMausBot (Dev Team).

---

## 1. Visão Geral

O **agent-desktop** é uma ferramenta de linha de comando (CLI) e biblioteca C desenvolvida pela Vercel Labs para permitir que agentes de inteligência artificial operem aplicações desktop de forma determinística em **Windows**, **macOS** e **Linux**.

Diferente de automações tradicionais baseadas em captura de tela (screenshots), OCR ou estimativa frágil de coordenadas em pixels, o `agent-desktop` lê a **árvore de acessibilidade nativa** do sistema operacional:
- **Windows:** UI Automation (UIA)
- **macOS:** Accessibility API (AX API)
- **Linux:** AT-SPI

O loop de percepção, decisão e verificação reside inteiramente no agente chamador. O `agent-desktop` não embuti modelo de linguagem (LLM) nem inteligência autônoma; ele atua estritamente como executor de ferramentas com retorno padronizado em **envelopes JSON**.

---

## 2. Instalação e Requisitos do Ambiente

### Instalação Canônica (npm)
```bash
npm install -g agent-desktop
```

### Verificação de Saúde e Permissões
```bash
agent-desktop status
```
Retorna JSON com status de permissões (`accessibility`, `automation`, `screen_recording`), plataforma detectada e superfícies suportadas.

---

## 3. O Loop Fundamental: Observe — Act — Verify

1. **Mapeamento Inicial da Aplicação:**
   ```bash
   agent-desktop snapshot --app "NomeDoApp" -i --compact
   ```
2. **Localização e Ação por Ref:**
   Cada elemento interativo recebe um identificador qualificado estável por captura (ex: `@s8f3k2p9:e12`).
   ```bash
   # No PowerShell, OBRIGATÓRIO utilizar aspas simples no ref:
   agent-desktop click '@s8f3k2p9:e12'
   ```
3. **Verificação Imediata de Estado:**
   ```bash
   agent-desktop snapshot --app "NomeDoApp" -i --compact
   ```

---

## 4. Diretrizes Cruciais e Limitações (Princípios de Realismo & Segurança)

1. **PowerShell Quoting (`'@ref'`):**
   No PowerShell, o caractere `@` é o operador de splatting. Referências como `@s8f3k2p9:e1` DEVEM sempre estar entre aspas simples (`'@s8f3k2p9:e1'`) para não serem corrompidas antes do executável receber o comando.
2. **Headless vs. Headed (Primeiro Plano):**
   - Interações semânticas (`click`, `set-value`, `toggle`, `select`, `scroll`) funcionam em modo *headless* via API de acessibilidade sem roubar o foco ou movimentar o cursor físico.
   - Ações físicas reais (`type`, `right-click`, `double-click`, `focus`, `mouse-move`) requerem `--headed` e trazem a janela para o primeiro plano.
   - **Regra:** Nunca prometa trabalho sempre em segundo plano quando a ação física exigir foco do usuário.
3. **Preferência por Ferramentas Nativas:**
   No ecossistema OpenMausBot, dê sempre preferência às ferramentas nativas de computador montadas no ambiente quando disponíveis. Use `agent-desktop` como CLI reprodutível e portável para qualquer terminal ou suíte de testes.
4. **Sem Promessa de Anti-Ban ou Eventos Mágicos:**
   Entradas sintetizadas interagem com o sistema operacional real. Nunca prometa imunidade a detecções ou simulação humana perfeita.
5. **Evidência Física Obrigatória:**
   O QA e os bots da equipe devem sempre registrar a saída JSON real (`ok: true`, `command`, `data`) nos arquivos de evidência física em `tasks/evidence/`.

---

## 5. Estrutura de Referências
- `references/commands-observation.md`: Comandos `snapshot`, `find`, `get`, `is`, `screenshot`.
- `references/commands-interaction.md`: Comandos `click`, `type`, `set-value`, `select`, `toggle`, `scroll`.
- `references/commands-system.md`: Comandos de ciclo de vida de janelas, clipboard, esperas e sessões.
- `references/workflows.md`: Padrões de trabalho recomendados e antipadrões.
- `skills/agent-desktop-windows/`: Guia aprofundado para Windows (UIA, UIPI, Action Center, Electron/Chromium).
