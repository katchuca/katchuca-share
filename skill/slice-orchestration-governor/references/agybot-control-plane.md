# Agy Bot Control Plane — v6.2.1

Primary CLI:

```bash
node scripts/agybot.mjs help
```

## User-facing principle
Commands are optional. Natural language is primary. The Coordinator must run control-plane preflight itself; a non-technical user is not expected to know when to create a team.

## Core commands
- `bootstrap`
- `setup`
- `status`
- `pause` / `resume`
- `disable` / `unagybot` / `enable`
- `autonomy`
- `brain-status`
- `qualify`
- `dispatch` / `orchestrate` — mandatory substantial-work preflight
- `source-register`
- `requirement add|update|status|reconcile`
- `workstream-close`
- `task new|update|refine|status`
- `decision`
- `research-record`
- `swarm-register`
- `swarm-ensure`
- `swarm-send`
- `swarm-next` — Coordinator advances the deterministic specialist chain after a phase-complete message
- `swarm-health`
- `role-audit`
- `visual-attempt`
- `visual-ux-audit`

## Dispatch contract
`dispatch` checks the Engineering Brain, classifies the request, selects `requiredRoles[]`, creates missing chats through AgentAPI, persists task/dispatch lineage, and sends the first phase.

For a canonical refinement:

```bash
node scripts/agybot.mjs dispatch \
  --requirement REQ-X \
  --task REQ-X-R1 \
  --text "<approved refinement>" \
  --coordinator <CURRENT_COORDINATOR_CONVERSATION_ID>
```

The host Coordinator should supply its own conversation ID programmatically/environmentally. The human user must never be asked to find or type technical conversation IDs.
