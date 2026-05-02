# Plan: Rethink `storyboard branch` command

## Problem

The current `storyboard branch` command (in `packages/core/src/cli/branch.js`) handles the simple case — create a new worktree or inform the user if it already exists — but doesn't handle the "switch to existing worktree" workflow properly. When a worktree already exists, it just prints `cd` instructions and exits. It doesn't:

- Stash work in the current worktree
- Ensure the target worktree is on the correct branch
- Handle branch mismatches in the target worktree
- Apply stashes after switching
- Support a non-interactive `--worktree=<name>` flag

## Approach

Rewrite `branch.js` to handle the full "switch context" workflow — both interactive (Clack TUI) and non-interactive (flags). The existing file already has the correct scaffolding (Clack prompts, git helpers, etc.) — it just needs the "worktree already exists" path expanded.

## Key Design Decisions

1. **Stash naming**: `from-{currentBranch}-to-{target}-{timestamp}` (as specified)
2. **Non-interactive mode**: `npx storyboard branch --worktree=<name>` runs the same logic without prompts
3. **Branch mismatch handling**: If the target worktree is on the wrong branch, stash its changes, switch, then apply the original stash
4. **Both modes share the same core logic** — the Clack TUI calls the same functions as the flagged version

## File Changes

### Modified: `packages/core/src/cli/branch.js`
- Add `--worktree` flag support via `parseFlags`
- Expand the "worktree already exists" path (currently lines 102-115) to:
  1. Stash changes in the **source** worktree (current cwd)
  2. Check if target worktree is on the expected branch
  3. If branch mismatch: stash target's changes → switch branch → apply stash
  4. Apply the source stash in the target worktree
  5. Print summary with status of each step

### Core Logic (shared by TUI and non-interactive)

```
async function switchToWorktree(targetBranch, { interactive = true } = {})
```

#### Flow for EXISTING worktree:

1. **Stash source changes** — if the current worktree has uncommitted changes:
   - `git stash push -m "from-{fromBranch}-to-{targetBranch}-{timestamp}"` in source dir
   - Track `didStashSource = true`

2. **Navigate to target** — resolve `worktreeDir(targetBranch)`

3. **Ensure correct branch** — check `git branch --show-current` in target dir:
   - If it matches `targetBranch` → skip
   - If mismatch:
     a. Check for uncommitted changes in target
     b. If dirty: `git stash push -m "from-{targetCurrentBranch}-to-{targetBranch}-{timestamp}"` in target dir, track `didStashTarget = true`
     c. `git checkout {targetBranch}` in target dir
     d. If `didStashTarget`: `git stash apply` in target dir

4. **Apply source stash** — if `didStashSource`:
   - `git stash apply` in target dir
   - If conflicts: warn user, point to `git stash list`

5. **Summary** — print what happened at each step

#### Flow for NEW worktree:

Same as current logic but with the stash-source step prepended (steps 3-6 of current `branch.js` are kept as-is, just with the source stash added before).

### Non-interactive mode

When `--worktree=<name>` is provided:
- Skip the Clack `p.text()` prompt
- Use `console.log` instead of `p.log.*` for output (or keep Clack — it works fine non-interactively)
- All git operations are identical
- Exit codes: 0 success, 1 failure

## Todos

1. **refactor-branch-core** — Extract shared `switchToWorktree()` logic from the interactive flow
2. **existing-worktree-flow** — Implement the stash → navigate → ensure-branch → apply-stash flow for existing worktrees
3. **non-interactive-flag** — Add `--worktree` flag parsing and non-interactive entry point
4. **user-messaging** — Ensure all steps inform the user (both TUI and non-interactive)
5. **test-manually** — Test both interactive and `--worktree=<name>` paths

## Notes

- `@clack/prompts` is already a dependency in the 4.2.7 CLI
- `parseFlags` from `./flags.js` handles `--key=value` syntax
- `dev-helpers.js` already has `hasUncommittedChanges()` and `localBranchExists()`
- `worktree/port.js` has `repoRoot()`, `worktreeDir()`, `listWorktrees()`, `detectWorktreeName()`
- The current `branch.js` does stashing for NEW worktrees already — we're extending that to EXISTING worktrees
