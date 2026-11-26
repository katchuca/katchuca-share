# Task Lifecycle & Ledgers — v6.1

## Task states
- SUBMITTED
- READY
- WORKING
- INPUT_REQUIRED
- BLOCKED
- REVIEW_REQUIRED
- COMPLETED
- FAILED
- CANCELLED

Terminal tasks are not silently reopened. A correction/refinement creates a new task linked by `parentTaskId`.

## Task Ledger
Captures objective, canonical requirements, dependencies, owners, scope, acceptance and gates.

## Progress Ledger
Captures proven facts, failed attempts, invalidated evidence, still-valid evidence, blockers and reconciliations. Circuit-breaker decisions should be grounded in the progress ledger rather than chat memory.

## Message vs Task vs Artifact
A message is communication. A task is stateful work. An artifact is durable evidence/result. Free-form agent prose is never automatically equivalent to verified evidence.
