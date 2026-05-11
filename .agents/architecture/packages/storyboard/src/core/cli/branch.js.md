# `packages/storyboard/src/core/cli/branch.js`

<!--
source: packages/storyboard/src/core/cli/branch.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard branch` — a deterministic, AI-free interactive guide for switching between git worktrees. It safely stashes uncommitted changes, switches (or creates) the target worktree, and re-applies the stash in the new context.

## Composition

Flow: ask for branch name (or read `--worktree` flag) → stash source changes → create worktree if new (git worktree add + npm install + git pull --rebase) → apply stash in target → confirm.

Key helpers:
- `isValidBranchName(name)` — validates git naming rules
- `stashChanges(cwd, message)` — named stash with timestamp
- `applyStash(cwd, sha)` — `git stash apply <sha>`
- `createWorktree(name, root)` — `git worktree add` + install

Accepts `--cd` flag to output a shell-evaluable `cd <path>` for use with `eval $(storyboard branch --cd)`.

## Dependencies

- [`flags.js`](./flags.js.md) — `parseFlags`
- [`dev-helpers.js`](./dev-helpers.js.md) — `hasUncommittedChanges`, `localBranchExists`
- [`intro.js`](./intro.js.md) — ANSI helpers
- `../worktree/port.js` — `repoRoot`, `worktreeDir`, `listWorktrees`
- `@clack/prompts` — interactive branch selection

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'branch'`). Also re-used as a post-setup flow from [`setup.js`](./setup.js.md).
