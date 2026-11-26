# Formal gate transfer and selective re-verification

## Gate transfer

A mandatory gate may occasionally belong to a later integration/finalization stage rather than the current bounded slice. Do not fake PASS and do not silently omit it.

A formal transfer requires:

- explicit Product Owner or existing-spec authority;
- named gate;
- target slice that already exists;
- reason;
- inherited debt on the target.

The origin can record the gate as `TRANSFERRED`, but final seal blocks until the target resolves the transfer with PASS evidence.

Use `transfer-gate` to create/resolve this debt.

## Selective re-verification

Corrective slices use `AFFECTED_ONLY` by default. Reuse is valid only when the check's own input fingerprint and contract fingerprint still match. If either changed, rerun the gate.

This prevents both extremes:

- rerunning expensive unrelated gates by ritual;
- reusing stale evidence because the changed file looked unrelated informally.
