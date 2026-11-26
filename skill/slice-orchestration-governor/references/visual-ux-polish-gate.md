# Visual UX Polish, Anti-Pill & Anti-Slop Gate — `AGY_UX_V2` (`design-lint`)

Functional Playwright evidence proves behavior. It does **not** prove that the interface is visually polished, free of AI-generated clutter (such as repetitive status/eyebrow pill badges), or faithful to the project's Design System.

## Precedence (Inviolable)

```text
1. Canonical project constitution, UI specs & brand guidelines (`AGENTS.md` above `AGYBOT_BOOTSTRAP`, design docs/assets)
2. Existing equivalent approved project surface / primitive (`REUSE -> VARIANT -> EXTEND -> NEW`)
3. Project Design System tokens + Project Design Taste File (`.slices/DESIGN_TASTE.md`)
4. AGY_UX_V2 / design-lint heuristics (including Anti-Pill rules U1, U9, U26, U26_DENSITY)
```

In `HUMAN_MANUAL` projects (e.g., strict owner-gated products), automation and `design-lint` improve first-pass quality before human review, **never** replacing manual Product Owner visual acceptance (`VISUAL_PASS`). Also respect `UNMENTIONED_UI_IS_FROZEN`: never restyle untouched screens without explicit scope.

---

## 1. Execution Flow (Web / Mixed UI Slices)

1. **Static Lint (`BUILDER` pre-handoff):** Run `node scripts/design-lint.mjs --changed` (add `--surface` only when visual surface cleanup is authorized).
2. **Runtime & DOM Evidence (`QA`):** Render real states (desktop + mobile/narrow viewports, with menus/dialogs open when applicable) and capture DOM/visual artifacts without fake CSS/layout mutations.
3. **Qualitative + Anti-Slop Audit (`AUDITOR`):** Inspect rendered artifacts + DOM/code, fill `visual-ux-audit-template.json` (`rubricVersion: "AGY_UX_V2"`), record Verdict (`HEAVY | LIGHT | NONE`), and emit via `agybot visual-ux-audit`.

---

## 2. Core UX Rubric + Anti-Slop & Anti-Pill Rules (`U1`–`U26`)

### A. Layout, Hierarchy & Ergonomics (Core AGY_UX)
- `textWrapping`: no accidental wrapping/truncation in badges, buttons, headings, or controls.
- `clippingOverflow`: no clipped, overlapping, off-canvas, or z-index defects.
- `visualHierarchy`: clear title/action priority, density, scanability; report equal-loud KPI rows (`U23`, report-only — suggest hierarchy without unsolicited layout edits).
- `spacingAlignment`: consistent rhythm, gaps, alignment (`U25` — text line, box line, icon column, trailing line, centered toolbar bars). Fix alignment **in container padding/tokens**, never one-off margins like `ml-[3px]`.
- `affordanceErgonomics`: actionable controls, proper touch targets, localized user-facing enum labels (never raw `OPEN`/`WON`/`LOST` unless technical spec).
- `designSystemConsistency`: reuse approved project primitives/tokens/patterns first.
- `responsiveBehavior`: intentional layout at desktop and mobile viewports.
- `contrastAccessibility`: readable contrast and intact accessibility (`aria-label`, `alt`, `sr-only`, visible `<label for>`).

### B. Interface Copy & Anti-Botsplaining (`U1`–`U8`, `U21`–`U22`)
- **U1 (Eyebrow labels):** delete tiny uppercase/letter-spaced labels above headings (`FEATURES`, `RECURSOS`, decorative chips) when the heading already names the section.
- **U2 (Decorative numbering):** strip ornamental `01 //`, `§`, `01 02 03` unless real sequential steps exist (checkout/install steps).
- **U3 (Subtitle reflex):** delete redundant subtitles or generic reassurance lines under CTAs unless stating a concrete, unsaid fact.
- **U4 (Botsplaining):** delete captions narrating obvious actions (*"Click below to..."*). Keep empty states/errors/destructive confirmations to 1–2 plain factual sentences (what happened + next step from code; no `"Oops!"` or exclamation hype).
- **U5 (Leaked design notes):** remove implementation meta-copy like `(updates in real time)` or `(powered by AI)`.
- **U6 (Status chains):** avoid bloated `·` / `|` chains; keep actionable facts and verify any live claim against real state.
- **U7 (Redundant form cues):** keep visible `<label>`; remove placeholders/helper text that repeat the label (format examples like `nome@empresa.com` and real constraints like `Mínimo 12 caracteres` stay).
- **U8 (Staccato slogans):** replace empty slogans with plain description using existing product terms, or delete.
- **Length limit (`length`):** app section headings, card titles, and short captions stay concise (<= 5 words where appropriate; hero/errors/constraints excluded).
- **U21 / U22 (Links & buttons):** remove decorative `→` glyphs after button/link text (`↗` external, icon-only `aria-label`, and breadcrumbs stay); replace generic `"Click here"` / `"Learn more"` / `"Submit"` with the actual destination/action from code.
- **Clean Prose:** cut AI filler words (*seamless*, *elevate*, *potencializar*, *sem costura*), excessive em dashes, passive descriptions, and unnecessary adverbs.

### C. Decoration vs. Real State (`U6`, `U9`, `U10`, `U11`, `U24`, `U26`)
- **Real-state test:** `LIVE`/`NEW`/`AI`/`PRO`/`FREE`/`BETA` pills (`U9`) and pulsing/colored status dots (`U10`, `animate-pulse`) stay **only** if backed by live data/props (`{isLive && ...}`, query state). Fixed markup is fake decoration and must be removed.
- **U26 & `U26_DENSITY` (Anti-Pill Guardrail):** Non-interactive decorative `rounded-full` pill tags/chips (`<span>`/`<div>` badges scattered across sections or cards) are blocked, and `>= 3` pill elements per file triggers `U26_DENSITY`. Real interactive `<button>`, `<a>`, `[role="tab"]`, avatars, and spinner icons are automatically exempt, and intentional brand pills can be exempted under `## Keep` / `## Off` in `.slices/DESIGN_TASTE.md`.
- **U11 (Decorative emojis/icon tiles):** remove decorative emojis and tinted icon boxes in headings/lists unless functional action icons.
- **U24 (Edge accent stripes):** remove non-semantic colored edge bars (`border-l-4`, `border-t-[3px]`, `shadow-[inset_4px_0_0_...]`) unless encoding real error/alert state (`role="alert"`) or approved product status semantics.

### D. Charts & Dashboards (`U12`–`U16`, `U23`)
- **U12:** remove chart-type prefix from titles (*"Bar chart of monthly revenue"* -> *"Monthly revenue"*).
- **U13:** remove obvious reading instructions (*"Hover for details"*).
- **U14:** encode each metric once (no redundant bar + printed value + gridline + derived percent + progress bar restating the same number); KPI cards hold label, value, and at most 1 context line.
- **U15:** strip heavy plot borders, 3D/glows, and dense gridlines (hairline neutral gray only when needed) without redesigning chart type/data.
- **U16:** prefer direct series labels for <= 4 readable series instead of a detached legend box.

### E. Opt-In Surface Rules (`--surface` flag or explicit visual cleanup authorization: `U17`–`U20`, `U25`)
Always subordinate to the project's canonical Design System tokens:
- **U17:** replace decorative hue-to-hue gradients, `bg-clip-text`, and colored glows with clean neutral surfaces/tokens.
- **U18:** snap off-scale spacing (`mt-[13px]`, `gap-[7px]`) to project spacing tokens / 4px grid.
- **U19:** replace extra-heavy weights (`font-black`/`font-extrabold`, `800`/`900`) with 500/600 unless canonical.
- **U20:** replace `transition-all`, `animate-bounce`, scroll-triggered reveals (`whileInView`), and count-up-from-zero counters with targeted transitions (150ms ease-out).

---

## 3. Guardrails (Anti-Churn & Anti-Fabrication)

1. **Verdict `NONE` is a valid PASS:** never invent cosmetic edits on a clean screen just to produce a diff.
2. **Rewrite only from verified code:** never invent customer counts, speeds, uptime claims, or unverified benefits. Unverified marketing/data claims become owner `Tasks`, never silent rewrites or deletions.
3. **Never weaken accessibility or delete interactive controls:** keep `href`/handlers, `<label>`, `aria-label`, `alt`, and `sr-only`.
4. **Screenshot existence != review:** pixel diffs catch regressions; qualitative audit requires inspecting rendered artifacts + DOM.

Two consecutive failed visual UX audits escalate to implementation review, then Coordinator/human review per project policy.
