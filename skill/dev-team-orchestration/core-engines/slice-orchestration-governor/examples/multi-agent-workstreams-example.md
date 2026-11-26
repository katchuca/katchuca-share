# Example — Three agents in parallel workstreams (v3.3)

```text
billing-01_checkout -> billing-02_provider --------┐
onboarding-01_state -> onboarding-02_tour --------+--> integration-01_release
admin-01_business360 -> admin-02_benefits --------┘
```

All canonical slices were either `OWNER_EXPLICIT` or `PREAPPROVED_PLAN`; implementation agents did not invent the numbering/boundaries.

Possible write scopes do not overlap, but semantic scopes are also declared:

```text
billing-02:
  writeScopes: src/billing/**
  decisionScopes: commercial-entitlements (MUTATE)

onboarding-02:
  writeScopes: src/onboarding/**
  decisionScopes: onboarding-state-machine (MUTATE)

admin-02:
  writeScopes: src/admin/**
  decisionScopes: admin-business-view (MUTATE), commercial-entitlements (READ)
```

A fourth active slice attempting to MUTATE `commercial-entitlements` is blocked even if it writes different files.

Separately, all governor commands share `.slices/.governor.lock`. Two OS processes may create/update different slices concurrently, but their MASTER/gate mutations are serialized and atomically replaced so one process cannot overwrite another process's governance update.

If a later integration change alters source fingerprinted by an earlier PASS, stale detection marks the earlier slice `STALE_NEEDS_REVERIFY`; historical PASS remains in audit history but cannot satisfy release seal until replayed.

## Deferred carry-forward example

If Product Owner accepts a tiny Inbox spacing issue as non-blocking:

```text
origin slice:
  D001
  touchScopes: inbox/conversation-header
  severity: NON_BLOCKING
  carryPolicy: MANDATORY_ON_NEXT_TOUCH
  authority: PRODUCT_OWNER_EXPLICIT
```

A later slice touching `inbox/conversation-header` inherits D001 automatically and must resolve it before verification. No artificial standalone micro-slice is required.
