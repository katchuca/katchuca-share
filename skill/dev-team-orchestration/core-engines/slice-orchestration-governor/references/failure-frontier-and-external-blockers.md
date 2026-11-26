# Failure frontier and external blocker quarantine

## Reconcile a scope, not one assertion at a time

When a test suite/build surface is explicitly authorized for reconciliation, classify every failure discovered in that scope before declaring the scope reconciled:

- `STALE_TEST` — the assertion is obsolete relative to current authoritative behavior;
- `EXTERNAL_INDEPENDENT` — real or stale failure owned elsewhere and proven independent of the slice outcome;
- `REAL_REGRESSION` — current behavior violates the authoritative contract.

A stale-test finding may be updated within the authorized test scope. An external-independent finding is documented, not chased. A real regression stops automatic widening into production owners unless separately authorized.

Use `reconcile-suite`; mark the entire authorized scope reviewed only after all discovered items are resolved/classified.

## Gate applicability and quarantine

Not every repository failure is a slice failure. Classify discovered blockers by:

- gate level: `SLICE_GATE`, `INTEGRATION_GATE`, `REPOSITORY_GATE`, `FINAL_SEAL_GATE`;
- relation: `IN_SCOPE`, `DEPENDENCY`, `EXTERNAL`;
- blocking status;
- independence proof.

An external issue may be nonblocking only when independence is explicitly proven. Global gate failures must not silently drag a bounded initiative into unrelated owners.

Use `blocker` for this record. Final seal remains the place where project-wide debt that was formally transferred or declared repository-wide must be reconciled.
