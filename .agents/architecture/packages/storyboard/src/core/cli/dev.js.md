# `packages/storyboard/src/core/cli/dev.js`

<!--
source: packages/storyboard/src/core/cli/dev.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The active `storyboard dev [branch]` implementation. A thin client of the Storyboard Runtime daemon (`~/.storyboard/runtime.lock`): resolves the target worktree, reads `devDomain` from the repo root's `storyboard.config.json`, POSTs `/devserver/acquire` to the runtime (auto-spawning the daemon if needed), prints the canonical proxy URL, holds a lease until SIGINT, then releases. Supersedes [`dev.legacy.js`](./dev.legacy.js.md) (per-repo server model).

## Composition

### Key functions

| Function | Purpose |
|---|---|
| `readDevDomain(targetCwd)` | Reads `devDomain` from **repo root** only — never from worktree copy |
| `devDomainIsExplicit(targetCwd)` | Checks `hasOwnProperty` so the literal `'storyboard'` domain is allowed for the canonical repo |
| `resolveDevTarget(branchArg, opts)` | Worktree resolution: no-arg auto-detect, explicit branch, or interactive creation |
| `main()` | Full flow: parse flags → resolve target → compact canvases → acquire lease → renew periodically → release on SIGINT |

Compacts bloated `.canvas.jsonl` files via `compactAll` before requesting Vite, then sets a 15-minute repeat interval.

### Flags

`--port`, `--create` / `--no-create`, `--ttl` (lease duration, default 1h)

## Dependencies

- [`flags.js`](./flags.js.md) — flag parsing
- [`dev-helpers.js`](./dev-helpers.js.md) — git utilities
- `../worktree/port.js` — worktree detection + port management
- `../rename-watcher/watcher.js` — file rename watcher
- `../canvas/compact.js` — canvas JSONL compaction
- `../../../dist/runtime/client/index.js` — RuntimeClient (lazy import)
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — dispatches `dev` command here
- [`run.js`](./run.js.md) — imports this file after starting Caddy

## Notes

`readDevDomain` reads from the **repo root only** (never the worktree's own `storyboard.config.json` copy) to prevent experimental branches from silently pinning a different devDomain. RuntimeClient is imported lazily so the CLI doesn't fail during scaffold when `dist/runtime/` may not be built yet.
