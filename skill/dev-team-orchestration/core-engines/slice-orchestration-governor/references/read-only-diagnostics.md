# Read-Only Diagnostic Slices — v3.3

Use `READ_ONLY_DIAGNOSTIC` when implementation would be guesswork without first proving root cause.

## Contract

A read-only diagnostic:

- uses `writeScopes=[none-readonly]`;
- may be a root slice with no parent;
- keeps `implementationAuthorized=false`;
- changes no project files;
- changes no database records;
- restarts/terminates no project process;
- records the diagnostic layers inspected;
- classifies root cause;
- recommends the minimum next action.

The diagnostic may create `.slices/` evidence because governor artifacts are operational metadata, not project implementation.

## Truth-reconciliation ladder

When layers disagree, inspect in order:

```text
domain/source owner
-> direct resolver/read-model
-> transport/API
-> client state
-> rendered surface
```

Stop at the first divergence. Do not patch the UI merely because it is the last visible layer.

## Outcome

Typical closure:

```text
ROOT_CAUSE = ...
IMPLEMENTATION_AUTHORIZED = NO
RECOMMENDED_NEXT_ACTION = authorize focused fix | restart manually | collect missing authority | no change required
```
