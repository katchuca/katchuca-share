# Engineering Vault & Canonical Requirements — v6.2

The Vault and MASTER are projections, never replacements for product truth.

`CANONICAL PRODUCT SOURCE -> REQUIREMENTS PROJECTION -> MASTER -> SLICE/TASK EXECUTION`

## States
Execution-ready: `OPEN`, `READY`, `ACTIVE`.

Not execution-ready: `INPUT_REQUIRED`, `REVIEW_REQUIRED`, `BLOCKED`.

Terminal statuses include `CLOSED`, `DEFERRED_BY_OWNER`, `MOVED_BY_OWNER`, `CANCELLED_BY_OWNER`. Structured dispositions include `SATISFIED`, `ACCEPTED_CURRENT_BEHAVIOR`, `DEFERRED_TO_TRIGGER`.

## Execution lineage
Requirements keep `executionRefs[]`; a single canonical requirement may own a primary slice, DC1, DC2 and refinements without overwriting history. `closureEvidenceRefs[]` proves requirement closure. **Slice PASS != requirement CLOSED.**

## Canonical-source freshness
Locally fingerprintable sources retain the source fingerprint present when projected. Registered canonical sources track current fingerprint, last projected fingerprint, reconciliation time and coverage attestation. Drift emits `CANONICAL_SOURCE_PROJECTION_STALE`.

## Decision propagation
A human-required material decision puts affected requirements in `INPUT_REQUIRED`. Resolution by real product authority increments requirement revision, moves nonterminal requirements to `REVIEW_REQUIRED`, updates affected semantic contracts and invalidates old evidence/approvals through fingerprint drift.

## MASTER projection
The compact Canonical Requirements Index stores requirement id, revision, title, workstream, status, disposition, execution lineage and source reference. Full product text stays in the canonical source.

## Closure
A workstream cannot close with blocking nonterminal requirements, tasks, human decisions, non-PASS slices, open findings/transfers/blockers, or stale canonical-source projection.
