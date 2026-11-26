# Orchestrator Authority and Reconciliation — v3.3

## Purpose

The principal/orchestrator chat or Product Owner defines product truth and canonical slice boundaries. Downstream agents implement and discover facts, but discovery is not authority.

## Authority types

Every normative note must identify one of:

- `PRODUCT_OWNER_EXPLICIT`
- `EXISTING_PROJECT_SPEC`
- `CURRENT_HEAD_BEHAVIOR`
- `EXISTING_TEST_CONTRACT`
- `EXTERNAL_STANDARD`
- `IMPLEMENTATION_DISCOVERY`
- `AGENT_PROPOSAL`
- `UNRESOLVED`

`DECIDED` cannot use `IMPLEMENTATION_DISCOVERY`, `AGENT_PROPOSAL`, or `UNRESOLVED`.

## Stop condition

When implementation discovers that no canonical product concept exists, the agent may document alternatives but must not choose one silently if the choice changes future product truth.

Example:

```text
EXISTING_WORKLOAD_CONCEPT = NO
```

must not be followed by a canonical workload formula sourced only from agent inference. Record `NEEDS_PO_DECISION`, invoke the real owner interaction, and continue only after authority exists.

## Future slices

Under the default policy, canonical slice creation requires:

- `OWNER_EXPLICIT`, or
- `PREAPPROVED_PLAN`.

An agent may propose `Future capability: least-loaded routing`, but it may not canonize `E1_SLICE_05_LEAST_LOADED` unless the roadmap authority already exists.

## Reconciliation truth

When prose, gate, source, tests, and runtime disagree:

1. current source/runtime truth wins;
2. structured authority provenance is corrected;
3. historical mistakes remain visible;
4. do not rewrite history to imply the PO made a decision they did not make;
5. do not hide a real product defect inside a generic “test was being developed” explanation.

## Independent engineering review

High-risk work may require an authority separate from both automated verification and product approval: `INDEPENDENT_ENGINEERING_REVIEW`. The reviewer must be a different agent/session from the implementer. Its purpose is to challenge provenance, omitted gates, contradictory claims, and unsafe scope expansion rather than repeat the implementer's narrative.

## Diagnostic authority

A `READ_ONLY_DIAGNOSTIC` may classify observed root cause from evidence, but it does not authorize implementation. The owner/orchestrator separately authorizes the corrective slice when required.
