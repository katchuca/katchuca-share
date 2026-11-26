# Progressive Memory & Rule Promotion — v6.1

Record material decisions, implementation learnings, corrected assumptions, exceptions and future-spec implications progressively during the task, not only at the final report.

## v6.1 promotion policy
Reusable does **not** automatically mean “ask the human”. The Coordinator first evaluates materiality and authority.

### Autonomous canonicalization is allowed when all are true
- the learning is technical/non-material;
- it does not change product semantics, user promises, commercial/entitlement policy, privacy/legal behavior, destructive authority, or approved scope;
- evidence is concrete and provenance is recorded;
- the rule is consistent with existing project authority.

### Human decision is required when
- product purpose/behavior would change materially;
- scope/workstream expands;
- canonical sources conflict without precedence;
- commercial/privacy/legal/irreversible authority is implicated;
- the configured project policy is stricter.

The Coordinator is the only role that invokes real `/GRILL-ME`. Specialists emit a decision/promotion candidate to the Coordinator instead of asking the human directly.

Default `grillMePolicy = MATERIAL_ONLY`; projects may choose BALANCED or STRICT.
