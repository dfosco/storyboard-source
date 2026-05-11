# `packages/storyboard/src/core/canvas/materializer.js`

<!--
source: packages/storyboard/src/core/canvas/materializer.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/materializer.js`](./materializer.js.md) is the canonical replay engine for canvas state. It turns append-only `.canvas.jsonl` event streams into the current in-memory canvas object that the dev server, Vite data plugin, compaction flow, and rename watcher all consume. Because canvas files are persisted as event logs instead of mutable JSON blobs, this file is the boundary that makes the rest of the canvas stack feel stateful.

Architecturally, the module is intentionally dependency-free and deterministic: parse text, replay ordered events, derive a few secondary fields, and ignore anything unknown for forward compatibility. That simplicity is what lets [`packages/storyboard/src/core/canvas/server.js`](./server.js.md) append tiny atomic writes while the rest of the system still reads coherent canvas state.

## Composition

The parser first tolerates both strict JSONL and accidentally concatenated objects by scanning for top-level object boundaries:

```js
function splitJsonObjects(text) {
  const chunks = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false
```

`parseCanvasJsonl()` then converts each snippet into an event object and silently skips malformed entries instead of failing the whole file:

```js
export function parseCanvasJsonl(text) {
  const events = []
  for (const snippet of splitJsonObjects(text || '')) {
    try {
      events.push(JSON.parse(snippet))
    } catch {
      // Skip malformed snippets
    }
  }
  return events
}
```

`materialize()` is the core reducer. `canvas_created` seeds the initial state, strips event metadata, and guarantees a `connectors` array:

```js
case 'canvas_created': {
  const initial = { ...evt }
  delete initial.event
  delete initial.timestamp
  if (!initial.connectors) initial.connectors = []
  state = initial
  break
}
```

Widget mutations stay narrowly scoped: add appends, update merges `props`, move replaces `position`, and remove also cascades connector cleanup:

```js
case 'widget_updated': {
  state.widgets = (state.widgets || []).map((w) =>
    w.id === evt.widgetId
      ? { ...w, props: { ...w.props, ...evt.props } }
      : w,
  )
  break
}
```

```js
case 'widget_removed': {
  state.widgets = (state.widgets || []).filter((w) => w.id !== evt.widgetId)
  if (state.connectors?.length) {
    state.connectors = state.connectors.filter(
      (c) => c.start.widgetId !== evt.widgetId && c.end.widgetId !== evt.widgetId,
    )
  }
  break
}
```

Bulk replacement events are supported for undo/redo and compaction-friendly rewrites:

```js
case 'widgets_replaced': {
  state.widgets = evt.widgets
  const widgetIds = new Set((state.widgets || []).map((w) => w.id))
  state.connectors = state.connectors.filter(
    (c) => widgetIds.has(c.start.widgetId) && widgetIds.has(c.end.widgetId),
  )
  break
}
```

Connector updates go beyond add/remove: waypoints can be set or cleared, and `connector_updated` deep-merges `meta.messaging` while preserving endpoints:

```js
case 'connector_updated': {
  state.connectors = (state.connectors || []).map((c) => {
    if (c.id !== evt.connectorId) return c
    const { startAnchor, endAnchor, meta, ...rest } = evt.updates || {}
    const mergedMeta = { ...(c.meta || {}), ...(meta || {}) }
    if (meta?.messaging) {
      mergedMeta.messaging = { ...(c.meta?.messaging || {}), ...meta.messaging }
    }
```

After replay, the reducer derives widget-level `connectorIds` from the connector list so downstream readers do not have to recompute adjacency themselves:

```js
if (state.connectors?.length && state.widgets?.length) {
  const widgetConnMap = new Map()
  for (const conn of state.connectors) {
    for (const endpoint of [conn.start, conn.end]) {
      if (!widgetConnMap.has(endpoint.widgetId)) {
        widgetConnMap.set(endpoint.widgetId, new Set())
      }
      widgetConnMap.get(endpoint.widgetId).add(conn.id)
    }
  }
```

The public surface is deliberately small:

```js
export function materializeFromText(text) {
  return materialize(parseCanvasJsonl(text))
}

export function serializeEvent(event) {
  return JSON.stringify(event)
}
```

## Dependencies

This file has no imports. That zero-dependency design is intentional so it can be reused from [`packages/storyboard/src/core/canvas/server.js`](./server.js.md), [`packages/storyboard/src/core/canvas/compact.js`](./compact.js.md), the Vite data plugin, and test/CLI paths without dragging in Vite or server runtime state.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/compact.js` — compacts JSONL history by materializing then rewriting a single `canvas_created` snapshot.
- `packages/storyboard/src/core/canvas/server.js` — serves materialized canvases and appends serialized events.
- `packages/storyboard/src/core/rename-watcher/watcher.js` — reads canvas state while reacting to file moves.
- `packages/storyboard/src/internals/vite/data-plugin.js` — materializes canvases for the virtual data index and HMR payloads.
- `packages/storyboard/src/core/canvas/materializer.test.js` and `packages/storyboard/src/core/canvas/server.test.js` — regression coverage.
- `packages/storyboard/package.json` — exports the module as `./canvas/materializer`.

## Notes

Unknown events are ignored instead of rejected, which makes the format forward-compatible across rolling dev sessions. The reducer also cleans up orphaned connectors during widget removal and bulk replacement, so invalid topology is normalized at read time rather than requiring every writer to enforce it perfectly.
