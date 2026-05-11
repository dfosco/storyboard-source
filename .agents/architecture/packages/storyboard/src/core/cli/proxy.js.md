# `packages/storyboard/src/core/cli/proxy.js`

<!--
source: packages/storyboard/src/core/cli/proxy.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard proxy [start|state|close|restart]` — manages the Caddy reverse proxy via the Storyboard Runtime daemon. The runtime daemon is the **sole writer** to `localhost:2019` (the Caddy admin API), eliminating the destructive cross-repo `caddy reload` race that was RCA hypothesis H2. This file also re-exports legacy-compat shims so callers of the old [`proxy.legacy.js`](./proxy.legacy.js.md) API don't break.

## Composition

### Subcommands

| Subcommand | Action |
|---|---|
| `start` (default) | Ensure Caddy is running; boot RuntimeClient (auto-spawns daemon if needed) |
| `state` | Print runtime's view of active routes via `RuntimeClient.proxyState()` |
| `close` / `stop` | SIGTERM the runtime PID from `~/.storyboard/runtime.pid`; stop Caddy |
| `restart` | SIGTERM daemon; re-acquire via RuntimeClient |

### Compat re-exports (deprecated shims)

`readDevDomain`, `generateCaddyfile`, `generateRouteConfig`, `upsertCaddyRoute`, `reloadCaddy`, `startCaddy`, `stopCaddy`, `findStaleRouteIndices` — callers receive console warnings that the runtime now owns Caddy.

### `startCaddyEmpty()`

Workaround for Caddy v2.11+ stdin-read corruption: writes a minimal Caddyfile to a temp directory and passes the path to `caddy start --config`.

## Dependencies

- `../../../dist/runtime/client/index.js` — RuntimeClient (lazy import for `state` / `restart`)
- Node.js `fs`, `child_process`, `os`, `path`

## Dependents

- [`setup.js`](./setup.js.md), [`run.js`](./run.js.md), [`exit.js`](./exit.js.md) — import `isCaddyInstalled`, `isCaddyRunning`, `startCaddy`, `stopCaddy`
- [`dev.legacy.js`](./dev.legacy.js.md), [`server.js`](./server.js.md) — import legacy Caddyfile functions

## Notes

The legacy shim functions (`generateCaddyfile`, `upsertCaddyRoute`, etc.) print deprecation warnings. New code should call RuntimeClient directly.
