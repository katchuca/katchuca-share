# Evidence Matrix by Surface — v3.3

Use the minimum evidence that actually proves the current acceptance criterion, bound to the current source fingerprint.

| Surface | Real scenario proof | Typical machine evidence | Runtime error channel |
|---|---|---|---|
| `web-ui` | Actual production surface with representative state | DOM/actionability and/or focused visual evidence according to visual policy | browser + server |
| `mixed` | End-to-end UI + backend | browser proof + backend/state evidence | browser + process/server |
| `api` | Request to real approved runtime | sanitized request/response + state effect | HTTP + server/process |
| `cli` | Invoke actual CLI | stdout/stderr + exit code + resulting state | process |
| `library` | Consumer harness | public API contract/result | harness/runtime |
| `data` | Disposable/approved state | invariants + rollback/cleanup evidence | DB/migration |
| `infra` | validate/plan/sandbox | non-destructive plan/validate evidence | tool/runtime |
| `native-ui` | Real app interaction | platform interaction + visual proof per policy | app/runtime |

## Visual acceptance policy

Configure one project-level policy:

### `AUTOMATED_FOCUSED`

Focused production-surface automation is the visual gate. For browser surfaces, use real actionability and focused screenshot evidence from the unmodified composition.

### `HUMAN_MANUAL`

Automation proves function/state where useful, but screenshot automation is not required for visual acceptance. `HUMAN_PRODUCT` approval is mandatory for web/mixed slices. Do not manufacture screenshot batteries merely to satisfy the governor.

### `HYBRID`

Focused production-surface automated proof plus explicit human visual approval.

## Browser integrity when automation is used

Do not use `force:true`, DOM-dispatched clicks, CSS/pointer-event/layout mutation, overlay hiding, or synthetic fixture substitution to manufacture actionability. Synthetic harnesses may supplement but not replace a named production surface.

## Provenance

Every evidence entry records path, SHA-256, generation metadata, source fingerprint, provenance model, method, and what it proves.

- `SELF_CONTAINED`: project-generated structured evidence embeds the source fingerprint.
- `EXTERNAL_CRYPTOGRAPHIC_BINDING`: immutable external output is bound by hash/command/timestamp.
- `GATE_MANIFEST_BINDING`: binary/text/visual evidence is bound through the gate manifest.

## Authority chain

Prefer:

```text
runtime/source truth -> machine evidence -> QA/presentation
```

Presentation may format facts but must not invent or independently recompute critical truth that has a canonical runtime owner.
