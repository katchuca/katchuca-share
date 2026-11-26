# Human findings and reference fidelity

## Human findings are structured evidence

Human review can discover a concrete defect without invalidating every engineering proof in the slice. Record a finding with:

- surface;
- severity;
- violated contract/invariant;
- affected gates;
- evidence/reference;
- final disposition.

`HIGH` and `BLOCKER` findings must be resolved before verification can close. A human finding should invalidate the gates it names, not unrelated database/privacy/build proofs by default.

Use `human-finding` to create and resolve findings.

## Reference fidelity

A visual/product reference can be either:

- `CANONICAL` — exact invariants are acceptance constraints;
- `INSPIRATIONAL` — style/context guidance, not exact structure;
- `N_A_BY_DESIGN` — no reference contract applies.

For a canonical reference, extract explicit invariants before implementation: position, hierarchy, labels, interaction affordance, component family, or other observable rules. Semantic similarity is insufficient if a canonical invariant is violated.

Use `reference` to record the mode, source reference, invariants, and review.
