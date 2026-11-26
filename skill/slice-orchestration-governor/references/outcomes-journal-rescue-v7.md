# Structured Outcomes, Journal, Rescue & Reporting — v7

Every orchestration task has durable state under:

```text
.slices/orchestrations/<taskId>/
├── task.json
├── prompt.txt
├── journal.jsonl
└── phases/
    ├── ARCHITECT/outcome.json
    ├── BUILDER/outcome.json
    ├── QA/outcome.json
    └── AUDITOR/outcome.json
```

## Specialist outcomes

A specialist must finish its phase with one of:

- `DONE` — phase satisfied; advance.
- `DONE_WITH_CONCERNS` — usable result with explicit concern; persist and advance.
- `BLOCKED` — cannot truthfully complete; return to Coordinator and do not advance.
- `NEEDS_CONTEXT` — missing product/context decision; return to Coordinator and do not advance.

## Rescue

`swarm-rescue` resumes the same blocked role. Retries are bounded (default max 2) so repeated failure does not turn into an unbounded loop.

## Journal

The JSONL journal records orchestration creation, phase dispatches/outcomes, course changes, rescues, return to Coordinator, and stalled specialists. It is additive; previous truth is not rewritten.

## Report

`agybot report --task <id>` summarizes playbook, phase sequence, structured outcomes and recent journal events.

Cost/token values are never estimated. If the Antigravity host does not expose provider-reported usage for a worker, the report says `UNAVAILABLE_UNLESS_REPORTED_BY_HOST`.

## Context economy

Specialists return concise artifacts/status references rather than raw transcripts. Full chat history remains in Antigravity; the Coordinator consumes durable summaries needed to decide the next step.
