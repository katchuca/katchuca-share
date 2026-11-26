# Surface Discovery, Visual Acceptance, and Data Safety — v3.3

## Surface Discovery

Before creating a route/page/tab/modal/sheet/drawer/settings surface or navigation destination:

1. search the current source and authoritative project spec for an existing owner;
2. reuse an existing suitable surface;
3. create a new surface only when preapproved;
4. otherwise block for owner decision.

Valid outcomes:

- `REUSE_EXISTING_SURFACE`
- `NEW_SURFACE_PREAPPROVED`
- `BLOCKED_FOR_OWNER_DECISION`
- `N_A_BY_DESIGN`

Agent inference alone is not authority to create a new product surface.

## Visual acceptance

The project config selects:

- `AUTOMATED_FOCUSED`
- `HUMAN_MANUAL`
- `HYBRID`

Under `HUMAN_MANUAL`, visual PASS belongs to `HUMAN_PRODUCT`; screenshot automation is not required. Under automated/hybrid proof, use the real production surface and do not manufacture actionability.

## Data provenance

A record is not test data merely because its name contains `test`, `demo`, `fake`, or a similar word. Provenance must be objective.

Declare one environment:

- `DISPOSABLE`
- `SANDBOX`
- `HUMAN_DATA_READ_ONLY`
- `HUMAN_DATA_MUTATION_EXPLICITLY_APPROVED`
- `N_A_BY_DESIGN`

Human-data mutation requires explicit approval reference.

## Automated mutation safety

Tests/scripts are separately audited for mutation capability. If a path can mutate persistent state, it must prove the configured fail-closed environment/guard contract before mutation. Verification requires zero unguarded mutating automation in audited scope.

Do not silently patch a concurrent test file to satisfy the audit. Treat it as a blocker or use an explicitly authorized scope-expansion/safety-hardening disposition.
