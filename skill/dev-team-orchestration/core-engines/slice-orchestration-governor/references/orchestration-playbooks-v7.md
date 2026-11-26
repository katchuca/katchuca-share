# Orchestration Playbooks — v7

v7 borrows the useful idea of playbooks from Alethe while keeping Agy's project-authority and role contracts.

Playbooks do not replace risk classes. Risk/class/surface determine required roles; the playbook defines the ordered phase sequence for those roles.

| Playbook | Typical use | Phase sequence |
|---|---|---|
| `DIRECT_COORDINATOR` | non-mutating / Coordinator-only work | Coordinator |
| `FAST_FIX` | bounded implementation | Builder → QA when required |
| `DISCOVER_BUILD` | unfamiliar/multi-owner implementation | Architect → Builder → QA |
| `FULL_GOVERNED` | Class C/D / sensitive work | Architect → Builder → QA → Auditor |
| `REVIEW_GATE` | validation/review-only work | QA → Auditor |
| `AUDIT_DISCOVERY` | read-only architecture + independent audit | Architect → Auditor |

The playbook selector never removes a role that the risk classifier requires.

## Persistent team, transient task

The four specialist conversations are persistent per project. A playbook is transient per task and dispatches only the roles required for that task. Reusing the conversation ID does not reuse stale task authority; each task has a fresh dispatch record, phase state, and outcome journal.

## Change course / join mid-task

A new mutable human instruction received while a specialist task is active is treated as a course update for that active task by default, not as a parallel task on the same persistent team. The update is journaled and delivered to the currently active specialist. A blocked phase receiving new human context is resumed on the same role.

Explicit new-task/parallel behavior must be deliberate and must respect project ownership/write-scope locks.

## Parallel worktrees

Alethe's parallel-worktree pattern is intentionally NOT the default in Agy. Agy projects may contain dirty user worktrees and explicit no-commit/no-reset policies. Parallel worktrees may only be enabled by a future project-specific policy with disjoint ownership and explicit authority.
