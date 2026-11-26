# Second Brain Vault Architecture — v5.0

## The Convergence of Knowledge & Execution

The v5.0 governor integrates Andrej Karpathy's LLM Wiki pattern with atomic slice engineering, turning project knowledge into an immutable, verifiable Second Brain.

---

## 🏛️ Vault Topography

```text
vault/ (or .slices/brain/)
├── _master-index.md          # Global entry point: one line per project/domain
├── _log.md                   # Append-only chronological event ledger
├── user/                     # Persistent Owner facts, preferences, and ground rules
├── raw/                      # Immutable source documents (papers, transcripts, API specs)
├── wiki/                     # Compiled knowledge with citations and domain indexes
│   ├── _master-index.md      # Wiki domain index
│   └── <Domain>/<slug>.md    # Distilled articles with cited sources
└── projects/<slug>/          # Isolated initiative workspaces
    ├── README.md             # Project card (max 30 lines)
    └── context/
        ├── memory.md         # ## State (max 20 lines) + ## Decisions (newest first)
        ├── todo.md           # ## Open + ## Closed tasks
        └── lessons.md        # What worked and what failed (continuous feedback)
```

---

## 📥 The `raw/` and `wiki/` Ingestion Cycle (Karpathy Pattern)

1. **Immutable Ingestion (`raw/`)**:
   - Any external source (PDF, technical spec, architecture document, meeting transcript) is saved to `raw/YYYY-MM-DD-topic.<ext>`.
   - **Prime Rule**: Files in `raw/` are **never edited and never deleted**.

2. **Structured Compilation (`wiki/`)**:
   - The `compile` command digests raw sources into modular articles under `wiki/<Domain>/<topic>.md`.
   - Frontmatter specifies: `Source: [[raw/...]]`, `Writer: <agent>`, `Date: YYYY-MM-DD`.
   - Every factual claim cites its exact source.
   - Contradictions are preserved with `> [!warning] Superseded` rather than overwritten.
   - Every wiki article ends with `## Key Takeaways` (3–7 bullets).

3. **Deterministic Retrieval Without Vector Hallucination**:
   - Agents never dump the whole wiki into context.
   - An agent starts at `_master-index.md`, reads only the specific linked articles needed for the current slice, and passes paths to teammates.
