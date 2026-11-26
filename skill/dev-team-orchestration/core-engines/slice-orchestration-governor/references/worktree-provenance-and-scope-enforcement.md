# Worktree Provenance and Write-Scope Enforcement — v3.3

A dirty repository is normal in multi-agent work. A stable `HEAD` does not prove who owns the current diff.

## Claim-time baseline

`start` captures:

- branch and HEAD;
- hash of `git status --porcelain -uall`;
- hash of tracked diff;
- hash of cached diff;
- hash + file manifest of untracked files.

The baseline is written to the slice evidence directory and gate record. It is historical provenance, not a promise that the worktree remains unchanged.

## Change ownership

Each changed path declares one provenance:

- `CURRENT_SLICE`
- `PRE_EXISTING`
- `CONCURRENT`
- `MIXED`
- `UNKNOWN`

For anything except `CURRENT_SLICE`, hunk review is required. A file can be `MIXED`: part preexisting/concurrent, part current slice.

`UNKNOWN` ownership content touched by the current slice blocks closure. Resolve ownership or hand off rather than rewriting history.

## Write-scope enforcement

Every slice-owned path must be inside a declared `writeScope`.

Out-of-scope work is only closeable when explicitly classified as:

- `OWNER_APPROVED_EXPANSION`
- `EXPLICIT_HANDOFF`
- `EMERGENCY_SAFETY_HARDENING`

and a concrete authority/reference is recorded.

A useful change is still a scope expansion. Record it rather than hiding it.

## Concurrent files

Do not claim an entire concurrent/untracked file because the slice added a small safety hunk. Record the exact ownership boundary and preserve unrelated hunks.
