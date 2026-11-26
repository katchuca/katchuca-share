# Multi-Agent Context Economy & Cost — v6.2.1

## Design conclusion
Agy Bot must not equate “more agents” with “cheaper” or “better”. The reason to split work is **contract isolation**: narrower instructions, cleaner context, independent review, clearer provenance, parallelism where real, and less contamination between human/product discussion and technical execution.

This may reduce irrelevant context per specialist, but can increase **total** model/token usage.

## External research basis
- OpenAI's agent orchestration guidance recommends starting with one agent where possible and adding specialists when they materially improve capability/policy isolation, prompt clarity or trace legibility. It also distinguishes manager-owned specialist calls from full handoffs.
- Anthropic's multi-agent research-system report found strong performance gains on breadth-first, parallel research, while also reporting substantially higher token consumption and noting that many coding tasks have fewer truly parallelizable branches than research.
- Microsoft Magentic-One uses a central Orchestrator with a Task Ledger and Progress Ledger, assigning bounded work to specialized agents and replanning when progress stalls.

## Governor policy derived from this evidence
1. Coordinator remains the only human/product-context owner.
2. Specialists receive bounded technical batches rather than the entire human conversation.
3. `requiredRoles[]` is dynamic.
4. Read-only/simple work remains solo unless decomposition materially helps.
5. Class C/D uses full separation because security/sensitive review independence is worth the overhead.
6. Visual work adds QA/Auditor according to visual policy rather than blindly spawning all roles.
7. The system reports context-economy benefit honestly and never claims guaranteed token savings.

## Sources consulted during v6.2.1 design
- OpenAI, “Orchestration and handoffs” / Agents SDK orchestration documentation.
- Anthropic, “How we built our multi-agent research system” (2025).
- Microsoft Research / AutoGen, Magentic-One architecture and Task/Progress Ledger documentation.
