# Agy Bot Swarm Architecture — v7

## Topology
One project has one persistent technical team:

- Coordinator — current human-facing conversation; may be rebound
- Architect — persistent project conversation
- Builder — persistent project conversation
- QA — persistent project conversation
- Auditor — persistent project conversation

The registry key is project-scoped, not Coordinator-session-scoped. A later Coordinator reuses the same specialist conversations.

## Task lifecycle
For each new human turn the Coordinator runs `intake`. If specialists are required, the task is attached to the project team and dispatched to the first required specialist. Phase completion calls `swarm-complete`, which automatically advances the next required role and finally returns `SPECIALIST_CHAIN_COMPLETE` to the current Coordinator.

## Role-aware messages
Specialists do not run Coordinator intake for `AGY_ROLE_BOOTSTRAP` or `AGY_SWARM_IPC` messages. Coordinator internal IPC is not treated as a new human request.

## Transport
All specialist roles require real Antigravity conversation IDs created/bound through AgentAPI. `invoke_subagent` and hidden/ephemeral subagents are invalid orchestration evidence.
