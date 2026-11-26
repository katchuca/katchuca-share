# Post-COMMIT reconciliation and side-effect frontier

A returned HTTP/process error does not prove that a mutation rolled back. Transaction outcome, post-commit work, response serialization, and client-visible semantics are separate stages.

## Mutation pipeline

Model critical mutations as:

```text
PRECONDITIONS -> TRANSACTION -> COMMIT/ROLLBACK -> POST_COMMIT -> RESPONSE
```

If COMMIT occurred, reconcile persisted state before describing the mutation as failed. A post-commit response error must not be allowed to manufacture a false rollback narrative.

Final closure for a committed mutation requires:

- persisted state reconciled;
- post-commit path green;
- semantic response success;
- retry/idempotency proven, because a client may retry after an ambiguous transport/response failure.

Use `mutation-outcome` to record this truth.

## Side-effect frontier

For security, billing, admin, destructive, and other sensitive mutations, negative gates should be evaluated before the first business side effect:

```text
AUTH -> CONTEXT -> ELIGIBILITY -> AVAILABILITY -> SIDE-EFFECT FRONTIER -> MUTATION/PROVIDER
```

Rejected paths should prove zero business side effects. Read-only authorization/context queries are not business side effects unless the project defines otherwise.

Use `side-effect-frontier` with ordered phases and evidence.
