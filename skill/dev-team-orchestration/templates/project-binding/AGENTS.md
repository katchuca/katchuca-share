# {{PROJECT_NAME}} — CONSTITUIÇÃO DO PRODUTO

> Esta seção pertence ao projeto **{{PROJECT_NAME}}** e fica **acima** do bloco `AGYBOT_BOOTSTRAP` para nunca ser sobrescrita por atualizações do motor global.

## 1. Missão & Regras do Produto
- **Projeto:** {{PROJECT_NAME}}
- **Raiz:** `{{PROJECT_ROOT}}`
- **Ciclo de vida:** Detectado automaticamente via `node .slices/agybot.mjs lifecycle-probe` (`GREENFIELD` vs `BROWNFIELD`).
- **Fontes de verdade:** `docs/SPEC.md`, `docs/ARCHITECTURE_C4.md`, `docs/ROADMAP.md` (ou documentos canônicos já existentes no repositório).

## 2. Regras Absolutas de Engenharia
- **Autonomia Dentro da Governança:** Resolver detalhes técnicos reversíveis com evidência real (`AUTONOMY_FIRST`); escalar ao humano apenas decisões materiais de produto/escopo/irreversíveis ou bloqueios externos.
- **Zero Invenção:** Não criar requisitos, endpoints ou alterações de UI fora do escopo aprovado (`UNMENTIONED_UI_IS_FROZEN` em projetos existentes).
- **Codificação Universal:** Ler e gravar arquivos estritamente em **UTF-8 sem BOM**.
- **Muro de Papéis & Escopos Disjuntos:** Coordenador e Arquiteto não editam código de produto; Builder/Frontend atuam apenas dentro de `writeScopes` disjuntos (`scope-check`); QA coleta provas físicas via `q.mjs`; Auditor homologa em modo somente leitura (`handoff-verify`).
- **Higiene Visual (`AGY_UX_V2`):** Seguir `.slices/DESIGN_TASTE.md` e `DESIGN.md`, aplicando `REUSE -> VARIANT -> EXTEND -> NEW` e regras Anti-Pill (`U1`, `U9`, `U26`).
- **Continuidade de Thread / Ticket:** Manter toda comunicação, revisão e correção do mesmo lote de trabalho na mesma thread/ticket ativa.
