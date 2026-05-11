# `packages/storyboard/src/internals/canvas/canvasApi.js`

<!--
source: packages/storyboard/src/internals/canvas/canvasApi.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md) is the browser-side client for the canvas server API. It gives the rest of the canvas runtime a single place to create pages, mutate widgets, upload images, manage connectors, and query GitHub/page-order helpers without scattering fetch details through UI code.

## Composition

```js
const BASE = '/_storyboard/canvas'

function getApiBase() {
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  return base + BASE
}

async function request(path, method, body) {
  const url = getApiBase() + path
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}
```

```js
export function updateCanvas(canvasId, { widgets, sources, settings, connectors }) {
  return request('/update', 'PUT', { name: canvasId, widgets, sources, settings, connectors })
}

export function addConnector(canvasId, { startWidgetId, startAnchor, endWidgetId, endAnchor, connectorType, meta }) {
  return request('/connector', 'POST', { … })
}
```

`cropAndUpload()` is the only higher-level helper: it loads an existing image into an offscreen canvas, crops it client-side, generates a timestamped filename, then reuses `uploadImage()`.

## Dependencies

- Browser `fetch`, `Image`, and `canvas` APIs.
- Runtime `import.meta.env.BASE_URL` for branch-aware URL construction.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) uses most of this surface.
- [`packages/storyboard/src/internals/canvas/CanvasToolbar.jsx`](./CanvasToolbar.jsx.md) and [`packages/storyboard/src/internals/canvas/PageSelector.jsx`](./PageSelector.jsx.md) use focused subsets.
- `packages/storyboard/src/internals/canvas/widgets/ImageWidget.jsx` uses image privacy and crop helpers.

## Notes

- The module preserves the repo convention that branch deployments prepend `BASE_URL`, so server endpoints remain correct under worktree URLs.
