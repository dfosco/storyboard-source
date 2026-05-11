# `packages/storyboard/src/core/worktree/port.js`
<!--
source: packages/storyboard/src/core/worktree/port.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Manages the `worktrees/ports.json` registry that assigns unique dev-server ports to each git worktree. `main` always gets port 1234; additional worktrees are assigned 1235, 1236, etc. Handles port conflict detection (via `lsof`) and reassignment. Also provides helpers for worktree name detection, slugification, and directory resolution.

## Composition

```js
const BASE_PORT = 1234

// Returns absolute path to worktrees/ports.json (works from repo root OR inside a worktree dir)
export function portsFilePath(cwd) { ... }

// Detect the current worktree name from git top-level path
// Returns 'main' when not inside a worktrees/<name>/ dir
export function detectWorktreeName() { ... }

// Get (or assign) a port for a worktree name. Handles stolen ports via lsof.
export function getPort(worktreeName) { ... }

// Release a port assignment (removes entry from ports.json)
export function releasePort(worktreeName) { ... }

// Resolve port for a running server — checks serverRegistry first, then ports.json
export function resolveRunningPort(worktreeName) { ... }

// Read port from ports.json without assigning a new one
export function resolvePort(worktreeName) { ... }

// Slugify branch name for filesystem/subdomain safety
export function slugify(name) { ... }

// Resolve repo root (handles cwd inside worktrees/<name>/)
export function repoRoot(cwd) { ... }

// Resolve full path to a worktree directory (checks both worktrees/ and .worktrees/)
export function worktreeDir(name, cwd) { ... }

// List existing worktree directory names from worktrees/ and .worktrees/
export function listWorktrees(cwd) { ... }
```

## Dependencies

- `node:fs`, `node:path`, `child_process` — `execSync` for git and lsof
- [`./serverRegistry.js`](./serverRegistry.js.md) — `findByWorktree()` for live port lookup

## Dependents

- [`./serverRegistry.js`](./serverRegistry.js.md) — `repoRoot()` for registry file path
- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md) — indirectly via serverRegistry
- `packages/storyboard` CLI (`bin/storyboard.js`) — `getPort`, `detectWorktreeName`, `worktreeDir`, `listWorktrees`
- `packages/storyboard/src/core/worktree/port.test.js` — unit tests

## Notes

- `isPortInUse` is skipped in `NODE_ENV=test` to avoid flakiness from real system state.
- `worktreeDir` supports both `worktrees/<name>` (current convention) and `.worktrees/<name>` (legacy) for backwards compatibility.
- `resolveRunningPort` prefers the live port from `serverRegistry` (which reflects the actual bound port Vite chose) over the statically assigned port in `ports.json` — important when Vite rebinds to a different port on conflict.
