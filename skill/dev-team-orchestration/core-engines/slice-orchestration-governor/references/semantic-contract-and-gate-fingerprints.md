# Semantic contract fingerprints and selective re-verification

Source freshness alone is insufficient. A product decision can change while the code is untouched, making old evidence semantically stale.

## Contract state

Every slice carries `contractState` with a monotonically increasing revision, structured clauses, and a deterministic SHA-256 fingerprint. Acceptance criteria and the real scenario seed the initial contract. Material owner/spec changes are recorded with `contract` and invalidate evidence/checks bound to the previous contract fingerprint.

```text
source unchanged + contract changed = evidence can still be stale
```

Use authoritative provenance. Agent discovery may propose a clause but cannot silently become product truth.

## Per-gate input fingerprints

Each PASS check records the exact input scopes it proves, their fingerprint, and the contract fingerprint. This supports `AFFECTED_ONLY` corrective work: a check may be reused only when its own inputs and the semantic contract remain current.

A global source snapshot still protects final evidence. Per-gate fingerprints reduce ritual reruns; they do not weaken final truth.

## Recommended sequence

1. record material contract changes immediately;
2. snapshot source after material source edits;
3. run `check` with explicit input scopes;
4. bind evidence to both source and contract fingerprints;
5. re-run only gates whose inputs or contract changed under `AFFECTED_ONLY`;
6. use full applicable gates for normal implementation slices.
