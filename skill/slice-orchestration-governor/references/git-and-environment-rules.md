# Git, Worktree, Environment, and Commit Policy Rules — v3.3

## Preserve user work

Never reset, clean, overwrite, discard, or commit unrelated user changes. Inspect actual worktree state before operations.

## Commit policy is project-configurable

The governor must obey `SLICE_GOVERNOR.json.commitPolicy`:

- `REQUIRED`: agent closure requires a real final atomic commit.
- `MANUAL_BY_OWNER`: agent verifies but must wait for a real owner-created commit before PASS.
- `FORBIDDEN_FOR_AGENT`: agent must not commit. Closure uses source/evidence fingerprint and records `N/A_FORBIDDEN_BY_POLICY` rather than inventing a SHA.

Never make an automatic commit merely because this skill prefers atomic history when project instructions prohibit it.

## Multi-worktree safety

Prefer parallel worktrees for simultaneous agents. Do not let multiple agents race on one Git index/HEAD. Shared `.slices/` lives at the primary repo through Git common-dir. Governor commands serialize shared-state mutation with `.slices/.governor.lock` and atomic replacement; do not directly race-edit governor files from parallel agents.

## Destructive Git prohibited

No force push, force-with-lease, destructive reset, tag rewriting/moving/deleting, or silent rebase of user work.

### v7.0.3 Hardening: Proibição de Comandos Destrutivos em Arquivo Não Commitado
1. **Comandos proibidos sobre arquivos não commitados**: É terminantemente PROIBIDO ao agente executar `git checkout`, `git restore`, `git reset` ou `git stash` / `git stash drop` sobre QUALQUER arquivo com modificação não commitada. Reverter arquivos com trabalho pendente via Git causa perda de dados irreversível.
2. **Reversão exclusivamente por cópia física em `.scratch/` com SHA-256**: Se o agente precisar experimentar alterações com possibilidade de descarte, DEVE salvar cópia em `.scratch/` com SHA-256 antes de alterar. A reversão é feita restaurando a cópia física de `.scratch/` e conferindo o hash — nunca via comandos Git.
3. **Proibição de `npx prisma format` e `npx prisma db pull` em batches READ_ONLY**: Esses comandos modificam ou reconstroem o schema e são classificados como mutação pesada. São proibidos em qualquer batch de descoberta ou com `mutationBudget=ZERO`.
4. **Declaração prévia de comando e alvo**: Todo comando de escrita em arquivos rastreados DEVE ser previamente declarado no envelope do batch antes da execução.

## v7.0.3 Commit por Batch e Snapshot de Segurança (Segunda Cópia)
1. **Commit por batch**: Todo batch de implementação aprovado deve finalizar com commit próprio nomeado pelo batch (`feat(<BATCH>): ...`).
2. **Pendências não commitadas > 1 dia**: Tratadas obrigatoriamente como risco operacional declarado no handoff (`RISCO_OPERACIONAL_PENDENCIAS_NAO_COMMITADAS = ALTO`).
3. **Snapshot de repositório acumulado**: Se o repositório já contiver trabalho acumulado, o primeiro batch deve criar um snapshot (`chore(snapshot): baseline antes de <BATCH>`) antes de qualquer alteração de código.
4. **Auditoria pré-commit**: Antes de commitar, verificar `git status --porcelain` para garantir ausência de `.env*`, `.next*`, caches, dependências e validar volume total.

## Cross-workstream dependencies

Use commit ancestry when commits are allowed. Under `FORBIDDEN_FOR_AGENT`, require explicit integration proof/fingerprint and common integrated source state; do not pretend commit ancestry exists.

## Environment evidence

Record actual command, start/end, natural exit, exit code, and relevant counts. A killed/canceled process is not a successful natural completion even if an earlier partial log looked green.

## Secret safety

Never store or print credentials, `.env` contents, tokens, cookies, private keys, secret-bearing URLs, or personal data in evidence. Redact before storing raw outputs.

## Test-data provenance

Do not infer fixture/test status from names. Use explicit fixture provenance and the declared data-safety environment. Human-data mutation requires explicit approval.

## V3.3 dirty-worktree provenance

At slice claim, capture the dirty-worktree baseline. Do not use a stable HEAD as evidence that current diffs belong to the claiming slice. Tracked edits, staged edits, and untracked files may predate or run concurrently with the slice.

Classify changed paths/hunks as current, preexisting, concurrent, mixed, or unknown. Preserve unrelated work. `UNKNOWN` ownership touched by the slice is not safe to close.


## v6.2 protected environment resources
Pre-existing `USER_RUNTIME`, `DOCKER_PERSISTENT`, `LOCAL_SERVICE`, and `EXTERNAL_PROVIDER` resources are protected. STOP/RESTART/MUTATE/DELETE requires explicit authority provenance through `environment-effect`; restoration must be recorded where applicable. `TEST_EPHEMERAL` remains autonomous.
