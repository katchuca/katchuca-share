# Impasse Watchdog and Circuit Breaker Law — v4.0

## Anti-Thrashing Protocol (The 3rd Strike Law)

Autonomous agents must not enter infinite retry loops attempting minor variations of an invalid mental model.

### Invariant:
- Maximum of **two (2) consecutive failed repairs** allowed on any single slice.
- Upon the second failed repair attempt without confirmed PASS, the slice automatically transitions to status:
  ```text
  status: IMPASSE_TRIPPED
  ```

---

## State Transition Rules

1. **First Failure**:
   - Record via `failure --slice <id> --operation <op> --symptom <sym> ...`
   - Increment `failure_count = 1`.
   - Normal diagnostic repair allowed.

2. **First Repair Attempt**:
   - Record via `repair --slice <id> --note <note> --proof <file>`
   - `consecutive_failed_repairs = 1`.

3. **Second Failure / Re-failure**:
   - If verification fails again, `consecutive_failed_repairs = 2`.
   - **CIRCUIT BREAKER TRIPPED!**
   - Slice status immediately becomes `IMPASSE_TRIPPED`.
   - All standard `start`, `snapshot`, `verify`, and `close` commands are **hard blocked**.

---

## Recovery from `IMPASSE_TRIPPED`

To unlock an impasse-tripped slice, the agent MUST explicitly pivot its hypothesis:
1. Re-examine the root premise (dependency versions, environment configs, wrong types, missing prerequisites).
2. Execute a diagnostic audit with `diagnostic` command or `scan`.
3. Provide the `--pivot-hypothesis "<new explanatory model>"` flag to the `repair` command:
   ```bash
   node scripts/slice-governor.mjs repair --slice <id> --note "New hypothesis" --proof <proof-file> --pivot-hypothesis "Discovered port conflict rather than syntax error"
   ```
4. This clears the impasse lock and resets `consecutive_failed_repairs = 0`.
