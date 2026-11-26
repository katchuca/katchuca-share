# Example — semantic contract change + post-COMMIT mutation reconciliation (v3.3)

This example is intentionally generic.

A slice begins with a mutation contract: an authorized operation persists one record and returns success. During implementation, the Product Owner changes the rule so successful retries must be idempotent and a newly eligible record must be visible immediately.

## 1. Record the semantic change

```bash
node scripts/slice-governor.mjs contract \
  --slice api:1 \
  --key retry.idempotent \
  --value true \
  --authority PRODUCT_OWNER_EXPLICIT \
  --authority-ref OWNER-DECISION-42 \
  --impact "Existing evidence for retry behavior is stale"
```

The contract fingerprint changes even if no source file changed. Evidence/checks bound to the old contract can no longer prove closure.

## 2. Record a check with exact inputs

```bash
node scripts/slice-governor.mjs check \
  --slice api:1 \
  --name tests \
  --status PASS \
  --command "npm test -- mutation" \
  --count "12 passed" \
  --started-at 2026-01-01T10:00:00Z \
  --ended-at 2026-01-01T10:00:10Z \
  --exit-code 0 \
  --natural-exit yes \
  --input-scope "src/api/mutation.ts,tests/mutation.test.ts"
```

## 3. Reconcile the mutation outcome

Suppose an earlier implementation committed successfully but failed while serializing the response. The final repaired scenario is recorded explicitly:

```bash
node scripts/slice-governor.mjs mutation-outcome \
  --slice api:1 \
  --applicability REQUIRED \
  --transaction COMMITTED \
  --post-commit PASS \
  --response SUCCESS \
  --persistence-reconciled yes \
  --retry-idempotency PROVEN \
  --evidence evidence/mutation-proof.json
```

## 4. Prove the side-effect frontier

```bash
node scripts/slice-governor.mjs side-effect-frontier \
  --slice api:1 \
  --applicability REQUIRED \
  --phases "AUTH,ELIGIBILITY,AVAILABILITY,SIDE_EFFECT" \
  --preconditions-before-effects yes \
  --negative-paths-zero-effects yes \
  --evidence evidence/negative-paths.json
```

## 5. Reconcile an entire failing suite

```bash
node scripts/slice-governor.mjs reconcile-suite \
  --slice api:1 \
  --scope "tests/mutation-suite" \
  --item "old-copy-assertion" \
  --classification STALE_TEST \
  --reason "Assertion targets superseded presentation wording" \
  --disposition UPDATED_TEST \
  --evidence "tests/mutation-suite.test.ts"

node scripts/slice-governor.mjs reconcile-suite \
  --slice api:1 \
  --scope "tests/mutation-suite" \
  --review yes
```

If a `REAL_REGRESSION` is discovered instead, stop automatic scope widening and obtain authority before modifying production owners.
