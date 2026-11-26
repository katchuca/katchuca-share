# Slice Classes and Auto-Detection — v4.0

## Slice Classification Matrix

The governor distinguishes four operational slice classes to eliminate bureaucratic overhead on small tweaks while enforcing strict rigor on critical mutations:

| Class | Type | Line/File Scope | Sensitive Paths | Required Gates & Approvals | Playwright Requirement |
|---|---|---|---|---|---|
| **Class A** | `MICRO_HOTFIX` | < 50 lines changed, <= 3 files | ZERO touching auth, schema, payment, rls, crypto | Automated engineering only. Auto-approves without independent review | Optional if marked `USER_VISIBLE_INLINE` |
| **Class B** | `PRODUCT_FEATURE` | Standard feature scope (typically 50–500 lines) | Standard product code | Automated tests + standard engineering verification | Mandatory for web surfaces (`console.error == 0`) |
| **Class C** | `SECURITY_MUTATION` | Any line count touching sensitive scopes | Auth, schema, migrations, payments, RLS, crypto, permissions | Mandatory `INDEPENDENT_ENGINEERING_REVIEW` + adversarial red-team audit | Mandatory headless assertion + strict mutation safety |
| **Class D** | `STRUCTURAL_MIGRATION` | > 10 files or major architecture refactor | Cross-workstream shared interfaces | Full architectural review + integration proofs + cross-slice lock | Mandatory regression suite |

---

## Sensitive Path Patterns (Triggers Class C)
Any change touching files matching any of the following triggers automatic **Class C** classification:
- `*auth*`, `*login*`, `*session*`, `*jwt*`, `*token*`
- `*schema*`, `*migration*`, `*.sql`, `*prisma*`, `*drizzle*`, `*typeorm*`
- `*payment*`, `*billing*`, `*stripe*`, `*invoice*`
- `*rls*`, `*policy*`, `*permission*`, `*role*`, `*rbac*`
- `*crypto*`, `*cipher*`, `*secret*`, `*.env*`

---

## Automatic Class Detection (`detect-class`)
The `slice-governor.mjs detect-class` command inspects either:
1. Active Git working tree (`git diff` and `git status`), OR
2. Workspace file manifests and hashes (pure Node.js fallback when Git is unavailable).

### Evaluation Logic:
1. If sensitive files are detected -> **Class C** (`SECURITY_MUTATION`).
2. Else if total added + deleted lines < 50 and changed files <= 3 -> **Class A** (`MICRO_HOTFIX`).
3. Else if changed files > 10 or architectural directories touched -> **Class D** (`STRUCTURAL_MIGRATION`).
4. Otherwise -> **Class B** (`PRODUCT_FEATURE`).

---

## Class A Lightweight Exemption
For Class A slices:
- Independent engineering reviewer is NOT required.
- If the change is directly visible in the UI / chat, pass `--inline-ui` or `--visual-policy USER_VISIBLE_INLINE` to waive the headless Playwright browser run while maintaining full evidence integrity.
- Verification completes instantaneously.


## v6.2 final-diff semantic reclassification
Initial path-based classification is provisional. Before verification, the Governor scans final slice-owned changes and semantic symbols. Sensitive subscription/billing/payment/entitlement/allocation, auth/RLS/crypto, privacy/retention or destructive lifecycle semantics promote to Class C regardless of filename. Broad structural change may promote to D. C/D requires independent engineering review. `reclassify --slice <id>` exposes the same check; `verify` invokes it automatically.
