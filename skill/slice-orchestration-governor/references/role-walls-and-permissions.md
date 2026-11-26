# Role Walls and Permissions Matrix — v6.1

Role walls are security boundaries, not suggestions.

| Role | Product code | Tests/runtime | Governance/Vault | External research | Human interface |
|---|---|---|---|---|---|
| Coordinator | PROHIBITED | read/coordinate | allowed | allowed | exclusive |
| Architect | PROHIBITED | read | planning only | request only | prohibited |
| Builder | approved writeScopes | implementation tests in scope | task artifacts | request only | prohibited |
| QA | prohibited except explicit test/evidence scopes | allowed | evidence | request only | prohibited |
| Auditor | read-only | read-only | review artifact | request only | prohibited |

Use `agybot role-audit` to fail closed with `UNAUTHORIZED_ROLE_MUTATION` when a role's observed paths exceed its authority.

No role wall grants permission to bypass project-specific constraints, mutation safety, production authorization, or Class C/D independent review.


## v6.2 decision-scope authority
Sensitive product/commercial/privacy/security `decisionMode=MUTATE` scopes require `PRODUCT_OWNER_EXPLICIT` or `EXISTING_PROJECT_SPEC` authority plus a durable reference. Read-only discovery can inform but cannot authorize product semantics.
