# Example — Read-Only Diagnostic Slice (v3.3)

Use this pattern when the next code change depends on proving the root cause first.

```bash
node scripts/slice-governor.mjs new \
  --workstream incident \
  --name root-cause \
  --title "Classify current divergence" \
  --kind READ_ONLY_DIAGNOSTIC \
  --surface api \
  --acceptance "First divergence layer and root cause are proven" \
  --scenario "Compare canonical owner, API projection, and observed client state" \
  --scope none-readonly \
  --depends none \
  --atomic yes \
  --creation-authority OWNER_EXPLICIT \
  --creation-ref "incident investigation authorized"

node scripts/slice-governor.mjs start --slice incident:1

node scripts/slice-governor.mjs diagnostic \
  --slice incident:1 \
  --layers "domain-owner,direct-resolver,http-api,client-state,rendered-surface" \
  --root-cause "projection diverges at HTTP API" \
  --recommended-next-action "authorize focused read-model correction" \
  --project-files-changed no \
  --database-changed no \
  --process-restarted no
```

The diagnostic may create governor evidence under `.slices/`, but it does not authorize implementation and must not mutate project/runtime state.
