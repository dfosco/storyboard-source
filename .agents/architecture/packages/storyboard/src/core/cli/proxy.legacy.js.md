# `packages/storyboard/src/core/cli/proxy.legacy.js`

<!--
source: packages/storyboard/src/core/cli/proxy.legacy.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The legacy Caddy proxy implementation that writes Caddyfiles directly and uses the admin API without runtime-daemon mediation. **Reference only** — the active implementation is [`proxy.js`](./proxy.js.md) which routes all mutations through the runtime daemon.

## Composition

### Key exports

| Export | Purpose |
|---|---|
| `readDevDomain(cwd?)` | Reads `devDomain` from `storyboard.config.json` |
| `generateCaddyfile(portOverrides?)` | Writes a Caddyfile based on live server registry + overrides |
| `generateRouteConfig(portOverrides?)` | Builds a Caddy JSON route object tagged with `@id` |
| `upsertCaddyRoute(routeConfig)` | PATCH/POST the route to Caddy admin API; cleans up stale un-`@id`-ed routes |
| `findStaleRouteIndices(routes, keepId, host)` | Identifies stale routes for cleanup (also tested in [`proxy.test.js`](./proxy.test.js.md)) |
| `isCaddyInstalled`, `isCaddyRunning`, `reloadCaddy`, `startCaddy`, `stopCaddy` | Caddy lifecycle helpers |

`livePortMap` builds the branch→port map from running servers in the registry, avoiding stale routes from reused ports.

## Dependencies

- `../worktree/port.js` — `portsFilePath`
- `../worktree/serverRegistry.js` — `list`
- Node.js `fs`, `child_process`, `path`

## Dependents

- [`proxy.js`](./proxy.js.md) — re-exports selected functions as compat shims

## Notes

The `upsertCaddyRoute` / Caddyfile reload model creates a race condition when multiple repos are running simultaneously — each repo's `caddy reload` overwrites the other's routes. The runtime daemon model in [`proxy.js`](./proxy.js.md) fixes this.
