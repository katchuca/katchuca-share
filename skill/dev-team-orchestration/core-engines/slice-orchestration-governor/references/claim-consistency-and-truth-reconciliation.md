# Claim Consistency and Truth Reconciliation — v3.3

A final report can sound authoritative while contradicting its own evidence. Closure-critical facts therefore belong in structured claims.

## Claim ledger

Use canonical keys for assertions that matter to closure, for example:

- `DATABASE_MUTATED`
- `BEHAVIOR_CHANGED`
- `SCOPE_EXPANSION_OCCURRED`
- `ROOT_CAUSE`
- `TEST_TOTAL`
- `ACTIVE_INCIDENT_COUNT`

Each claim stores a value and supporting source/reference. The verifier rejects different values for the same key.

Narrative prose explains structured truth; it does not override it.

## Reconciliation ladder

When observed truth differs by layer:

```text
source/domain owner
-> direct resolver/read-model
-> transport/API
-> client state/cache
-> rendered UI/report
```

Compare the same concept at each layer and identify the first mismatch.

## Preserve distinct dimensions

If two concepts can legitimately diverge, model and label them separately. Generic examples include:

- configured state vs effective state;
- liveness vs readiness vs outcome;
- contracted state vs granted override vs effective access;
- historical failures vs current unresolved failures;
- raw events vs grouped presentation.

Do not make one field silently stand for several different truths.
