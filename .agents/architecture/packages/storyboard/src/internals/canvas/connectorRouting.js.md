# `packages/storyboard/src/internals/canvas/connectorRouting.js`

<!--
source: packages/storyboard/src/internals/canvas/connectorRouting.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/connectorRouting.js`](./connectorRouting.js.md) owns manual connector routing. It turns relative waypoints into either fluid Catmull-Rom curves or orthogonal rounded polylines, giving the canvas a routing model that survives widget movement because waypoints stay anchored to the connector start point.

## Composition

```js
export function resolveWaypoint(startPt, waypoint) {
  return { x: startPt.x + waypoint.dx, y: startPt.y + waypoint.dy }
}

export function toRelativeWaypoint(startPt, absPt, extra = {}) {
  return { dx: absPt.x - startPt.x, dy: absPt.y - startPt.y, ...extra }
}
```

```js
export function buildManualPath(style, startPt, startAnchor, endPt, endAnchor, waypoints, opts = {}) {
  const wpAbs = resolveWaypoints(startPt, waypoints || [])
  if (style === 'orthogonal') {
    const firstOrient = (startAnchor === 'top' || startAnchor === 'bottom') ? 'v' : 'h'
    const ortho = orthogonalize(allPts, firstOrient)
    return roundedPolylinePath(ortho, opts.radius ?? DEFAULT_CORNER_RADIUS)
  }
  const startStub = projectAnchorStub(startPt, startAnchor, 8)
  const endStub = projectAnchorStub(endPt, endAnchor, 8)
  return catmullRomPath([startPt, startStub, ...wpAbs, endStub, endPt])
}
```

The second half adds hit-testing helpers such as `getOrthogonalPolyline()`, `findSegmentAtPoint()`, and `manualConnectorIntersectsRect()`.

## Dependencies

- [`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md) for anchor-direction control offsets.

## Dependents

- `connectorRouting.test.js` validates the path and hit-testing helpers.

## Notes

- Waypoints are stored relative to the start anchor, so the whole route translates naturally when the source widget moves.
