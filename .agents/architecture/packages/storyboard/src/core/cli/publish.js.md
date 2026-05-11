# `packages/storyboard/src/core/cli/publish.js`

<!--
source: packages/storyboard/src/core/cli/publish.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard publish` — pushes local commits to the remote branch with an untracked-safe stash/rebase/push/unstash flow. Deterministic: no AI, no interactive prompts during the push sequence. Designed for use inside agent sessions where the working tree may have uncommitted prototype data.

## Composition

Sequential flow (executed at module top-level):

1. **Stash** uncommitted + untracked files (`git stash push -u`) if `hasUncommittedChanges`
2. **Pull --rebase** from `origin/<branch>`; on conflict: abort rebase, restore stash, print manual resolution instructions, exit 1
3. **Push** to `origin/<branch>`; on failure: restore stash, print manual instructions, exit 1
4. **Restore stash** (`git stash apply <sha>`) — reports conflicts if apply fails

Uses `@clack/prompts` spinners for the pull and push steps.

## Dependencies

- [`dev-helpers.js`](./dev-helpers.js.md) — `hasUncommittedChanges`
- [`intro.js`](./intro.js.md) — `dim`, `green`, `bold`
- `../worktree/port.js` — `detectWorktreeName`, `worktreeDir`, `repoRoot`
- `@clack/prompts`, `child_process`

## Dependents

- [`index.js`](./index.js.md) — dispatches `publish` command here

## Notes

Stash SHA is captured via `git stash list --format=%H -1` immediately after stashing, so the exact entry is re-applied even if other stashes accumulate during the operation.
