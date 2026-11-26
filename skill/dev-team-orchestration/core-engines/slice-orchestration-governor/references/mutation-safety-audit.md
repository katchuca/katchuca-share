# Automated Mutation-Safety Audit — v3.3

Automated tests and scripts can be more dangerous than production code when they run against the wrong environment.

Before verification, classify whether automation in scope can mutate persistent state.

## Required record

- applicability: `REQUIRED` or `N_A_BY_DESIGN`;
- audit completed;
- number of mutating test/script files detected;
- number lacking the approved fail-closed guard;
- guard contract when mutations exist;
- evidence/reference for the audit.

Verification requires `unguardedMutationTests = 0`.

## Generic fail-closed principle

A mutating automation path must positively prove it is running in an approved disposable/sandbox environment before the first mutation. Naming conventions alone are not provenance unless the project explicitly defines them as a guard contract.

If a concurrent test script is discovered unguarded, do not silently edit another workstream. Record the blocker or use an explicitly authorized scope-expansion/safety-hardening path.
