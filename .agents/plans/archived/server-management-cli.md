# Server Management CLI — Implementation Plan

## Problem

Dev servers started via `storyboard dev` get "swallowed" when running multiple worktree servers — they can't be stopped individually. The only recovery is killing Caddy entirely.

## Approach

Integrate a **persistent server registry** (`.storyboard/servers.json`) into the existing storyboard server architecture (4.2.0). Extend `storyboard server` with lifecycle subcommands.

## What was done

### New file: `packages/core/src/worktree/serverRegistry.js`
- Registry CRUD with PID pruning, unique hex IDs, atomic writes
- Imports `repoRoot` from existing `port.js` (no duplication)

### Modified: `packages/core/src/server/index.js`
- `spawnVite()` now calls `register()` on spawn, `unregister()` on exit
- Each Vite entry gets a `serverId` field

### Modified: `packages/core/src/cli/server.js`
- Extended with subcommands: `list`, `start`, `stop`, `stop-proxy`
- Legacy `storyboard server <branch>` still works (falls through to `start`)
- `--multiple` flag to allow duplicate worktree servers
- `--background/--bg` flag support

### Modified: `packages/core/src/cli/proxy.js`
- Added `stopCaddy()` via Caddy admin API (no sudo)

### Modified: `packages/core/src/cli/exit.js`
- Uses registry instead of `ps aux` grep
- Uses `stopCaddy()` admin API instead of `sudo caddy stop`

### Modified: `packages/core/src/cli/index.js`
- Updated help screen with new server subcommands
