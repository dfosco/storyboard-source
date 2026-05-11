# `packages/storyboard/src/core/canvas/collision.js`

<!--
source: packages/storyboard/src/core/canvas/collision.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/collision.js`](./collision.js.md) provides the server-side geometry used for widget placement and connector anchoring. It lets the canvas server choose collision-free positions and reasonable connector edge pairs without needing browser layout state.

## Composition

Default sizes are synthesized from `widgets.config.json` plus hardcoded fallbacks:

```js
export const DEFAULT_SIZES = buildDefaultSizes()

export function getDefaultSize(type) {
  return DEFAULT_SIZES[type] || FALLBACK_SIZE
}
```

Widget bounds helpers normalize `position`, explicit `props.width/height`, and derived bounds metadata:

```js
export function getWidgetBounds(widget) {
  const { position = { x: 0, y: 0 }, props = {}, type } = widget
  const defaults = getDefaultSize(type)
  return {
    x: position.x,
    y: position.y,
    width: props.width ?? defaults.width,
    height: props.height ?? defaults.height,
  }
}
```

`findFreePosition()` resolves overlap by hopping right past colliders, then down if needed, and snapping to the grid:

```js
export function findFreePosition({ x, y, width, height, widgets, excludeId = null, gridSize = 24 }) {
  const rect = { x: currentX, y: currentY, width, height }
  const colliders = findCollisions(rect, widgets, excludeId)
```

The other major slice is connector routing. `findBestAnchors()` evaluates anchor pairs (`top`, `bottom`, `left`, `right`) using sampled Bézier paths to avoid overlap with widget bodies.

## Dependencies

- `../../../widgets.config.json` — source of default widget dimensions.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js`
- `packages/storyboard/src/core/cli/canvasBounds.js`
- `packages/storyboard/src/core/cli/canvasRead.js`
- `packages/storyboard/src/core/canvas/collision.test.js`
- `packages/storyboard/package.json` exports it as `./canvas/collision`

## Notes

This is deliberately DOM-free geometry. That keeps placement stable in CLI and server code paths, though client rendering can still refine visuals later.
