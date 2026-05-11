# `packages/storyboard/src/core/worktree/serverRegistry.js`
<!--
source: packages/storyboard/src/core/worktree/serverRegistry.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Maintains `.storyboard/servers.json` — a shared file that records all currently running dev-server processes (one per worktree). Every server registers its PID, port, and worktree name on startup and unregisters on shutdown. The registry auto-prunes dead entries on every read (using `process.kill(pid, 0)` to check liveness), so stale records from crashed processes never accumulate. This lets the storyboard CLI and other tools discover which worktrees have live servers and what port they are bound to.

## Composition

```js
// .storyboard/servers.json: { servers: { [id]: { id, worktree, pid, port, background, startedAt } } }

export function registryPath(cwd) { /* .storyboard/servers.json */ }
export function generateId()      { /* 6-char hex, e.g. "a3f7c2" */ }

export function prune(cwd)        { /* remove entries with dead PIDs */ }
export function register({ id, worktree, pid, port, background }, cwd) { ... }
export function unregister(id, cwd) { ... }
export function list(cwd)            { /* prune + return array of entries */ }
export function findByWorktree(name, cwd) { /* list().filter(s => s.worktree === name) */ }
export function findById(id, cwd)    { ... }
```

Writes are atomic: data is written to `.storyboard/servers.json.tmp` then renamed to avoid partial reads.

## Dependencies

- `node:crypto` — `randomBytes` for ID generation
- `node:fs`
- `node:path`
- [`./port.js`](./port.js.md) — `repoRoot()` for registry file path resolution

## Dependents

- [`./port.js`](./port.js.md) — `findByWorktree()` in `resolveRunningPort()`
- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md) — `list()` for the worktrees API endpoint
- `packages/storyboard` CLI — `register()` on dev server start, `unregister()` on shutdown

## Notes

- `background: true` marks servers started as background processes (e.g. pre-warmed sessions) vs interactive dev servers.
- The file is stored in `.storyboard/` (git-ignored) rather than `worktrees/` so it persists across worktree creation/deletion.
- `prune()` is called on every read, not just periodically — this means even a single `list()` call is self-healing if servers have crashed.
