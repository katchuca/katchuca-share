# Validation — Slice Orchestration Governor v8.3.0

Run on the **unedited package**:

```bash
node --check scripts/agybot.mjs scripts/autonomy-engine.mjs scripts/antigravity-hook.mjs scripts/install.mjs scripts/slice-governor.mjs scripts/verify-slice-gate.mjs scripts/secret-scan.mjs scripts/design-lint.mjs scripts/q.mjs scripts/agentapi.mjs scripts/self-test-v8.3.0.mjs
node scripts/self-test-v8.3.0.mjs
node scripts/secret-scan.mjs --dir . --json
```

`self-test-v8.3.0.mjs` covers (`T1`–`T45`):
- `T1`–`T38`: Full v8.2.0 baseline (Hardening-3, quote-aware `splitCommandSegments`, read-only expansion, non-deadlocking `LIVING`/`FROZEN` source drift, `NATIVE_SUBAGENTS`, `secret-scan`, `design-lint`, `q.mjs`, `handoff-verify`, Zero-Shadow single-backup outside discovery, `.git/info/exclude`, open-stdin `--self-check`, universal multilingual intent classification, `intake --directive` mid-turn unblock, `doctor`, `browser-config`, Layer-2 `test-integrity`, `autoLearn`, `scope-check`, 7-step Total-Autonomy onboarding with shortcut tour);
- `T39`: Automatic TODO creation on `dispatch` + TODO check-off, structured `CHANGELOG.md` entry, and `MASTER_SLICE_CHECKLIST.md` Audit Log tracking on `handoff-verify` + `agybot record` idempotency;
- `T40`: Deduplication & single-block upkeep of `CANONICAL_REQUIREMENTS_PROJECTION` across both `agybot.mjs` and `slice-governor.mjs`;
- `T41`: Greenfield vs Brownfield detection (`lifecycle-probe`), `scaffold-constitution` preserving `AGYBOT_BOOTSTRAP`, and `promote-rule` persistence to `AGENTS.md` / `.slices/DESIGN_TASTE.md`;
- `T42`: Deterministic Anti-Pill & Anti-Slop `design-lint.mjs` (`U1`, `U9`, `U26`, `U26_DENSITY`, interactive control exemptions, `.slices/DESIGN_TASTE.md` `## Off`);
- `T43`: `design-taste-init` creation & non-destructive idempotency;
- `T44`: `--skip-tracking` opt-out honored inside `handoff-verify`;
- `T45`: Standalone white-label package hygiene gate verifying zero external skill citations, zero deleted v7 doc references, and zero private project references.
