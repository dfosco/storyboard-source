# `packages/storyboard/src/internals/canvas/useMarqueeSelect.js`

<!--
source: packages/storyboard/src/internals/canvas/useMarqueeSelect.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md) encapsulates lasso selection for the canvas. It converts pointer drags into a live overlay rectangle and a final selection set, including optional connector-aware expansion when the user holds Alt/Option.

## Composition

```js
export default function useMarqueeSelect({
  scrollRef,
  zoomRef,
  setSelectedWidgetIds,
  widgets,
  connectors,
  componentEntries,
  fallbackSizes,
  spaceHeld,
  isLocalDev,
}) {
  const [marqueeScreenRect, setMarqueeScreenRect] = useState(null)
  const marqueeState = useRef(null)
```

```js
const canvasEnd = clientToCanvas(ev.clientX, ev.clientY)
const selRect = {
  x: Math.min(ms.startCanvasX, canvasEnd.x),
  y: Math.min(ms.startCanvasY, canvasEnd.y),
  width: Math.abs(canvasEnd.x - ms.startCanvasX),
  height: Math.abs(canvasEnd.y - ms.startCanvasY),
}
```

```js
if (ms.altKey && connectors?.length) {
  const widgetMap = new Map()
  for (const w of (widgets ?? [])) widgetMap.set(w.id, w)
  for (const conn of connectors) {
    if (connectorIntersectsRect(conn, widgetMap, selRect)) {
      if (conn.start?.widgetId) selected.add(conn.start.widgetId)
      if (conn.end?.widgetId) selected.add(conn.end.widgetId)
    }
  }
}
```

## Dependencies

- [`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md) for connector hit testing.
- Scroll/zoom refs supplied by [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md).

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) is the runtime consumer.
- `useMarqueeSelect.test.js` covers exported geometry helpers.

## Notes

- The hook exports `getWidgetBounds()` and `rectsIntersect()` for targeted unit tests and shared reasoning about marquee coverage.
