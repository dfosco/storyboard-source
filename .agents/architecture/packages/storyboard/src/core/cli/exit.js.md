# `packages/storyboard/src/core/cli/exit.js`

<!--
source: packages/storyboard/src/core/cli/exit.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard exit` — stops all running dev servers and the Caddy proxy in a single command. Iterates the server registry, SIGTERMs each PID, unregisters it, then stops Caddy via the admin API (`POST /stop`). No flags required.

## Composition

Sequential two-step flow executed at module top-level (no `main()` function):

1. **Stop dev servers** — `list()` from `../worktree/serverRegistry.js`; `process.kill(pid, 'SIGTERM')` each; `unregister` each entry.
2. **Stop Caddy proxy** — `isCaddyRunning()` then `stopCaddy()` from [`proxy.js`](./proxy.js.md). Reports if proxy was already stopped.

## Dependencies

- `../worktree/serverRegistry.js` — `list`, `unregister`
- [`proxy.js`](./proxy.js.md) — `isCaddyRunning`, `stopCaddy`
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — dispatches `exit` command here

## Notes

Errors from `process.kill` (e.g. already-dead process) are silently swallowed — the registry is always cleaned up regardless. The `stopCaddy` compat shim in [`proxy.js`](./proxy.js.md) uses `curl -X POST localhost:2019/stop`.
