# v6.2 Semantic Closure Hardening

## 1. Final-diff class escalation
Initial class is provisional. Before verify, the Governor scans the final slice-owned diff and relevant symbols. Sensitive billing/payment/subscription/entitlement/allocation, auth, RLS, crypto, privacy/retention or destructive-lifecycle semantics promote the slice to Class C. Large structural changes may promote to Class D. Class C/D requires independent engineering review. File naming cannot suppress escalation.

## 2. Fingerprint-bound approvals
Every approval records a fingerprint over final source, semantic contract, canonical requirement revision, evidence digest, check digest and visual artifact digest when applicable. Drift makes the approval stale.

## 3. Requirement execution lineage
A canonical requirement owns `executionRefs[]` and `closureEvidenceRefs[]`. One requirement may have implementation slice, DC1, DC2 and later refinements. Slice PASS does not close the requirement.

## 4. Product-input states
`INPUT_REQUIRED` means material product authority is missing. `REVIEW_REQUIRED` means an authoritative decision changed the requirement/contract and execution must be reviewed/reverified. Neither state is execution-ready.

## 5. Decision propagation
A material decision records affected requirements, slices and contract keys. A real PRODUCT_OWNER_EXPLICIT resolution requires actual human presentation. Resolving bumps requirement revision, updates affected semantic contracts and invalidates prior evidence/approvals through fingerprint drift.

## 6. Canonical-source freshness
Locally fingerprintable canonical sources keep source and last-projected fingerprints. If the source changes after projection, reconciliation emits `CANONICAL_SOURCE_PROJECTION_STALE`. Workstream closure is blocked until refreshed projection is attested.

## 7. Decision-scope authority
Sensitive `decisionMode=MUTATE` scopes require `PRODUCT_OWNER_EXPLICIT` or `EXISTING_PROJECT_SPEC` plus authority reference. Discovery is evidence, not product authority.

## 8. Accepted current behavior / future trigger
Intentional current limitations may be disposed as `ACCEPTED_CURRENT_BEHAVIOR` or `DEFERRED_TO_TRIGGER` with `activationTrigger` and `blocksCurrentWorkstream=false`.

## 9. Protected environment resources
Pre-existing user runtimes, persistent Docker resources, local services and external providers are protected resources. STOP/RESTART/MUTATE/DELETE requires explicit authority; restoration must be recorded where applicable.

## 10. Workstream closure
Closure fails on blocking canonical requirements, nonterminal tasks, unresolved human decisions, non-PASS slices, open human findings, unresolved gate transfers, mandatory blockers or stale canonical-source projection.

## 11. Closure digest
The closure manifest binds source fingerprint, contract fingerprint, requirement id/revision, required approvals, evidence artifacts and check fingerprints.
