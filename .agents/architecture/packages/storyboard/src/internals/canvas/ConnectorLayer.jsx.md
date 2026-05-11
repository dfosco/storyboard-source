# `packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`

<!--
source: packages/storyboard/src/internals/canvas/ConnectorLayer.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`](./ConnectorLayer.jsx.md) renders canvas connectors as a dedicated two-layer SVG overlay. It separates back-layer paths from front-layer endpoint affordances so connectors can sit behind widgets while anchor drag targets remain interactable above them.

## Composition

```jsx
const resolved = useMemo(() => connectors.map((conn) => {
  const startWidget = widgetMap.get(conn.start?.widgetId)
  const endWidget = widgetMap.get(conn.end?.widgetId)
  if (!startWidget || !endWidget) return null
  const startPt = getAnchorPoint(startWidget, conn.start.anchor)
  const endPt = getAnchorPoint(endWidget, conn.end.anchor)
  const d = buildPath(startPt, conn.start.anchor, endPt, conn.end.anchor)
  …
}).filter(Boolean), [connectors, widgetMap, selectedWidgetIds])
```

```jsx
<svg className={`${styles.connectorLayer} ${hiddenClass}`} style={svgLayerStyle}>…</svg>
<svg className={`${styles.endpointLayer} ${hiddenClass}`} style={svgLayerStyle}>…</svg>
```

`EndpointShape` centralizes endpoint rendering for circles, arrowheads, and invisible hit targets, while `resolved` memoization lets both SVG layers share the same geometry.

## Dependencies

- [`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md) for anchor points and path building.
- Widget connector defaults from `./widgets/widgetConfig.js`.
- Local presentation styles in `ConnectorLayer.module.css`.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) mounts this inside the zoomed canvas layer.

## Notes

- Broadcast connectors add a second animated path so collaboration flows remain visible without affecting hit testing.
