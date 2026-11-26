# Slice Report — `{{SLICE_ID}}`

## Identity & coordination

- **Slice:** `{{SLICE_ID}}`
- **Workstream:** `{{WORKSTREAM}}`
- **Sequence in workstream:** `{{SEQUENCE}}`
- **Title:** `{{TITLE}}`
- **Slice kind:** `{{SLICE_KIND}}`
- **Parent slice:** `{{PARENT_SLICE}}`
- **Creation authority:** `{{CREATION_AUTHORITY}}`
- **Risk:** `PENDING`
- **Risk reason:** `PENDING`
- **Surface:** `{{SURFACE}}`
- **Status:** `{{STATUS}}`
- **Depends on:** `{{DEPENDS_ON}}`
- **Write scopes:** `{{WRITE_SCOPES}}`
- **Decision scopes:** `{{DECISION_SCOPES}}`
- **Decision mode:** `{{DECISION_MODE}}`
- **Acceptance criterion:** {{ACCEPTANCE_CRITERION}}
- **Real user/consumer scenario:** {{REAL_SCENARIO}}
- **Required approvals:** `{{REQUIRED_APPROVALS}}`
- **Created by:** {{CREATED_SIGNATURE}}
- **Claimed by:** `PENDING`
- **Completion signature:** `PENDING`
- **Base branch:** `{{BASE_BRANCH}}`
- **Delivery branch:** `{{DELIVERY_BRANCH}}`
- **Work branch:** `PENDING`
- **HEAD at claim:** `PENDING`
- **Final commit:** `PENDING`
- **Closure fingerprint:** `PENDING`

## 1. Decomposition gate

- **Single observable outcome:** `PENDING`
- **Independently acceptable/reversible parts discovered:** `PENDING`
- **Split required:** `PENDING`

## 2. Surface / data-safety / mutation-safety discovery

- **Surface discovery decision:** `PENDING`
- **Existing/preapproved owner:** `PENDING`
- **Discovery evidence:** `PENDING`
- **Data environment:** `PENDING`
- **Fixture provenance reviewed:** `PENDING`
- **Human data mutation:** `PENDING`
- **Automated mutation-safety audit:** `PENDING`
- **Mutating test/script files detected:** `PENDING`
- **Unguarded mutation paths:** `PENDING`
- **Guard contract:** `PENDING`

## 3. What changed

- `PENDING`

## 4. Change manifest / files changed

| Path | Classification | Provenance | Hunks reviewed? | Touched by slice? | Scope disposition | Behavior changed? | Product fix? | Purpose |
|---|---|---|---:|---:|---|---:|---:|---|
| `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |

## 5. Dependency / ownership / conflict proof

- **All declared dependencies PASS:** `PENDING`
- **Cross-workstream dependency integration proof:** `PENDING`
- **Exclusive owner established:** `PENDING`
- **Write-scope conflict scan:** `PENDING`
- **Decision-scope conflict scan:** `PENDING`
- **Handoffs:** `NONE` unless recorded below
- **Claim-time worktree baseline:** `PENDING`
- **Pre-existing/concurrent/mixed hunks reconciled:** `PENDING`
- **Out-of-scope expansion events:** `PENDING`

## 6. Progressive decisions / learnings

Record discoveries as they happen. Every normative note must name its authority type/reference. Link to MASTER/durable-memory owner notes.

- `PENDING`

Each material note must record `materiality`, durable disposition, and promotion disposition.

### `/GRILL-ME` promotion candidates

- `NONE` unless a reusable learning arose.

### Deferred notes / inherited carry-forward

- `NONE` unless explicitly recorded.

## 7. Claim consistency / diagnostic truth

- **Structured claim ledger reviewed:** `PENDING`
- **Contradictory claims:** `PENDING`
- **READ_ONLY_DIAGNOSTIC applicability:** `PENDING`
- **Diagnostic layers:** `PENDING`
- **Root cause classified:** `PENDING`
- **Recommended next action:** `PENDING`
- **Project files changed by diagnostic:** `PENDING`
- **Database changed by diagnostic:** `PENDING`
- **Process restarted by diagnostic:** `PENDING`

## 8. Source snapshot / freshness

- **Source snapshot applicability:** `PENDING`
- **Source paths:** `PENDING`
- **Snapshot file:** `PENDING`
- **Source fingerprint:** `PENDING`
- **Captured after last material source edit:** `PENDING`
- **Stale:** `PENDING`


## 8A. Semantic contract fingerprint

- **Contract revision:** `PENDING`
- **Contract fingerprint:** `PENDING`
- **Material contract changes since prior evidence:** `PENDING`
- **Evidence/checks invalidated by semantic change:** `PENDING`

## 8B. Gate input fingerprints / selective re-verification

| Gate | Input scopes | Input fingerprint | Contract fingerprint | Reused or rerun |
|---|---|---|---|---|
| lint | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| typecheck | `PENDING` | `PENDING` | `PENDING` | `PENDING` |
| tests | `PENDING` | `PENDING` | `PENDING` | `PENDING` |

## 8C. Mutation outcome / side-effect frontier

- **Mutation-outcome applicability:** `PENDING`
- **Transaction outcome:** `PENDING`
- **Post-COMMIT outcome:** `PENDING`
- **Response outcome:** `PENDING`
- **Persistence reconciled:** `PENDING`
- **Retry/idempotency:** `PENDING`
- **Side-effect frontier phases:** `PENDING`
- **Preconditions before business effects:** `PENDING`
- **Rejected paths prove zero business effects:** `PENDING`

## 8D. Failure frontier / external blockers

- **Authorized reconciliation scopes:** `PENDING`
- **All discovered failures in authorized scope classified:** `PENDING`
- **Real regressions unresolved:** `PENDING`
- **External nonblocking issues with independence proof:** `PENDING`

## 8E. Human findings / reference fidelity / pipeline truth

- **Open human findings:** `PENDING`
- **Reference mode:** `PENDING`
- **Canonical reference invariants:** `PENDING`
- **Pipeline claims:** `PENDING`
- **Formal gate transfers:** `PENDING`

## 9. Real scenario and runtime proof

- **Runtime/process/harness:** `PENDING`
- **URL/port/command when applicable:** `PENDING`
- **Representative populated data used:** `PENDING`
- **Steps executed:** `PENDING`
- **Observed result:** `PENDING`

## 10. Focused functional proof

- **Target behavior:** `PENDING`
- **Proof method:** `PENDING`
- **Result:** `PENDING`

### Browser DOM/actionability subgate (web-ui/mixed only)

- **DOM applicability:** `PENDING`
- **Rendered:** `PENDING`
- **Visible:** `PENDING`
- **Interactive:** `PENDING`
- **Real user actionability:** `PENDING`
- **Normal pointer clicks:** `PENDING`
- **Forced clicks:** `PENDING`
- **DOM-dispatched clicks used as proof:** `PENDING`
- **Test layout mutations:** `PENDING`
- **Screenshot from unmodified composition:** `PENDING`
- **console.error count:** `PENDING`
- **pageerror count:** `PENDING`
- **Actual production surface used:** `PENDING`
- **Production route/surface:** `PENDING`
- **Synthetic fixture used:** `PENDING` (supplemental only)

## 11. Evidence & provenance

All evidence must be real and stored under `./evidence/`. Every entry must have SHA-256 and bind to the source fingerprint that produced it.

| File | Provenance model | SHA-256 | Source fingerprint | Method | What it proves |
|---|---|---|---|---|---|
| `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` | `PENDING` |

## 12. Lint / typecheck / tests

For PASS checks record command, start/end, natural completion, exit code, and exact count/summary.

### Lint / static checks
- **Status:** `PENDING`
- **Command:** `PENDING`
- **Natural exit:** `PENDING`
- **Exit code:** `PENDING`
- **Count:** `PENDING`

### Typecheck / compile checks
- **Status:** `PENDING`
- **Command:** `PENDING`
- **Natural exit:** `PENDING`
- **Exit code:** `PENDING`
- **Count:** `PENDING`

### Automated tests
- **Status:** `PENDING`
- **Command:** `PENDING`
- **Natural exit:** `PENDING`
- **Exit code:** `PENDING`
- **Exact count:** `PENDING`

## 13. Runtime cleanliness

- **Unexpected browser console errors:** `PENDING`
- **Uncaught page/runtime exceptions:** `PENDING`
- **Unexpected process/server errors attributable to scenario:** `PENDING`
- **Result:** `PENDING`

## 14. Score audit (0-100)

- **Starting score:** `100/100`
- **Final audited score:** `PENDING/100`
- **Gate verdict:** `PENDING`

### Every deduction
- `PENDING`

### Everything NOT tested
- `PENDING`

### Mandatory blockers
- `PENDING`

## 15. Circuit breaker / historical failure reconciliation

- **TOTAL_FAILURES_OCCURRED:** `0`
- **UNRESOLVED_FAILURES:** `0`
- **Circuit breaker triggered:** `NO`
- **Repair independently verified:** `N/A`
- **Incidents:** `NONE`
- **Intermediate failures reconciled:** `PENDING`
- **Known final failures:** `PENDING`

## 16. Approval authority

- **Automated engineering:** `PENDING`
- **Independent engineering review:** `NOT_REQUIRED` or `PENDING/APPROVED/REJECTED`
- **Human Product:** `NOT_REQUIRED` or `PENDING/APPROVED/REJECTED`
- **Security/other:** `NOT_REQUIRED` or status

## 17. Handoff log

| Timestamp | From | To | State | Note / Exact next action |
|---|---|---|---|---|
| — | — | — | — | No handoff yet |

## 18. Git / closure

- **Commit policy:** `{{COMMIT_POLICY}}`
- **Worktree before slice:** `PENDING`
- **Unrelated pre-existing changes preserved:** `PENDING`
- **Checkpoint commits:** `NONE`
- **Final atomic commit:** `PENDING`
- **Closure fingerprint:** `PENDING`
- **Final status:** `PENDING`
- **Completion signature:** `PENDING`
- **Dependents may become READY:** `NO` until closure authority is satisfied.
