# Global Canonical Runtime & Zero-Shadow Project Binding — v8.3.0

## Why v8+ eliminated `.agents/skills/` local copies & shims

In earlier releases, projects kept a local binding shim at `<project>/.agents/skills/slice-orchestration-governor/` (`SKILL.md` + proxy scripts). Because Antigravity workspace discovery loads `<project>/.agents/skills/` **before** `~/.gemini/config/skills/`, any stub or partial mirror inside `<project>/.agents/skills/` shadowed the global canonical skill and forced tedious per-project updates whenever the global engine upgraded.

v8 resolves this permanently with **Zero-Shadow Global Resolution**:

```text
GLOBAL CANONICAL ENGINE (Single Source of Truth)
~/.gemini/config/skills/slice-orchestration-governor/
  ├── SKILL.md            (loaded directly by Antigravity in EVERY project)
  ├── VERSION             (single version truth — never duplicated in projects)
  └── scripts/            (agybot.mjs, antigravity-hook.mjs, slice-governor.mjs,
                           secret-scan.mjs, design-lint.mjs, q.mjs, install.mjs)
        ▲
        │ (runtime forwarding via portable scripts in .slices/, NOT .agents/skills/)
        │
PROJECT CONTROL PLANE (Project State Only)
<project>/
  ├── .agents/hooks.json        (managed key: agybot-v8 -> node .slices/agy-hook.mjs <event>)
  ├── .slices/
  │     ├── SLICE_GOVERNOR.json (onboarding choices, tracking config, policies preserved!)
  │     ├── agy-hook.mjs        (12-line portable forwarder -> ~/.gemini/config/skills/.../antigravity-hook.mjs)
  │     ├── agybot.mjs          (12-line portable forwarder -> ~/.gemini/config/skills/.../agybot.mjs)
  │     ├── slice-governor.mjs  (12-line portable forwarder -> ~/.gemini/config/skills/.../slice-governor.mjs)
  │     ├── PROJECT_BINDING.json
  │     └── TODO.md / CHANGELOG.md / workstreams/
  ├── .agy-vault/               (or configured global vault)
  └── AGENTS.md                 (project constitution + compact AGYBOT_BOOTSTRAP block)
```

## Rules
1. **Zero skill duplication inside `.agents/skills/`:** upgrading `~/.gemini/config/skills/slice-orchestration-governor` immediately upgrades every bound project on the next turn with zero per-project edits.
2. **Legacy cleanup during bind (`install.mjs --bind-project`):** if `<project>/.agents/skills/slice-orchestration-governor` still exists (legacy full copy or v7 shim), move it safely outside skill discovery to `<project>/.agy-backups/skills/slice-orchestration-governor-legacy-<timestamp>` without touching `.slices`, Vault, or project rules.
3. **Cross-platform hooks:** `.slices/agy-hook.mjs` resolves `AGY_GOVERNOR_GLOBAL_PATH` or `os.homedir()/.gemini/config/skills/slice-orchestration-governor` dynamically so `.agents/hooks.json` never hardcodes a machine-specific username path.
4. **Batch discipline:** never pin Governor versions inside product batches; reference `slice-orchestration-governor` generically.
