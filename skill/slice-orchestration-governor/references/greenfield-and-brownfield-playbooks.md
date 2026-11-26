# Greenfield & Brownfield Playbooks, Spec Evolution & Design Hygiene — v8.3.0

Agy Bot adapts automatically whether a repository starts **from scratch (`GREENFIELD`)** or has **existing code/docs (`BROWNFIELD`)**. Inspect any workspace with:

```powershell
node .slices/agybot.mjs lifecycle-probe
```

---

## 1. Greenfield Workflow ("Projeto do Zero")

When `lifecycle-probe` reports `mode: "GREENFIELD"`:

1. **Product Discovery Before Code (`/grill-me`):**
   - Clarify mission, primary user workflows, tech stack, auth/privacy/billing boundaries, hosting/cost limits, and visual direction (or brand assets).
2. **Product Constitution (`AGENTS.md`):**
   - Run `node .slices/agybot.mjs scaffold-constitution --mission "..." --stack "..." --rules "..."`.
   - This writes human/project Product Constitution **above** `<!-- AGYBOT_BOOTSTRAP:START -->` so future global governor updates never touch product rules.
3. **Lightweight Canonical Spec & Roadmap (`docs/`):**
   - Author concise living documents before coding:
     - `docs/SPEC.md` — concise user stories, `REQ-*` IDs, and concrete acceptance criteria.
     - `docs/ARCHITECTURE_C4.md` — C4 Context -> Containers -> Components -> Data/State contracts.
     - `docs/ROADMAP.md` — ordered milestone backlog & delivery ledger.
   - Register the primary spec as a `LIVING` canonical source:
     ```powershell
     node .slices/agybot.mjs source-register --id SPEC-PRIMARY --ref docs/SPEC.md --persistence LIVING
     ```
4. **Lock Design Taste & Anti-Pill Defaults Before UI (`design-taste-init`):**
   - Run `node .slices/agybot.mjs design-taste-init`.
   - Fill approved color tokens, spacing scale, typography, component reuse rules (`REUSE -> VARIANT -> EXTEND -> NEW`), and verify **Anti-Pill guardrails** (`U1`, `U9`, `U26`, `U26_DENSITY`) in `.slices/DESIGN_TASTE.md`.
5. **Automatic Ledger Upkeep:**
   - `dispatch` opens TODO items automatically; verified `handoff-verify` (or explicit `agybot record`) closes TODOs, prepends structured dated entries to `CHANGELOG.md`, and logs non-slice work into `MASTER_SLICE_CHECKLIST.md`.

---

## 2. Brownfield Workflow ("Projeto Existente")

When `lifecycle-probe` reports `mode: "BROWNFIELD"`:

1. **Read-Only First & Zero Unsolicited Restyling:**
   - Strictly enforce **`UNMENTIONED_UI_IS_FROZEN`**: never refactor unrelated pages, rewrite stack conventions, or strip working UX unless explicitly scoped.
   - Run baseline diagnostics first:
     ```powershell
     node .slices/agybot.mjs doctor
     node .slices/agybot.mjs q -- <project-test-or-typecheck-cmd>
     ```
2. **Capture Existing Rules into `AGENTS.md`:**
   - If `constitutionPresent: false`, inspect existing `README.md`, `package.json`, CI scripts, and architecture to scaffold a factual Constitution above `AGYBOT_BOOTSTRAP` via `scaffold-constitution` (only adding `--force` if regenerating an empty template).
3. **Preserve Existing Design Tokens (`design-taste-init`):**
   - Inspect existing CSS variables, Tailwind config, layout wrappers, and component libraries first.
   - Run `node .slices/agybot.mjs design-taste-init`, record existing palette/components under `## Tokens & Component Reuse`, and list any intentional brand badges or waived lint rules under `## Keep` / `## Off` so `design-lint.mjs` respects the existing UI language.
4. **Adopt Existing Docs Without Duplication:**
   - During onboarding (`setup`), keep `PROJECT_OWN_DOCS` when `ROADMAP.md` / `TODO.md` / `CHANGELOG.md` already exist, and bind existing specs via `source-register --persistence LIVING`.

---

## 3. Continuous Rule Promotion (`promote-rule`)

When the owner establishes a lasting engineering rule or corrects UI/architecture behavior in chat, persist it immediately in the proper layer instead of leaving it only in conversation history:

| Feedback Kind | Destination | Command |
|---|---|---|
| Architecture, domain boundary, auth, test or workflow rule | `AGENTS.md` (above `AGYBOT_BOOTSTRAP`) | `node .slices/agybot.mjs promote-rule --target agents --rule "..."` |
| Visual taste ban, spacing rule, approved badge/exception | `.slices/DESIGN_TASTE.md` (`## Bans`, `## Keep`, `## Off`) | `node .slices/agybot.mjs promote-rule --target taste --section Bans --rule "..."` |
| Operational tooling/command/test loop discovery | `.slices/AUTO_LEARNINGS.json` + `.agy-vault/learnings/` | `node .slices/agybot.mjs promote-rule --target learned --rule "..."` |

**Priority order at runtime (lowest wins only when higher layers are silent):**
`AGENTS.md` Constitution + Canonical Spec > `.slices/DESIGN_TASTE.md` (`## Keep` > `## Bans` / `## Off`) > Global Governor defaults & `design-lint.mjs`.
