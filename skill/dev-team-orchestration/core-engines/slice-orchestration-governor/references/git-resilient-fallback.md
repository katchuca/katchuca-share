# Git Resilient Fallback Engine — v4.0

## Deterministic Workspace Tracking Without Git Dependency

In environments where `git.exe` is not installed on PATH or the workspace is not a Git repository, the governor does NOT crash or abort with `ENOENT`. It engages the **Node.js Pure Tree-Hash Fallback Engine**.

---

## Architecture of the Fallback Engine

When `gitAvailable()` returns `false`:

1. **Worktree Baseline**:
   - Performs a recursive filesystem walk of the project directory (excluding `.git`, `node_modules`, `.slices`, `dist`, `build`, `.next`, `coverage`).
   - Computes deterministic SHA-256 hashes for all project files.
   - Computes a global manifest hash representing the exact workspace state.
   - Records `applicability: "NODE_FS_FALLBACK"`.

2. **Branch & HEAD Representation**:
   - `currentBranch()` -> returns `"local-workspace"`
   - `headSha()` -> returns the SHA-256 hash of the complete file manifest.

3. **Change Detection**:
   - Compares the current workspace state against the baseline file manifest.
   - Identifies created, modified, and deleted files with byte counts and line changes.

4. **Exclusions**:
   - `.slices/` artifacts are kept out of tracking via native file-system ignore checks.

5. **Commit Policy Under Fallback**:
   - `commitPolicy` defaults to `FORBIDDEN_FOR_AGENT` when Git is not available.
   - Closure uses the cryptographic `closureFingerprint` bound to the source fingerprint and contract fingerprint.
