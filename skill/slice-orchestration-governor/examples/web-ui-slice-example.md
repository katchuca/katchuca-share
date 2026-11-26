# Example — Web UI slice (v3.3)

Illustrative only; never reuse example evidence/results as real proof.

**Slice:** `profile-03_save`

**Acceptance:** signed-in user edits display name, saves, reloads, and sees persisted name.

## Planning

```bash
node scripts/slice-governor.mjs new \
  --workstream profile \
  --name save \
  --title "Persist profile name" \
  --surface web-ui \
  --acceptance "Saved display name persists after reload" \
  --scenario "Signed-in representative user edits and reloads profile" \
  --scope "src/profile/**,tests/profile-*" \
  --source "src/profile/**,tests/profile-*" \
  --decision-scope "profile-contract" \
  --decision-mode MUTATE \
  --approval "AUTOMATED_ENGINEERING,HUMAN_PRODUCT" \
  --atomic yes \
  --creation-authority OWNER_EXPLICIT \
  --creation-ref "PO approved profile-save slice"
```

Before implementation:

```bash
node scripts/slice-governor.mjs surface \
  --slice profile-03_save \
  --decision REUSE_EXISTING_SURFACE \
  --owner "existing /profile page" \
  --evidence "current HEAD route/component owner"

node scripts/slice-governor.mjs data-safety \
  --slice profile-03_save \
  --environment SANDBOX \
  --fixture-provenance-reviewed yes
```

Expected proof:

- source snapshot captured after final code edit;
- real Playwright flow against the actual production `/profile` surface;
- synthetic component fixture, if used, is supplemental only;
- DOM rendered/visible/interactive/actionable;
- `console.error=0`, `pageerror=0`;
- persisted name after reload;
- screenshot from same unmodified composition;
- change manifest classifies runtime/test/governance changes;
- checks naturally complete after source snapshot;
- progressive notes record authority provenance;
- engineering verify may produce `ENGINEERING_PASS_READY_FOR_HUMAN_REVIEW`;
- Product Owner approval is recorded separately before final PASS when required.

## Visual-policy note

The example assumes a policy that uses automated browser proof. Under `HUMAN_MANUAL`, focused functional/DOM checks may still be useful, but screenshot automation is not required and final visual acceptance belongs to `HUMAN_PRODUCT`.
