# Scoring and Double-Check Gate Rules — v3.3

## PASS formula

A numeric score is considered only after every hard gate passes. Engineering closure requires:

1. score >= configured threshold;
2. acceptance and real-scenario proof;
3. current source fingerprint;
4. evidence integrity/provenance;
5. claim ledger without contradictions;
6. dirty-worktree provenance and change ownership reconciled;
7. every slice-owned change inside declared write scope or explicitly authorized expansion;
8. historical failures reconciled separately from final failures;
9. progressive material memory durably disposed;
10. rule-promotion disposition resolved and actual `/GRILL-ME` decisions complete where applicable;
11. mutation-safety audit resolved;
12. Surface Discovery/data-safety gates resolved;
13. inherited mandatory carry-forward resolved;
14. required independent/human/security approvals resolved;
15. read-only diagnostic invariants satisfied when applicable;
16. commit/closure-fingerprint policy satisfied.

A hard-gate failure cannot be offset by 99/100 or 100/100.

## Independent review

When `independentReviewPolicy=REQUIRED_FOR_HIGH_RISK`, `HIGH` and `CRITICAL` slices require `INDEPENDENT_ENGINEERING_REVIEW`. The reviewer must be a different agent/session from the slice owner. A self-reported PASS is not an independent review.

Risk should be declared at slice creation. Typical reasons for high risk include privileged authorization boundaries, persistent human-data mutation, security-sensitive changes, financial/commercial state, migrations, destructive repair, or cross-workstream shared-state mutation. Projects may define additional categories.

## Worktree and scope gate

A dirty worktree baseline is captured at claim. Each changed path records ownership provenance and hunk review. Slice-owned changes outside `writeScopes` require explicit scope disposition and authority reference. `UNKNOWN` ownership touched by the slice blocks closure.

## Claim consistency

Structured closure claims with the same key must agree. If a detailed evidence record says one thing and the summary says another, the contradiction must be resolved before PASS.

## Read-only diagnostics

`READ_ONLY_DIAGNOSTIC` must have no slice-owned project-file change, database mutation, or process restart. It must classify root cause, record the diagnostic layers inspected, keep implementation unauthorized, and recommend the minimum next action.

## Visual acceptance

- `AUTOMATED_FOCUSED`: focused production-surface automated evidence is the visual gate.
- `HUMAN_MANUAL`: screenshot automation is not required; `HUMAN_PRODUCT` approval owns visual acceptance.
- `HYBRID`: focused automated evidence plus human visual approval.

Automation must never manufacture actionability with forced clicks, DOM-dispatched clicks, CSS/layout mutation, hidden overlays, or synthetic-surface substitution.

## Mutation safety

If automated tests/scripts can mutate persistent state, the slice must record the approved guard contract and prove zero unguarded mutation paths in the audited scope.

## Circuit breaker

Count failures per current slice, not per renamed command. At 3 failed tool operations:

1. stop blind retries;
2. diagnose root cause;
3. repair tool/setup/product;
4. independently verify repair;
5. preserve incident history;
6. resume only after proof.

Final verification requires no unresolved failures and a reconciled distinction between intermediate failures and final known failures.

## Deductions

Start at 100 only after hard gates pass. Deductions are for non-blocking imperfections. Anything material to acceptance, provenance, authority, safety, or correctness is a blocker rather than a deduction.


## v6.2 approval binding
Required approvals are valid only for the exact final approval fingerprint: source + semantic contract + canonical requirement revision + evidence digest + check digest + visual artifact digest when applicable. Drift makes approval stale. Scores cannot compensate.

## Closure manifest
PASS closure records `closureManifestDigest` over source, contract, requirement revision, approvals, evidence and checks.
