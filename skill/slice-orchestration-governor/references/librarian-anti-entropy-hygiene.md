# Librarian Anti-Entropy & Hygiene Protocol — v5.0

## The Anti-Entropy Invariant

Unattended agent vaults inevitably degrade into context bloat, orphaned notes, and broken links. The **Librarian Engine** in v5.0 audits and prunes project knowledge deterministically.

---

## 🗂️ Strict File & Content Limits

| Document Type | Hard Limit | Enforcement Action |
|---|---|---|
| Project `README.md` | $\le$ 30 lines | Flagged during `audit` if exceeded. |
| `context/memory.md` (`## State`) | $\le$ 20 lines | Rewritten present state; older narratives pruned. |
| `memory.md`, `todo.md`, `lessons.md` | $\le$ 200 lines | Prompt archival to `context/<file>-archive-YYYY.md`. |
| Master `SKILL.md` Router | $\le$ 150 lines | Heavy theory delegated to `references/`. |

---

## 🔍 The `audit` Command Checklist

When `node scripts/slice-governor.mjs audit` is executed:

1. **Broken Wikilinks Check**:
   - Parses all markdown files for `[[target]]` links and verifies destination files exist on disk.
2. **Orphan Notes Detection**:
   - Finds any `.md` file under `wiki/` or `projects/` that is not referenced by `_master-index.md` or a parent note.
3. **Uncompiled Raw Sources**:
   - Detects files in `raw/` that have not yet been cited in any `wiki/` document.
4. **Line-Count & Archival Sweep**:
   - Flags files exceeding size thresholds and generates recommended archive splits.
5. **Drift & Scope Sweep**:
   - Compares declared `writeScopes` in active fatias against actual modified files.
6. **Audit Report Output**:
   - Generates structured report at `.slices/audit-report.json` and `projects/operations/outputs/YYYY-MM-DD-audit.md`.
