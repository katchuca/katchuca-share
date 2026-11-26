# Example — Non-UI API slice (v3.3)

**Slice:** `billing-02_create-invoice-api`

**Acceptance:** authenticated request to real local API creates exactly one invoice with canonical total and response contract.

Planning requires canonical creation authority:

```text
creationAuthority = OWNER_EXPLICIT or PREAPPROVED_PLAN
```

Expected proof:

- real server + disposable/approved DB with representative, explicitly proven fixture data;
- `dataSafety.environment=DISPOSABLE` preferred for lifecycle/destructive tests;
- final source snapshot before final evidence/checks;
- actual HTTP request/response and persisted DB state;
- sanitized JSON evidence bound to source fingerprint;
- DOM `N/A_BY_DESIGN` with concrete reason;
- change manifest reviewed;
- natural lint/typecheck/test completion;
- every intermediate failure classified/reconciled, even if final result is green;
- progressive notes recorded immediately with authority provenance;
- reusable project-wide learning considered through the actual `/GRILL-ME` gate;
- applied promoted wording must not expand the owner-approved rule;
- closure obeys configured commit policy.

## V3.3 additions

Before verification:

```text
mutationSafety = REQUIRED or N_A_BY_DESIGN
change provenance = CURRENT_SLICE|PRE_EXISTING|CONCURRENT|MIXED|UNKNOWN
scope disposition = IN_SCOPE or explicitly authorized exception
claim ledger = no contradictory closure claims
```

For high-risk API work, declare `--risk HIGH|CRITICAL --risk-reason ...`; the default policy adds independent engineering review.
