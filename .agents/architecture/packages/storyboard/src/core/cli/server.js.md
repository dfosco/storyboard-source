# `packages/storyboard/src/core/cli/server.js`

<!--
source: packages/storyboard/src/core/cli/server.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard server [list|start|stop]` — dev server lifecycle management for the legacy per-repo server model. Lists running servers, starts a persistent HTTP server + Vite for a worktree, or stops a server by worktree name or ID.

## Composition

### Subcommands

| Subcommand | Action |
|---|---|
| `list` (default) | Print running servers from registry with port, PID, proxy URL |
| `start [worktree]` | Start HTTP server + spawn Vite for the branch; prevents duplicates unless `--multiple` |
| `stop <target>` | Find by ID or worktree name, SIGTERM PID, unregister, release port |

Includes a legacy fallback: a bare `storyboard server <branch>` argument (no `list`/`start`/`stop`) is treated as `start <branch>` for backward compatibility.

### Flags

`--port`, `--background` / `--bg`, `--multiple`

## Dependencies

- `../server/index.js` — `startServer`, `SERVER_PORT`, `spawnViteForBranch`, `waitForPort`
- [`proxy.js`](./proxy.js.md) — `readDevDomain`, `generateRouteConfig`, `upsertCaddyRoute`, `isCaddyRunning`
- `../worktree/port.js` — `detectWorktreeName`, `releasePort`
- `../worktree/serverRegistry.js` — `list`, `findByWorktree`, `findById`, `unregister`
- [`flags.js`](./flags.js.md)
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — dispatches `server` command here

## Notes

Part of the legacy per-repo server model. The active dev flow uses [`dev.js`](./dev.js.md) + RuntimeClient instead.
