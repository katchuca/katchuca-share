# {{PROJECT_NAME}} — DESIGN SYSTEM & DIRETRIZES VISUAIS

> Complementa `.slices/DESIGN_TASTE.md` e segue precedência estrita:
> `AGENTS.md` > Primitivas aprovadas (`REUSE -> VARIANT -> EXTEND -> NEW`) > `.slices/DESIGN_TASTE.md` > `AGY_UX_V2` (`design-lint`).

## 1. Princípios Visuais
- **Quiet Chrome:** Superfícies neutras e contidas para destacar conteúdo e estado real do produto.
- **Hierarquia & Grid de 4px:** Espaçamentos e ritmos em múltiplos de `4px` (`4, 8, 12, 16, 24, 32`).
- **Contraste & Acessibilidade:** Mínimo `4.5:1` (WCAG AA), rótulos explícitos (`<label for>`, `aria-label`), navegação por teclado e foco visível.
- **Anti-Pill & Anti-Slop:** Zero pílulas decorativas acima de títulos (`U1`), zero badges falsos `NEW`/`AI`/`PRO`/`LIVE` (`U9`) e zero aglomeração de badges `rounded-full` (`U26`).

## 2. Responsividade & Verificação
- Desktop (`1280x720` / `1440px+`) e Mobile (`390x844` / `375px`) sem sobreposição, corte ou rolagem horizontal acidental.
- Toda interface deve cobrir os 4 estados reais: **Carregando**, **Vazio**, **Erro Amigável** e **Sucesso/Ativo**.
