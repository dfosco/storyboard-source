# `packages/storyboard/src/internals/canvas/useCanvas.js`

<!--
source: packages/storyboard/src/internals/canvas/useCanvas.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/useCanvas.js`](./useCanvas.js.md) loads the canonical canvas model for the UI. It merges build-time canvas metadata from core data discovery with fresh server-side widget/source state, then optionally imports the canvas JSX module and exposes its named exports to [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md).

## Composition

```js
async function fetchCanvasFromServer(name) {
  if (import.meta.env?.PROD) return null
  try {
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const res = await fetch(`${base}/_storyboard/canvas/read?name=${encodeURIComponent(name)}`)
    …
  } catch {}
  return null
}
```

```js
export function useCanvas(canvasId) {
  const buildTimeCanvas = useMemo(() => getCanvasData(canvasId), [canvasId])
  const [canvas, setCanvas] = useState(buildTimeCanvas)
  const [jsxExports, setJsxExports] = useState(null)
  const [jsxError, setJsxError] = useState(false)
  const [loading, setLoading] = useState(true)
  …
}
```

```js
const loadPromise = jsxImport
  ? jsxImport()
  : import(/* @vite-ignore */ resolveCanvasModuleImport(jsxModule))
```

## Dependencies

- `../../core/index.js` for `getCanvasData()`.
- Browser fetch and dynamic `import()`.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) is the primary consumer.
- `packages/storyboard/src/internals/index.js` re-exports the hook.
- `useCanvas.test.js` covers `resolveCanvasModuleImport()`.

## Notes

- `resolveCanvasModuleImport()` is branch-aware and keeps absolute URLs untouched, which matters for branch-prefixed `BASE_URL` deployments.
