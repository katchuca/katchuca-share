# Visual Validation Policy — v6.2

## Project-level choice
Every project onboarding/setup MUST ask who is authorized to issue final visual acceptance. The user chooses one of three explicit modes:

1. **HUMAN_MANUAL — only a human validates the visual result.** Automation may test DOM, runtime, geometry, accessibility signals and functional behavior, but it cannot claim `VISUAL_PASS`. Recommended when the project has strict manual design homologation, unstable screenshots, or the owner wants final visual control.
2. **HYBRID — automation and a human both validate.** QA/Auditor must produce the automated visual/UX gate and the human must also approve. Recommended by default when the repository has a web UI plus reliable browser automation.
3. **AUTOMATED_FOCUSED — automation validates the visual result.** The independent Auditor may issue the visual/UX PASS from real rendered artifacts + DOM/context. Recommended only when the project has reliable browser automation and the owner explicitly accepts automated visual acceptance.

The onboarding must show a short explanation and an **autodetected recommendation with its reason**. Autodetection is advisory only; the user's explicit choice wins.

## Autodetection
- web framework + Playwright/Cypress/browser automation -> recommend `HYBRID`;
- web framework without browser automation -> recommend `HUMAN_MANUAL`;
- no web framework -> recommend `AUTOMATED_FOCUSED` because visual acceptance is usually not applicable.

## Precedence
The project visual policy overrides generic visual-gate defaults.

### HUMAN_MANUAL
- every web/mixed slice requires `HUMAN_PRODUCT`;
- no automated Auditor visual PASS is accepted;
- technical DOM/runtime evidence may still be required when applicable;
- human approval is fingerprint-bound to the final governed state.

### HYBRID
- automated Auditor visual/UX audit PASS is required;
- `HUMAN_PRODUCT` is also required;
- either side changing after approval makes the approval stale.

### AUTOMATED_FOCUSED
- automated visual/UX audit PASS is the final visual authority;
- no human approval is fabricated.

`USER_VISIBLE_INLINE` remains a specialized compatibility policy and is not one of the three onboarding choices.

## No fake visual evidence
Screenshot existence is not review. Automated visual acceptance must inspect rendered artifacts plus DOM/context and use the qualitative rubric. Pixel diffs are regression aids, not aesthetic judges.
