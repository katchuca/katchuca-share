# Unified Engineering Standards

## Core Discipline Convergence

Slice Orchestration Governor unifies core engineering standards into a cohesive, automated execution framework.

---

## 1. Clean Code Standards
Every slice change must uphold core clean engineering principles:
- **Meaningful Names**: Reveal intent. Variables, functions, and classes must describe what they do without needing explanatory comments.
- **Single Responsibility Principle (SRP)**: Functions do one thing and do it well. Maximize cohesion and minimize coupling.
- **Small Functions**: Keep functions focused and compact, with shallow nesting and early returns.
- **Fail Fast & Handle Errors**: No swallowing exceptions. Distinguish expected failures from fatal bugs.
- **Command-Query Separation (CQS)**: Functions should either mutate state or answer a query clearly.

---

## 2. Test-Driven Development Discipline
Implementation follows strict TDD verification:
1. **Red**: Write a failing test before writing production code (Pre-Fix Red Check).
2. **Green**: Write the minimum clean code required to make the test pass.
3. **Refactor**: Remove duplication and simplify while keeping tests green.
4. **Verification**: Execute checks unpiped (`agybot q -- <cmd>`) with natural exit code `0` and verify Layer-2 `test-integrity`.

---

## 3. Pre-Action Safety Guard
Destructive and irreversible actions are strictly forbidden by default:
- **Forbidden Git Actions**: `git reset --hard`, `git clean -fdx`, `git push --force`, `git commit --no-verify`, or `git checkout/restore` over uncommitted user edits.
- **Forbidden Filesystem Actions**: Recursive deletion outside temporary folders (`rmdir /s /q`, `rm -rf`).
- **Forbidden Database Actions**: Unscoped `DROP TABLE`, `TRUNCATE`, `prisma format/db pull` in `READ_ONLY`, or mutations without sandbox isolation.
- Any necessary mutation must declare data safety first via `data-safety` and `mutation-safety`.

---

## 4. Self-Healing & Error Recovery
When commands or tests fail during execution:
- Errors are logged structured in `FRICTION_LOG.jsonl` / `.slices/logs/` with failure classification (`PRODUCT_DEFECT`, `TEST_HARNESS_DEFECT`, `ENVIRONMENT`).
- Root causes are investigated from raw logs before editing code.
- Bounded self-repair runs up to `autoRepairMaxRounds` (`3`); 2 identical failures trip `LOOP_DETECTED` and auto-record a durable learning.

---

## 5. Repository Etiquette & Hygiene
- Internal governance files, temporary dumps, and `.env*` secrets must never be committed to version control.
- `.slices/`, `.agy-vault/`, `.agy-backups/`, and `.scratch/` stay excluded automatically via local `.git/info/exclude`.
- Commit messages remain clean, concise, and adhere to Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`).

---

## 6. Workspace Forensics & Memory Indexing
- `node .slices/agybot.mjs lifecycle-probe` & `node .slices/slice-governor.mjs scan`: Profile repository stack, manifests, architecture, test runners, and constitutional/design readiness.
- `node .slices/agybot.mjs brain-status` & `node .slices/slice-governor.mjs brain-recall`: Inspect project requirements, decisions, Vault indexes, and session artifacts without API bloat.
