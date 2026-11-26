# Unified Subagent Handoff Contracts — v6.1

## Task != Message != Artifact
- **Task**: durable stateful work.
- **Message**: communication between roles.
- **Artifact**: durable result/evidence.

A handoff message must not be interpreted as proof unless the required artifact/evidence exists.

## Structured envelope
Every IPC handoff should identify task/context, roles, requested action, source fingerprint, required artifacts, decision flag, and hop count.

## Coordinator-only owner escalation
If a specialist encounters a missing decision, it returns a `DECISION_REQUIRED` artifact to the Coordinator. The Coordinator resolves from canonical sources or escalates to the human according to materiality.

## Refinements
A terminal task is not silently reopened. A new refinement task references the parent task and carries only still-valid evidence/gates forward.
