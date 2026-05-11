# `packages/storyboard/src/core/canvas/server.js`

<!--
source: packages/storyboard/src/core/canvas/server.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/server.js`](./server.js.md) is the route hub for the canvas dev server. It owns CRUD for `.canvas.jsonl` files, materializes append-only event streams into current state, assigns widget positions and connector anchors, scaffolds canvas/story files, manages uploaded canvas images, and synchronizes terminal/agent graph metadata with the live canvas topology.

It is also the orchestration point where several lower-level canvas subsystems meet. The module uses [`packages/storyboard/src/core/canvas/materializer.js`](./materializer.js.md) for replay, [`packages/storyboard/src/core/canvas/collision.js`](./collision.js.md) for placement and connector geometry, [`packages/storyboard/src/core/canvas/identity.js`](./identity.js.md) for canonical IDs, [`packages/storyboard/src/core/canvas/githubEmbeds.js`](./githubEmbeds.js.md) for GitHub URL enrichment, and the terminal stack ([`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md), [`packages/storyboard/src/core/canvas/terminal-server.js`](./terminal-server.js.md), [`packages/storyboard/src/core/canvas/terminal-registry.js`](./terminal-registry.js.md), [`packages/storyboard/src/core/canvas/hub-roles.js`](./hub-roles.js.md)) to make canvas graph edits immediately affect running agents.

## Composition

The top-of-file route inventory documents the public API mounted at `/_storyboard/canvas/`. The groups are:

- **Canvas read/list/folder metadata** — `GET /read`, `GET /list`, `GET /folders`, `GET /page-order`
- **Canvas content mutation** — `PUT /update`, `POST /widget`, `PATCH /widget`, `DELETE /widget`, `POST /connector`, `DELETE /connector`, `POST /batch`
- **Canvas organization** — `PUT /rename-page`, `PUT /reorder-pages`, `PUT /update-folder-meta`, `POST /create`
- **Story discovery/scaffolding** — `GET /stories`, `POST /create-story`
- **GitHub embeds** — `GET /github/available`, `POST /github/embed`
- **Canvas images** — `POST /image`, `GET /images/*`, `POST /image/toggle-private`
- **Terminal artifacts** — `GET /terminal-buffer/:id`, `GET /terminal-snapshot/:id`

The module begins with a set of filesystem and parsing helpers: folder metadata reads/writes, recursive canvas and story discovery, export-name extraction, path-to-ID resolution, and raw event append helpers.

```js
function findCanvasPath(root, canvasId) {
  const files = findCanvasFiles(root)
  for (const file of files) {
    const id = toCanvasId(file)
    if (id === canvasId) {
      return path.resolve(root, file)
    }
  }
  return null
}
```

The exported entrypoint is `createCanvasHandler(ctx)`, which closes over `root`, `sendJson`, and `hotPool` and returns the route handler.

```js
export function createCanvasHandler(ctx) {
  const { root, sendJson, hotPool } = ctx
```

Inside that handler, `computeNearPosition()` and `computeAutoPosition()` provide the widget placement policy. The auto-position priority chain is explicit in code: source widget → selected widget → viewport center → last widget → origin.

```js
async function computeAutoPosition(canvasWidgets, type, props, projectRoot, canvasName, sourceWidgetId) {
  if (sourceWidgetId && widgetMap.has(sourceWidgetId)) {
    return computeNearPosition(widgetMap.get(sourceWidgetId), 'right', type, props)
  }
  const { readSelectedWidgets } = await import('./selectedWidgets.js')
```

Hub computation is embedded server-side. `buildComponents()` derives connected components from the connector graph, and `computeHubRoleState()` assigns roles, unique-role enforcement, auto-leader bootstrap, peer lists, and hub token state:

```js
function computeHubRoleState(canvasName, widgets, connectors) {
  const roles = listHubRoles(root)
  const defaultRole = getDefaultRoleId(roles)
  const uniqueRoles = new Set(roles.filter((r) => r.type === 'unique').map((r) => r.id))
```

`updateTerminalConnectionsForCanvas()` is the most important bridge from structural canvas edits to live runtime state. It computes connected widgets, messaging permissions, hub memberships, role persistence, auto-broadcast defaults, and then writes those results into [`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md). It also syncs in-memory hub-manager state and can inject follow-up tmux messages into running agents.

```js
updateTerminalConnections({
  branch,
  canvasId: canvasName,
  widgetId: tw.id,
  connectedWidgets,
  widgetProps: tw.props || null,
  messaging,
  role,
  hubs,
})
```

File writes are guarded so the server can push a single authoritative HMR update without the Vite watcher echoing a duplicate event:

```js
function appendEvent(filePath, event) {
  markCanvasWrite(filePath)
  appendEventRaw(filePath, event)
  setTimeout(() => unmarkCanvasWrite(filePath), 1000)
}
```

`prepareTerminalWidget()` is the creation-time hook for terminal and agent widgets. It resolves default agent commands from `storyboard.config.json`, chooses display names, and pre-reserves terminal identity before the client connects.

```js
async function prepareTerminalWidget({ type, props, widgetId, canvasName, req }) {
  if (type === 'agent' && props.agentId && !props.startupCommand) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const agentCfg = config?.canvas?.agents?.[props.agentId]
```

The route implementation then dispatches request-by-request, handling materialized reads, incremental event appends, batch operations, image persistence, story scaffolding, GitHub embed fetching, and terminal snapshot/buffer reads. Widget and connector writes rely on serialized events rather than full-file rewrites, keeping canvas edits atomic and replayable.

## Dependencies

Significant imports:

- Node `fs`, `path`, `buffer`, and `crypto` for route-level IO, uploads, and stable IDs.
- [`packages/storyboard/src/core/canvas/materializer.js`](./materializer.js.md) — materialize and serialize event streams.
- [`packages/storyboard/src/core/canvas/identity.js`](./identity.js.md) — canonical canvas IDs.
- [`packages/storyboard/src/core/canvas/githubEmbeds.js`](./githubEmbeds.js.md) — GitHub URL validation and snapshot fetches.
- [`packages/storyboard/src/core/canvas/collision.js`](./collision.js.md) — bounds, auto-placement, and connector anchor selection.
- `./writeGuard.js` — suppress duplicate watcher-triggered HMR.
- `../logger/devLogger.js` — server-side diagnostics.
- `../../../widgets.config.json` — prompt execution defaults and widget metadata.
- [`packages/storyboard/src/core/canvas/hub-roles.js`](./hub-roles.js.md) — dynamic hub role catalog.
- Dynamic imports of [`packages/storyboard/src/core/canvas/selectedWidgets.js`](./selectedWidgets.js.md), [`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md), [`packages/storyboard/src/core/canvas/terminal-registry.js`](./terminal-registry.js.md), and messaging helpers during graph synchronization.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/vite/server-plugin.js` — mounts the handler into the Vite dev server.
- `packages/storyboard/src/core/canvas/server.test.js` — route-level regression coverage.

## Notes

This file is the architectural center of the canvas server because it translates between three representations at once: append-only event logs on disk, materialized canvas state in memory, and live side effects in running terminal/agent sessions. The design favors small atomic event writes plus derived synchronization passes instead of large transactional rewrites.
