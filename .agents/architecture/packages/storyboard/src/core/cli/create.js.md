# `packages/storyboard/src/core/cli/create.js`

<!--
source: packages/storyboard/src/core/cli/create.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard create` — an interactive wizard and non-interactive factory for prototypes, canvases, flows, pages, and components. Supports both fully non-interactive (all flags provided) and partially interactive (prompts only for missing fields) modes.

## Composition

Top-level dispatch picks a creation type via interactive picker or from `process.argv[3]`. Each type handler (e.g. `createPrototype`, `createCanvas`) uses flag schemas from [`schemas.js`](./schemas.js.md) and [`parseFlags`](./flags.js.md) to validate input, then POSTs to the appropriate server endpoint.

```bash
storyboard create prototype --name my-app --title "My App"  # non-interactive
storyboard create canvas                                     # full interactive
storyboard create page --prototype my-app --path settings   # partial
```

Also exports `ensureDevServer(opts)`, `serverPost(path, body)`, and `getServerUrl()` which are re-used by [`canvasAdd.js`](./canvasAdd.js.md), [`canvasBatch.js`](./canvasBatch.js.md), and [`canvasBroadcast.js`](./canvasBroadcast.js.md).

`ensureDevServer` has multi-path resolution: tries `$STORYBOARD_SERVER_URL`, then Caddy proxy URL, then direct port (via `resolveRunningPort`).

## Dependencies

- [`flags.js`](./flags.js.md) — `parseFlags`, `hasFlags`, `formatFlagHelp`
- [`schemas.js`](./schemas.js.md) — creation flag schemas
- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl`
- `../worktree/port.js` — port detection
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'create'`). `ensureDevServer` / `serverPost` / `getServerUrl` re-exported for [`canvasAdd.js`](./canvasAdd.js.md), [`canvasBatch.js`](./canvasBatch.js.md), [`canvasBroadcast.js`](./canvasBroadcast.js.md).
