# `packages/storyboard/src/internals/canvas/useUndoRedo.js`

<!--
source: packages/storyboard/src/internals/canvas/useUndoRedo.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/useUndoRedo.js`](./useUndoRedo.js.md) is the canvas-specific history stack used by [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md). It stores snapshot history, coalesces repeated edits on the same target, and exposes simple `canUndo` / `canRedo` booleans without forcing consumers to clone the history arrays on every render.

## Composition

```js
const MAX_HISTORY = 100
const COALESCE_MS = 2000

export default function useUndoRedo() {
  const pastRef = useRef([])
  const futureRef = useRef([])
  const lastActionRef = useRef({ type: null, widgetId: null, time: 0 })
  const [counts, setCounts] = useState({ past: 0, future: 0 })
```

```js
const snapshot = useCallback((currentWidgets, actionType, widgetId) => {
  if (actionType === 'edit' && widgetId) {
    const last = lastActionRef.current
    const now = Date.now()
    if (last.type === 'edit' && last.widgetId === widgetId && now - last.time < COALESCE_MS) {
      lastActionRef.current = { type: 'edit', widgetId, time: now }
      return
    }
  }
  pastRef.current.push(structuredClone(widgets))
  futureRef.current = []
  …
}, [])
```

## Dependencies

- React refs/state/callbacks only.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) uses it for all canvas mutations.
- `useUndoRedo.test.js` verifies the hook directly.

## Notes

- Despite the historical comment mentioning widget arrays, [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) now passes composite `{ widgets, sources, connectors }` snapshots through the same mechanism.
