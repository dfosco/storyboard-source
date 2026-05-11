# `packages/storyboard/src/core/cli/dev.legacy.js`

<!--
source: packages/storyboard/src/core/cli/dev.legacy.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The legacy `storyboard dev` implementation using the per-repo server model. Kept for reference only — the active implementation is [`dev.js`](./dev.js.md). In this model each repo runs its own HTTP server (`../server/index.js`) and owns its Caddy routes via direct Caddyfile writes or admin API calls.

## Composition

Two execution modes determined by a server health check at startup:

- **Owner mode** — starts the HTTP server + Vite in the foreground, registers the Caddy route, pipes stdout/stderr. Owns the process lifecycle until Ctrl+C.
- **Client mode** — an existing server is already running for this repo; asks it to spawn Vite for the requested branch via `POST /_storyboard/switch-branch`, prints the URL, and exits.

Also includes the same worktree resolution logic as [`dev.js`](./dev.js.md) (shared via [`dev-helpers.js`](./dev-helpers.js.md)) and canvas JSONL compaction.

## Dependencies

- [`proxy.legacy.js`](./proxy.legacy.js.md) — `generateCaddyfile`, `generateRouteConfig`, `upsertCaddyRoute`, `isCaddyRunning`, `readDevDomain`
- [`flags.js`](./flags.js.md), [`dev-helpers.js`](./dev-helpers.js.md)
- `../worktree/port.js`, `../server/index.js`, `../canvas/compact.js`
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — previously dispatched `dev` here; now dispatches to `dev.js`

## Notes

**Reference only.** The per-repo server model creates a destructive cross-repo `caddy reload` race (RCA hypothesis H2). The runtime daemon model in [`dev.js`](./dev.js.md) is the sole writer to Caddy's admin API (`localhost:2019`), eliminating the race.
