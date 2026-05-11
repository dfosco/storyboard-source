# `packages/storyboard/src/core/cli/dev-helpers.js`

<!--
source: packages/storyboard/src/core/cli/dev-helpers.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Pure git utility functions extracted from the dev CLI for testability. Has zero side effects on import — every function receives a `cwd` argument and calls `execFileSync` internally. Consumed by [`dev.js`](./dev.js.md), [`dev.legacy.js`](./dev.legacy.js.md), [`publish.js`](./publish.js.md), and [`pull.js`](./pull.js.md).

## Composition

### Exports

| Function | Purpose |
|---|---|
| `hasUncommittedChanges(cwd)` | Returns `true` if git working tree has staged or unstaged changes |
| `localBranchExists(name, cwd)` | Returns `true` if the named branch exists locally |
| `resolveDefaultBranch(cwd)` | Returns `'main'`, `'master'`, origin/HEAD target, or `null` |

`resolveDefaultBranch` first verifies the path is inside a git repo (`git rev-parse --git-dir`), then tries `main` and `master` via `localBranchExists`, then falls back to `git symbolic-ref refs/remotes/origin/HEAD`.

## Dependencies

- Node.js `child_process` (`execFileSync`)

## Dependents

- [`dev.js`](./dev.js.md) — worktree conversion flow
- [`dev.legacy.js`](./dev.legacy.js.md) — same worktree resolution logic
- [`publish.js`](./publish.js.md) — checks for uncommitted changes before stash
- [`pull.js`](./pull.js.md) — same guard
- [`dev-helpers.test.js`](./dev-helpers.test.js.md) — integration tests

## Notes

All three functions swallow errors and return safe defaults (`false` / `null`) so callers never need try/catch.
