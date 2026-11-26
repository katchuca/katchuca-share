---
name: cinematic-site-components
description: >-
  Master Motion, Layout & Interaction Design Hub. Complete glossary of 31 cinematic zero-framework
  modules plus comprehensive component libraries from transitions.dev, uselayouts.com, lab.xevrion.dev, and Mobbin.
  Use this skill whenever designing high-conversion landing pages, animated UI components,
  bento grids, view transitions, or modern web micro-interactions.
---

# Master Motion & Design Utility Center: The Complete Element Glossary

This skill is the master architectural and design glossary for modern web motion, layouts, and micro-interactions. It catalogs specific, named component primitives with their implementation mechanisms across four premier design authorities.

---

## 📚 1. GLOSSÁRIO DE COMPONENTES: transitions.dev (Jakub Antalík)
*Foco: Transições CSS puras, sem bibliotecas pesadas, prontas para copiar ou via `npx transitions-dev add`.*

| Elemento | Mecânica / Truque de Animação | Caso de Uso Recomendado |
| :--- | :--- | :--- |
| **Digit Flip / Odometer Ticker** | `transform: translateY(-N00%)` em fita numérica com `overflow: hidden`. | Preços dinâmicos, contadores de estatísticas, métricas de dashboard. |
| **Origin-Aware Dropdown** | Mede as coordenadas `(x, y)` do clique e aplica `transform-origin: var(--origin-x) var(--origin-y)` com escala elástica. | Menus de contexto, selects avançados, botões com menu suspenso. |
| **Card Resize (`interpolate-size`)** | Usa a nova propriedade CSS `interpolate-size: allow-keywords` para animar `height: auto` sem JavaScript. | Cartões expansíveis, sanfonas e visualizadores de detalhes. |
| **Error Shake** | `@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }`. | Feedback de senha incorreta, formulários rejeitados, campos obrigatórios. |
| **Success Checkmark Morph** | Animação de traçado SVG com `stroke-dasharray` e `stroke-dashoffset` revelando o ícone de sucesso. | Confirmação de pagamento, envio de formulário, cópia para o clipboard. |
| **Icon / Text Crossfade Morph** | Transição onde texto e ícone realizam crossfade simultâneo com `layoutId` ou `display: grid` com sobreposição. | Botão "Copiar" que vira "Copiado!", botão de favoritos/like. |
| **Modal Scale-In** | `@keyframes modalScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`. | Diálogos de confirmação, popups e formulários modais. |
| **View Transitions API** | `document.startViewTransition(() => updateDOM())` com `@view-transition { navigation: auto; }`. | Transição de telas inteiras, troca de temas claro/escuro e navegação SPA. |

---

## 📐 2. GLOSSÁRIO DE COMPONENTES: uselayouts.com (useLayouts)
*Foco: Componentes animados de alta fidelidade para React, Next.js, Tailwind e shadcn/ui via CLI (`npx shadcn@latest add @uselayouts/[nome]`).*

| Elemento | Mecânica / Truque de Animação | Caso de Uso Recomendado |
| :--- | :--- | :--- |
| **Direction-Aware Tabs** | Calcula se o próximo índice é maior ou menor que o atual para animar o sublinhado/pílula na direção correta. | Menus de navegação superior, abas de configurações, filtros de categoria. |
| **Magnified Bento Grid Cards** | Bento Grid onde o card em foco expande seu `grid-column / grid-row` com transição suave, empurrando os vizinhos. | Seções de features em landing pages modernas, portfolios. |
| **3D Perspective Tilt Card** | Calcula o cursor relativo ao centro do card: `transform: perspective(1000px) rotateX(calc(var(--y) * 15deg)) rotateY(calc(var(--x) * -15deg))`. | Cards de planos SaaS, vitrines de produtos, crachás digitais. |
| **Magnetic Action Pill** | O elemento sofre uma atração física de até 30% em direção ao cursor quando o mouse passa a menos de 50px dele. | Botões de CTA (Call-to-Action) principais, FABs flutuantes. |
| **Dynamic Hover Border Beam** | Um feixe de luz neon percorre o perímetro do card através de um gradiente cônico em máscara CSS. | Destaque do plano "Mais Popular" em tabelas de preços SaaS. |

---

## 🧪 3. GLOSSÁRIO DE EXPERIMENTOS: lab.xevrion.dev (Yash Bavadiya)
*Foco: Física de molas (springs), micro-interações táteis e gestos de ponta (`npx shadcn@latest add https://lab.xevrion.dev/r/<slug>.json`).*

| Elemento | Mecânica / Truque de Animação | Caso de Uso Recomendado |
| :--- | :--- | :--- |
| **iOS Wheel Picker** | Seletor rotativo 3D cilíndrico com amortecimento inercial (*momentum scrolling*) e blur nas extremidades. | Escolha de datas, horários, filtros numéricos e seletores de moeda. |
| **Morphing Action Button** | Botão que encolhe para um círculo de loading giratório e depois expande para um badge de checkmark verde. | Botão de checkout, finalização de compra, deploy de código. |
| **Signature Pad Animado** | Canvas vetorial com suavização de curva Bézier e espessura dinâmica baseada na velocidade do traço. | Assinatura digital de termos, contratos e formulários de entrega. |
| **Floating Announcement Banner** | Pílula flutuante dinâmica que surge do topo com mola amortecida e recolhe ao clicar no 'X'. | Avisos de novidades, alertas de desconto por tempo limitado, changelogs. |
| **Keyboard Shortcut Sheet** | Painel tipo Command-Palette que surge com atalhos de teclado animados (efeito de tecla afundando no clique). | Produtividade, modais de ajuda rápida com `Cmd + K`. |
| **Interactive Canvas Noise / Shader** | Mesh gradient gerado no `<canvas>` reagindo à posição do mouse sem perda de performance (< 2ms no thread). | Fundos imersivos de Hero sections e páginas de erro 404 criativas. |

---

## 📱 4. TAXONOMIA DE ANIMAÇÕES DE PRODUÇÃO: Mobbin Web Animations
*Foco: Os padrões reais utilizados pelos maiores produtos do mundo (Linear, Stripe, Apple, Airbnb, Vercel).*

| Padrão Mobbin | Comportamento e Detalhes de UX |
| :--- | :--- |
| **Sheet & Drawer Slide-overs** | Painel lateral que desliza da borda direita com `backdrop-blur-md`, permitindo gesto de arraste para fechar (*drag-to-dismiss*). |
| **Skeleton Shimmer Loading** | Gradiente linear animado horizontalmente (`translateX(-100%) -> translateX(100%)`) simulando reflexo de luz sobre placeholders cinzas. |
| **Toast Stack Notification** | Sistema de toasts onde as notificações antigas diminuem de escala (`scale(0.95)`, `translateY(10px)`) sob a notificação mais recente. |
| **Accordion Smooth Collapse** | Abertura de FAQ e acordeons usando transições em `grid-template-rows: 0fr -> 1fr`, eliminando a necessidade de fixar alturas em pixels. |
| **Step Wizard Cross-Slide** | Formulários multi-etapas onde a etapa atual desliza para a esquerda (`translateX(-100%)`) e a próxima entra da direita com fade-in. |
| **Filter Pill Pop-in** | Tags de filtro que surgem com escala elástica (`scale(0) -> scale(1.1) -> scale(1)`) ao serem selecionadas. |

---

## 🎬 5. OS 31 MÓDULOS CINEMATOGRÁFICOS NATIVOS (Robonuggets)
*Foco: Componentes prontos em HTML/CSS/JS puro, sem frameworks ou dependências.*

1. **`curtain-reveal`**: Cortina dramática que se abre ao carregar a página.
2. **`zoom-parallax`**: Scroll de profundidade multi-camadas em imagens.
3. **`view-transitions`**: Transições fluidas de estado e rota.
4. **`coverflow`**: Carrossel 3D de cartões deslizantes.
5. **`flip-cards`**: Giro 3D com frente e verso ao passar o mouse.
6. **`sticky-cards`**: Cartões empilháveis fixados no scroll.
7. **`sticky-stack`**: Efeito de baralho sendo folheado verticalmente.
8. **`magnetic-grid`**: Grade de itens que reagem e acompanham a proximidade do mouse.
9. **`cursor-reactive`**: Rastro dinâmico de partículas fluindo atrás do cursor.
10. **`cursor-reveal`**: Efeito lanterna revelando camadas mascaradas.
11. **`spotlight-border`**: Borda brilhante que segue o ângulo do mouse.
12. **`particle-button`**: Botão que desintegra em partículas ao ser clicado.
13. **`text-scramble`**: Efeito Matrix decodificando caracteres ao passar o mouse.
14. **`typewriter`**: Terminal digitando com cursor piscante determinístico.
15. **`circular-text`**: Texto orbitando continuamente em caminho SVG circular.
16. **`kinetic-marquee`**: Faixa contínua infinita com desaceleração no hover.
17. **`dock-nav`**: Dock estilo macOS com efeito de lente de aumento nos ícones.
18. **`dynamic-island`**: Pílula flutuante expansível para status e áudio.
19. **`accordion-slider`**: Galeria em sanfona de altura total.
20. **`mesh-gradient`**: Fundo gradiente em movimento fluído via canvas.
21. **`color-shift`**: Transição de paleta cromática conforme a rolagem.
22. **`horizontal-scroll`**: Rolagem horizontal travada na tela vertical.
23. **`drag-pan`**: Tela de lona infinita arrastável pelo usuário.
24. **`glitch-effect`**: Efeito de aberração cromática e distorção analógica.
25. **`gradient-stroke`**: Texto ou borda com gradiente líquido correndo no traço.
26. **`image-trail`**: Rastro de fotografias que surgem no rastro do cursor.
27. **`odometer`**: Mecanismo de roleta de números em alta precisão.
28. **`split-scroll`**: Tela dividida onde os dois lados rolam em direções opostas.
29. **`svg-draw`**: Linhas vetoriais SVG desenhando-se na rolagem.
30. **`text-mask`**: Vídeo ou gradiente passando dentro do recorte das letras.
31. **`circular-reveal`**: Abertura circular expansível a partir do ponto de clique.

---

## 🛠️ DIRETRIZES DE IMPLEMENTAÇÃO E PERFORMANCE

1. **Aceleração por Hardware Obrigatória**: Animar **apenas** `transform` e `opacity` (usam a GPU via compositor thread). Nunca animar `width`, `height`, `top` ou `margin` para evitar engasgos (*layout thrashing*).
2. **Respeito à Acessibilidade**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. **Validação Automática**: Sempre validar a renderização das animações no Playwright MCP em desktop (`1440x900`) e mobile (`390x844`), garantindo que não ocorra overflow horizontal ou quebra de layout.
