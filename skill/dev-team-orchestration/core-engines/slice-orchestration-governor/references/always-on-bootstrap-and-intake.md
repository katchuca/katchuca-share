# Always-on Bootstrap & Intake — v7

## Three-way routing on every incoming turn
1. **Specialist IPC/bootstrap** (`AGY_ROLE_BOOTSTRAP v7.0.1`, `AGY_SPECIALIST_MODE=TRUE`, or `AGY_SWARM_IPC_v7` addressed to Architect/Builder/QA/Auditor): do not run Coordinator intake. Execute only the specialist envelope and complete via `swarm-complete`.
2. **Coordinator IPC** (`AGY_SWARM_IPC_v7` addressed to Coordinator): this is an internal orchestration event. Do not run a new human-request intake. Reconcile the returned artifact/status/decision.
3. **Human/project turn**: always run a fresh `agybot intake` using the complete current request. A previous turn's receipt never authorizes the next turn.

## Persistent team
The registry owns one persistent project team keyed by `project:<slug>`. New Coordinator chats rebind the Coordinator role while the same specialist conversation IDs are reused. Missing roles are created; existing roles are not duplicated.

## Automatic lifecycle
The first required specialist receives the dispatch. Each specialist executes the `swarm-complete` command included in the envelope. The runtime records completion and immediately sends the next phase:

`Coordinator → Architect → Builder → QA → Auditor → current Coordinator`

`swarm-send ... TASK_PHASE_COMPLETE` remains compatible and auto-advances. `swarm-next` is retained for recovery/admin only. Duplicate completion is idempotent; out-of-order completion is blocked.

## Continuations
`continue`, `prossiga`, and equivalent continuation intents resume the active specialist phase when one exists. They do not silently collapse an active team task into Coordinator-only work.

## Zero mutation and failure behavior
Question/context refresh/status/strict read-only intents remain zero-write. Required specialist transport failure blocks product mutation. Native/hidden `invoke_subagent` cannot satisfy Agy specialist roles.
