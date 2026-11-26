---
name: unslop-craft-design
description: >-
  Diretrizes de design refinado, craft visual e anti-slop para interfaces web e componentes.
  Elimina layouts genéricos, gradientes clichês, espaçamentos inconsistentes e excesso de elementos decorativos.
  Estabelece um grid de 4px, neutros calmos (quiet chrome), tipografia legível, componentes com estados completos
  e clareza absoluta para o usuário final.
---

# Guia de Craft Design & Eliminação de Slop

Esta especificação define os padrões de interface, ergonomia visual e design system da equipe de desenvolvimento. O objetivo é garantir que toda aplicação possua personalidade própria, acabamento de estúdio e extrema facilidade de uso para usuários leigos e profissionais.

---

## 1. Princípios Fundamentais

### 1.1 Quiet Chrome (Moldura Silenciosa)
- O fundo, a navegação, as bordas e os botões neutros devem permanecer calmos e contidos (tons de cinza escuro/zinc ou off-white/papel neutro).
- A riqueza visual e as cores pertencem ao **conteúdo real do produto** (dados, gráficos, cards de informação, imagens reais), e não a brilhos artificiais espalhados na carcaça.
- É expressamente proibido o uso de gradientes roxos/azuis clichês em fundos, textos com gradiente reflexivo ou botões com brilho neon excessivo.

### 1.2 Grid Estrito de 4px
- Todos os espaçamentos (paddings, margins, gaps, alturas de linha e dimensões de componentes) devem ser múltiplos de 4px (ex: 4, 8, 12, 16, 20, 24, 32, 48px).
- Elementos em linha ou lista devem compartilhar rigorosamente a mesma altura e alinhamento vertical.
- O espaçamento interno de um grupo é sempre menor que o espaçamento entre grupos diferentes.

### 1.3 Cores Funcionais e Contraste
- Uma única rampa neutra para toda a interface (Dark: Zinc `#09090b` até `#27272a`; Light: neutros quentes ou papel).
- Apenas uma cor de acento funcional por tela, aplicada exclusivamente na ação primária ou no status ativo chave.
- Todo texto sobre acento ou fundo deve atingir no mínimo o contraste de 4.5:1 (WCAG AA).
- Cores semânticas (verde para sucesso, vermelho para erro, âmbar para alerta) devem ser discretas e integradas à paleta geral.

### 1.4 Tipografia e Números
- No máximo dois pesos tipográficos em uso regular: 400 (regular) e 500/600 (médio/semi-bold). Evitar pesos 800 ou 900 agressivos.
- Rótulos e textos de interface sempre em *Sentence case* (ex: "Configurações da conta", nunca "CONFIGURAÇÕES DA CONTA").
- Dados numéricos, métricas e tabelas devem utilizar fonte monoespaçada ou `tabular-nums` para alinhamento vertical perfeito.

### 1.5 Ícones e Elementos Decorativos
- Ícones consistentes em estilo de linha (stroke uniforme de 1.5px e tamanho 16px ou 18px).
- Não utilizar emojis como substitutos de ícones em botões, menus ou títulos de seções.
- Remover badges decorativas infantis (como `Novo ✨` ou `Super 🚀`). Badges devem ser informativas, discretas e funcionais.

---

## 2. Roteiro de Auditoria e Refinamento em Camadas

Ao inspecionar ou construir uma interface, siga a ordem obrigatória de camadas:

1. **Espaçamento e Ritmo:** Aplicar a escala de 4px, alinhar colunas e unificar alturas de linhas.
2. **Cores:** Limpar fundos espalhafatosos, definir neutros contínuos e posicionar o acento funcional.
3. **Ícones:** Padronizar iconografia por conjunto vetorial único e remover emojis soltos.
4. **Redação e Mensagens:** Traduzir termos técnicos crús para linguagem clara, humana e direta, sem exclamações exageradas.
5. **Tipografia:** Definir escala harmônica de fontes, leading proporcional e pesos contidos.
6. **Estados de Interface:** Garantir para cada componente os 4 estados obrigatórios:
   - Carregando (Skeleton fluido);
   - Vazio (Empty State elegante e orientador);
   - Erro (Mensagem amigável com ação de recuperação);
   - Sucesso / Ativo (Feedback visual imediato).
7. **Responsividade:** Validar legibilidade e usabilidade de 375px (mobile) até 1440px+ (desktop).
