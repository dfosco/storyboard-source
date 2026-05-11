# `packages/storyboard/src/core/worktree/port.test.js`
<!--
source: packages/storyboard/src/core/worktree/port.test.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Unit tests for `port.js`. Covers `getPort` (main always 1234, first worktree gets 1235, port conflict reassignment), `releasePort`, `resolvePort`, `resolveRunningPort`, `detectWorktreeName` (from git top-level pattern matching), `slugify`, `repoRoot`, `worktreeDir`, and `listWorktrees`.

## Composition

Standard Vitest test file. Uses `vi.mock('node:fs')` and `vi.mock('child_process')` to control file state and git output without touching disk or running processes.

## Dependencies

- `vitest`
- [`./port.js`](./port.js.md)

## Dependents

None (test file).

## Notes

- `isPortInUse` is bypassed automatically in tests (`NODE_ENV=test`), so no lsof mocking is needed.
- `detectWorktreeName` tests exercise the regex matching against different fake `git rev-parse --show-toplevel` outputs (`/worktrees/fix-bug`, `/.worktrees/my-feature`, repo root).
