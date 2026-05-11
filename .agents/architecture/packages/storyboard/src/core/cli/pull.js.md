# `packages/storyboard/src/core/cli/pull.js`

<!--
source: packages/storyboard/src/core/cli/pull.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard pull` — pulls latest changes from the remote branch with an untracked-safe stash/rebase/unstash flow. Mirrors [`publish.js`](./publish.js.md) but without the push step.

## Composition

Sequential flow (executed at module top-level):

1. **Stash** uncommitted + untracked files if `hasUncommittedChanges`
2. **Pull --rebase** from `origin/<branch>`; on conflict: abort rebase, restore stash, print instructions, exit 1
3. **Restore stash** on success

## Dependencies

- [`dev-helpers.js`](./dev-helpers.js.md) — `hasUncommittedChanges`
- [`intro.js`](./intro.js.md) — `dim`, `green`, `bold`
- `../worktree/port.js` — `detectWorktreeName`, `worktreeDir`, `repoRoot`
- `@clack/prompts`, `child_process`

## Dependents

- [`index.js`](./index.js.md) — dispatches `pull` command here

## Notes

Identical stash-by-SHA pattern as [`publish.js`](./publish.js.md) to safely re-apply the exact stash entry.
