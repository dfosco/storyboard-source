# `packages/storyboard/src/core/cli/code.js`

<!--
source: packages/storyboard/src/core/cli/code.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard code [branch]` — opens a git worktree in VS Code by running `code <dir>`. With no argument it opens the current worktree; with `main` it opens the repo root; with a branch name it opens `worktrees/<branch>/`.

## Composition

Detects the current worktree via `detectWorktreeName()` from `../worktree/port.js`. Uses `execFileSync('code', [dir])` and prints a clear error if the `code` CLI isn't installed, with instructions to install it via VS Code's shell command palette.

```bash
storyboard code              # open current worktree
storyboard code main         # open repo root
storyboard code feature-xyz  # open worktrees/feature-xyz/
```

## Dependencies

- `../worktree/port.js` — `detectWorktreeName`, `repoRoot`, `worktreeDir`, `listWorktrees`
- `@clack/prompts`, `child_process`, `fs`, `path`

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'code'`).
