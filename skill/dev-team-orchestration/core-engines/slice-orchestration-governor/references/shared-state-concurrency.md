# Shared-State Concurrency — v3.3

## Why this exists

Write-scope and decision-scope locks protect project semantics, but they do not prevent two OS processes from performing a read-modify-write on the same `MASTER_SLICE_CHECKLIST.md` or `gate.json`.

V3.3 therefore adds a governor-level process lock.

## Lock

Location:

```text
.slices/.governor.lock/
  owner.json
```

Metadata includes PID, hostname, command, agent, session, and acquisition time.

Every mutating governor command obtains the lock before reading/modifying shared governor state.

## Atomic writes

Shared state uses:

```text
write temp in same directory
-> fsync temp
-> atomic rename to destination
```

This prevents partially written JSON/Markdown and reduces lost-update risk when paired with the process lock.

## Stale recovery

The governor may recover a lock when:

- the owning PID is no longer alive on the same host; or
- the lock exceeds the configured stale threshold.

Defaults:

```text
governorLockTimeoutMs = 30000
governorStaleLockMs = 1800000
```

Environment overrides:

```text
SLICE_GOVERNOR_LOCK_TIMEOUT_MS
SLICE_GOVERNOR_STALE_LOCK_MS
```

## Rule

Do not bypass the lock by directly editing `.slices/` from multiple agents. Project source files may still be edited in separate worktrees according to write/decision scopes.
