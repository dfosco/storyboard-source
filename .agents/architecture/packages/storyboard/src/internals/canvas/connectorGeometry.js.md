# `packages/storyboard/src/internals/canvas/connectorGeometry.js`

<!--
source: packages/storyboard/src/internals/canvas/connectorGeometry.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md) provides the geometric primitives for automatic connector layout. It computes edge anchor points, Bézier control points, overlap-aware anchor selection, and rectangle-intersection tests used by both connector rendering and marquee selection.

## Composition

```js
export function getAnchorPoint(widget, anchor) {
  const el = typeof document !== 'undefined' ? document.getElementById(widget.id) : null
  …
  switch (anchor) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
    default: return { x: x + w / 2, y: y + h / 2 }
  }
}
```

```js
export function buildPath(startPt, startAnchor, endPt, endAnchor, freeEnd = false) {
  const minAxisDist = Math.min(Math.abs(startPt.x - endPt.x), Math.abs(startPt.y - endPt.y))
  const scale = computeControlScale(minAxisDist)
  const c1 = getControlOffset(startAnchor, scale)
  const c2 = freeEnd ? … : getControlOffset(endAnchor, scale)
  return `M ${startPt.x} ${startPt.y} C … ${endPt.x} ${endPt.y}`
}
```

```js
export function findBestAnchors(widgetA, widgetB) {
  …
  candidates.sort((a, b) => {
    if (a.overlaps !== b.overlaps) return a.overlaps ? 1 : -1
    return a.dist - b.dist
  })
  return { startAnchor: best.startAnchor, endAnchor: best.endAnchor }
}
```

## Dependencies

- Connector defaults from `./widgets/widgetConfig.js`.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) uses `findBestAnchors()` for alt-click auto-connection.
- [`packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`](./ConnectorLayer.jsx.md) uses `getAnchorPoint()` and `buildPath()` for rendering.
- [`packages/storyboard/src/internals/canvas/connectorRouting.js`](./connectorRouting.js.md) uses `getControlOffset()`.
- [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md) uses `connectorIntersectsRect()`.

## Notes

- DOM measurement is preferred over prop dimensions so auto-sized widgets like markdown blocks get accurate connector anchors.
