# `packages/storyboard/src/core/vite/server-plugin.js`
<!--
source: packages/storyboard/src/core/vite/server-plugin.js
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

The always-on Vite server plugin that mounts the entire storyboard middleware backbone at `/_storyboard/`. It is the single integration point where all server-side capabilities (canvas CRUD, autosync, messaging bus, terminal sessions, hot pool, workshop features, docs, worktrees API) are wired up and exposed to the browser.

The plugin also manages the **HMR reload guard** — a WebSocket interceptor that prevents Vite's full-reload and module-update messages from disrupting canvas editing sessions. Two guard channels are managed: canvas pages (default: guard ON) and prototype pages (default: guard OFF). Both channels use a heartbeat + TTL model so closed tabs never leave guards permanently engaged.

## Composition

```
vite.config.js
  └─ storyboardServer()           ← exported default (no-arg factory)
       ├─ configResolved()         reads storyboard.config.json via readConfig()
       └─ configureServer(server)
            ├─ Reload guard        intercepts server.ws.send for full-reload / update payloads
            │    ├─ canvas guard   heartbeat from storyboard:canvas-hmr-guard event
            │    └─ prototype guard heartbeat from storyboard:prototype-reload-guard event
            ├─ Dev logger          createDevLogger() + setDevLogger() for structured o11y
            ├─ Workshop routes     enabled features from storyboard.config.json → workshopFeatures registry
            ├─ Docs routes         docsHandler() → GET /readme, /source, /files, /repo
            ├─ Canvas routes       createCanvasHandler() + setupSelectedWidgets()
            ├─ Terminal server     setupTerminalServer() (WebSocket PTY)
            ├─ Hot pool            HotPoolManager (pre-warmed agent sessions)
            ├─ Autosync routes     createAutosyncHandler()
            ├─ Messaging bus       initBus() + initPresence() + initDeliveryBridge() + createMessagingRoutes()
            ├─ Hub maintenance     startMaintenance() (conversation timeout cleanup)
            ├─ Artifact routes     createArtifactRoutes()
            ├─ Terminal API        sessions CRUD + hot-pool routes
            ├─ Worktrees API       lists running servers from serverRegistry
            ├─ Git-user API        git config + gh auth for current user identity
            └─ Main middleware      routes requests by first segment of /_storyboard/<route>/
```

Route dispatch via `routeHandlers` map (keyed by first URL segment). The middleware strips `/_storyboard/<segment>/`, parses the JSON body, and dispatches to the matching handler. Unknown routes return `404`.

```js
// Main request handler (mounted via server.middlewares.use)
server.middlewares.use(async (req, res, next) => {
  if (!req.url.startsWith(API_PREFIX)) return next()
  const segment = req.url.slice(API_PREFIX.length).split('/')[0]  // e.g. 'canvas'
  const handler = routeHandlers.get(segment)
  if (!handler) return next()
  const body = await parseJsonBody(req)
  const ctx = { method: req.method, path: '/' + rest, body }
  await handler(req, res, ctx)
})
```

## Dependencies

- [`./docs-handler.js`](./docs-handler.js.md) — docs API
- [`../autosync/server.js`](../autosync/server.js.md) — autosync API
- [`../worktree/serverRegistry.js`](../worktree/serverRegistry.js.md) — worktrees list
- `../canvas/server.js` — canvas CRUD
- `../canvas/hot-pool.js` — pre-warmed session pool
- `../canvas/terminal-server.js` — WebSocket PTY
- `../messaging/bus.js`, `../messaging/routes.js`, `../messaging/presence.js`, `../messaging/delivery.js`
- `../messaging/hub-manager.js`, `../messaging/hub-maintenance.js`
- `../artifact/routes.js`
- `../workshop/features/registry-server.js` — optional workshop features
- `../logger/devLogger.js`
- `../stores/configSchema.js`
- `jsonc-parser` — JSONC config parsing

## Dependents

- Consumer `vite.config.js` — `import storyboardServer from '@dfosco/storyboard/vite/server'`
- `packages/storyboard/src/internals/vite/data-plugin.js` — the other always-on Vite plugin (handles data files)

## Notes

- `storyboard.watcher.unwatch()` is called for `assets/canvas/images`, `assets/canvas/snapshots`, `.storyboard/messages`, and terminal snapshots to prevent image/snapshot writes from triggering Vite reloads.
- The canvas reload guard uses a 1500ms mutation window: if a `.canvas.jsonl` file changes and a `full-reload` is broadcast within 1.5s, the reload is suppressed entirely (canvas uses soft-invalidate instead).
- Browser console errors forwarded via `storyboard:client-error` HMR events are logged to the dev logger (structured o11y).
- Branch switching is proxied to the storyboard runtime server on port `4100 + hash(devDomain) % 100` — this port formula is shared with the runtime server that manages worktree lifecycle.
