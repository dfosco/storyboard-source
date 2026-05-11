# `packages/storyboard/src/core/canvas/selectedWidgets.js`

<!--
source: packages/storyboard/src/core/canvas/selectedWidgets.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/selectedWidgets.js`](./selectedWidgets.js.md) is the bridge between the browser canvas UI and file-based agent context. It persists the actively focused canvas, selected widgets, and viewport into `.storyboard/.selectedwidgets.json` so server routes and CLI agents can react to what the user is currently looking at.

## Composition

The module writes its bridge file atomically:

```js
function writeSelectedWidgets(root, data) {
  const filePath = path.join(dirPath, FILE_NAME)
  const tmpPath = filePath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  fs.renameSync(tmpPath, filePath)
}
```

It exposes read helpers for both the full bridge state and the viewport-only slice consumed elsewhere:

```js
export function readCurrentViewport(root) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  return data?.viewport || null
}
```

`setupSelectedWidgets(server, root)` wires Vite HMR events like `storyboard:canvas-focused`, `storyboard:selection-changed`, and `storyboard:viewport-changed` into that on-disk state.

## Dependencies

- Node `fs` and `path` for the bridge file.
- [`packages/storyboard/src/core/canvas/identity.js`](./identity.js.md) to resolve canonical canvas IDs back to source paths.
- `../logger/devLogger.js` for write-failure diagnostics.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js`
- `packages/storyboard/src/core/canvas/terminal-config.js`
- `packages/storyboard/src/core/vite/server-plugin.js`
- `packages/storyboard/src/core/canvas/selectedWidgets.test.js`

## Notes

The bridge only trusts updates from the active tab and dedupes unchanged viewport payloads, which keeps agent context fresh without thrashing disk writes.
