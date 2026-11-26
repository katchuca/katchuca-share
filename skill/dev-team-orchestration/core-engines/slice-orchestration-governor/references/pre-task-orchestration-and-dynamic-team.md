# Pre-task Orchestration & Dynamic Team — v7

**Lifecycle invariant:** classification runs on every human Coordinator turn; selected specialist conversations belong to the persistent project team and are reused across tasks and Coordinator chats. Specialist completion automatically advances the chain through `swarm-complete`.

# Pre-Task Orchestration & Dynamic Team Composition — v6.2.1

## Why this exists
v6.2 could classify a request and could send messages to already-bound conversations, but the lifecycle was incomplete: qualification was not a mandatory pre-task step and missing specialist chats were not automatically created/bound. v6.2.1 closes that gap.

## Mandatory substantial-work preflight
For every implementation/refinement/substantial diagnostic request, the Coordinator MUST run the equivalent of:

```bash
node scripts/agybot.mjs dispatch --text "<request>" ...
```

This preflight is part of execution, not an optional advisory command. It:
1. upgrades compatible project control-plane state to the current patch version on first use;
2. checks the Engineering Brain (canonical sources, requirement projection, MASTER, Vault and task lineage);
3. qualifies risk/class/surface;
4. selects only the roles justified by the work;
5. creates missing specialist conversations with Antigravity `agentapi new-conversation`;
6. binds them to the Coordinator swarm;
7. creates/links the execution task without inventing a new canonical requirement;
8. dispatches the first technical phase through structured AgentAPI IPC;
9. records the dispatch in `.slices` and the Engineering Vault.

Simple informational questions remain solo and do not require a swarm.

## Coordinator is the only human-facing chat
The Coordinator/Director intentionally has the "dirty" conversational context: user language, product intent, ambiguity, prior decisions and human interaction.

Specialist chats intentionally receive narrower technical batches:
- Architect: discovery, contracts, DAG, scopes and risks.
- Builder: approved implementation scope and TDD contract.
- QA: runtime/test/browser proof and failures.
- Auditor: independent read-only engineering/visual review.

This is **context economy**, not a promise of lower total token usage. Specialist contexts reduce irrelevant prompt contamination and improve role isolation/traceability, while multi-agent execution can consume more total tokens. Therefore Agy Bot activates only the roles whose contracts materially improve the task.

## Dynamic composition matrix

| Work | Default roles |
|---|---|
| Informational/simple question | Coordinator only |
| Strict read-only discovery | Coordinator only; Architect only when explicitly justified by decomposition/scale |
| Class A backend micro-hotfix | Coordinator + Builder |
| Class A visible UI microfix | Coordinator + Builder + QA; add Auditor when automated/hybrid visual policy requires qualitative UX review |
| Class B standard feature | Coordinator + Builder; add Architect for multi-owner/large-contract work; add QA for runtime/web/API evidence; add Auditor for visual UX review when applicable |
| Class C sensitive mutation | Coordinator + Architect + Builder + QA + Auditor (mandatory) |
| Class D structural migration | Full swarm mandatory; extra bounded specialists may be added if supported |

Final-diff semantic reclassification still applies. A task initially thought to be A/B can become C/D, which immediately raises the required team/gates.

## Class C/D are not just "review at the end"
For Class C/D, independent review remains mandatory, but v6.2.1 also requires role separation during execution. The Coordinator must not become the product-code implementer simply because an Auditor can be called later.

## AgentAPI conversation lifecycle
Missing required roles are created with:

```powershell
language_server.exe agentapi new-conversation "<NON_EMPTY_ROLE_BOOTSTRAP_PROMPT>"
```

The successful response's explicit conversation ID is parsed and immediately persisted in `AGY_SWARM_REGISTRY.json`. A project-bound bootstrap hook acknowledgement is required before task dispatch. See `agentapi-transport-v7.0.1.md`; populated registry strings alone are not proof of a live specialist.

Messages are sent with:

```powershell
language_server.exe agentapi send-message <CONVERSATION_ID> "<STRUCTURED_ENVELOPE>"
```

`swarm-health` validates every role required by the current task, not only the Coordinator.

## Engineering Brain invariant
No substantial implementation should start from conversational memory alone.

Before dispatch:

```text
CANONICAL PRODUCT SOURCES
        ↓
CANONICAL REQUIREMENTS / revisions
        ↓
MASTER execution projection
        ↓
ENGINEERING VAULT indexes
        ↓
TASK / REFINEMENT lineage
        ↓
SWARM execution
```

If an explicitly referenced canonical requirement is not indexed, dispatch fails closed. If a fingerprinted canonical product source is stale relative to its projection, dispatch fails closed until reconciliation. The Coordinator may never manufacture a replacement requirement just to proceed.

## Refinement tasks
A refinement inside an approved requirement creates/links a new Task. It does not create a new canonical requirement unless product authority explicitly authorizes one.

## Automatic patch upgrade
When the global skill is updated from 6.2.0 to 6.2.1, the first `bootstrap`, `status`, or `dispatch` on an already-configured project migrates compatible control-plane metadata to 6.2.1 while preserving:
- canonical sources;
- requirements and revisions;
- MASTER;
- Vault;
- tasks/refinements;
- evidence;
- swarms/conversation bindings;
- historical gates.

The user does not need to resend project decisions or reinstall the skill per project.

## Real conversation transport is mandatory
For any task whose `requiredRoles[]` contains a specialist, Agy Bot MUST use visible Antigravity conversations via AgentAPI. `invoke_subagent` and other native/internal subagent launchers are prohibited for the four Agy roles. They may not be used as a fallback, reviewer substitute, or convenience path.

A valid specialist phase requires a persisted conversation ID created or previously bound through AgentAPI. Missing binding means `ORCHESTRATION_BLOCKED`, not "continue solo".

For Class C/D, the Coordinator is also prohibited from doing the Builder/QA/Auditor work itself.

## v6.3 dispatch ordering
Conversation bindings are established first. The dispatch authorization record is then persisted before the first specialist task envelope is sent. This gives the project a durable authorization boundary before specialist execution begins. If AgentAPI transport fails, the Coordinator stops; there is no direct-implementation fallback.
