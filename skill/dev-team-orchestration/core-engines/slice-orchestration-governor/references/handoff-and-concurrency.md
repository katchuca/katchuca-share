# Multi-Agent Workstreams, Semantic Coordination, Handoff, and Integration — v3.3

## 1. DAG, not global queue

Independent READY slices may execute concurrently. Sequentiality applies only through declared `dependsOn` and active scope conflicts.

## 2. Exclusive owner

Exactly one agent/session owns an active slice. Handoff must be explicit, signed, and preserve exact next action.

## 3. Write-scope locks

Every slice declares `writeScopes`. Active overlap blocks a claim.

## 4. Decision/contract scopes

File locks do not prevent semantic conflicts. Two agents may edit different files while mutating the same product rule.

Declare `decisionScopes`, e.g.:

```text
weight-classes
commercial-entitlements
onboarding-state-machine
judging-policy
```

`decisionMode=READ` may coexist with another READ. A `MUTATE` slice conflicts with any active slice sharing that decision scope unless explicitly reconciled/handoff occurs.

## 5. Governor shared-state lock

All CLI mutations of `.slices/` are serialized by `.slices/.governor.lock`; file writes use atomic replacement. Semantic scopes do not replace this filesystem-level protection.

## 6. Parallel worktrees

Recommended: one worktree/work branch per active workstream/agent plus integration worktree. `.slices/` remains shared through Git common-dir.

## 7. Cross-workstream integration

With `commitPolicy=REQUIRED` or `MANUAL_BY_OWNER`, dependency final commits must be reachable from claiming HEAD.

With `FORBIDDEN_FOR_AGENT`, no fake commit is permitted. A cross-workstream dependent slice requires explicit recorded integration proof/fingerprint in `coordination.dependencyIntegrationProofs`; if integration cannot be proven, block the claim.

## 8. Integration slices

Use explicit integration slices for combined behavior. Independent PASS does not imply integrated PASS.

## 9. Handoff payload

Include owner identities, current status, acceptance criterion, dependencies, creation authority, write scopes, decision scopes, change manifest, source fingerprint, checks/evidence already generated, progressive notes with authority provenance, actual `/GRILL-ME` candidates/decisions, circuit-breaker incidents, deferred carry-forward, surface/data-safety state, branch/worktree state, and exact next action.

### v7.0.3 Hardening: Handoff é Alegação, Não Resultado (Evidência Estrita)
1. **Contagem de testes por arquivo**: Todo handoff com testes DEVE trazer a contagem por arquivo executado (`<arquivo>: # tests / # pass / # fail / exit code`). Relatórios agregados genéricos ("todas verdes", "100% pass") são classificados como VERDE POR ESCOPO e sumariamente rejeitados.
2. **Contagem física de arquivos alterados**: O handoff DEVE declarar o número físico exato e a lista de arquivos alterados. Divergência entre declaração e o filesystem (`git status --porcelain`) INVALIDA o batch imediatamente.
3. **Falhas preexistentes somente com prova**: Proibido alegar falha preexistente sem prova documental: ou comprovação de que o arquivo não foi tocado pelo batch (mtime/diff) ou diagnóstico com `arquivo:linha` prévio. Sem prova = falha do batch.
4. **Integridade de schema**: Sempre que o batch alterar schema (ex: `prisma/schema.prisma`), é obrigatória validação imediata (`npx prisma validate`, cálculo de SHA-256 e conferência estrutural) com hash no handoff.

## 10. Stale-state defense

Before relying on another slice, re-read MASTER, gate, source fingerprint, dependency state, and relevant source. `seal`, `status`, `start`, and `verify` should detect fingerprint drift where possible.

## 11. Reconciliation

If MASTER/report/repository/runtime disagree, the structured gate + actual repository/runtime truth wins over prose. Preserve historical audit rows; correct current state explicitly. Never rewrite history to make an invalid run look compliant.

## V3.3 provenance handoff

A handoff must preserve the claim-time worktree baseline and the current change-provenance matrix. If a file is `MIXED`, the receiving agent inherits the hunk boundary, not ownership of the whole file.

Out-of-scope safety work must remain visibly classified as scope expansion with its authority/reference. A handoff may authorize scope transfer explicitly; it may not retroactively erase that expansion.
