# Deferred Non-Blocking Carry-Forward — v3.3

## Purpose

Avoid both failure modes:

1. creating a standalone micro-slice for every tiny visual polish item;
2. verbally deferring an item and losing it forever.

## Model

A slice may record:

```text
severity = NON_BLOCKING
carryPolicy = MANDATORY_ON_NEXT_TOUCH
touchScopes = inbox/header
```

The current slice may still close if the Product Owner accepts the deferral.

When a later slice is created with overlapping `writeScopes`, the note is automatically inherited. That later slice cannot verify until the inherited mandatory carry-forward is resolved.

## Commands

Create:

```bash
slice-governor defer --slice <id> \
  --note "Tighten spacing between name and handling status" \
  --touch-scope "inbox/conversation-header" \
  --severity NON_BLOCKING \
  --carry-policy MANDATORY_ON_NEXT_TOUCH
```

Resolve from the touching slice:

```bash
slice-governor defer --slice <current> \
  --resolve <originSlice:D001> \
  --note "Implemented with existing header spacing primitive"
```

## Do not use for

- unresolved correctness defects;
- security defects;
- failed acceptance criteria;
- blocking product decisions.

Those remain blockers, not deferred polish.
