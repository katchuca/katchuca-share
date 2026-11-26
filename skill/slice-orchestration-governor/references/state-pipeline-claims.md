# State-pipeline acceptance claims

A single user-visible capability often has multiple truths. Do not collapse them.

Supported stages:

1. `CANONICAL_STATE` — persisted/authoritative domain state;
2. `DERIVED_PROJECTION` — API/read-model projection;
3. `SELECTION` — eligibility, ranking, rotation, filtering, grouping;
4. `DELIVERY` — transport/cache/client receipt;
5. `RENDER` — actual presentation/interaction.

Example shape:

```text
CANONICAL_STATE: approved=true
DERIVED_PROJECTION: publicable=true
SELECTION: activeGroup=false
DELIVERY: endpoint contains item=false
RENDER: card visible=false
```

These facts are not contradictory. Stage-qualified claims prevent a selection rule from being misdiagnosed as persistence failure, or a render failure from being treated as publication failure.

Use `pipeline-claim`. Contradictory values for the same stage/key block verification.
