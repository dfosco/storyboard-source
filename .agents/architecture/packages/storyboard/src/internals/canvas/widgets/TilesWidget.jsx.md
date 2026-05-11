# `packages/storyboard/src/internals/canvas/widgets/TilesWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/TilesWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`TilesWidget.jsx` renders a square-image tile grid backed by a fixed bundled image pool. It is a more toy-like but still architecturally interesting widget because it persists authoring state either into canvas props (dev) or `localStorage` (production/read-only).

The component is registered in [`index.js`](./index.js.md) as `tiles`, while [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) exposes toolbar actions for grid mutations in editable mode.

## Composition

```jsx
const TilesWidget = forwardRef(function TilesWidget({ id, props, onUpdate, resizable }, ref) {
  const isProd = !onUpdate
  const columns = ...
  const rows = ...
  const savedTiles = ...
})
```

Schema-backed props:

- `tiles` (`text`, default `[]`)
- `columns` (`number`, default `3`)
- `rows` (`number`, default `3`)
- `tileSize` (`number`, default `80`)
- `width` / `height` exist in schema but layout is mainly derived from grid dimensions

Key state/effects:

- `localState` mirrors persisted prod state from `localStorage`.
- `selectedIdx`, `copiedSrc`, `dragIdx`, and `dragOverIdx` drive copy/paste and drag reorder.
- A `MutationObserver` clears selection when the dev interact gate exits.
- A global `keydown` listener handles Cmd/Ctrl+C and V for tile copy/paste.

Imperative actions exposed to [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): `add-column`, `remove-column`, `add-row`, `remove-row`, and `randomize`.

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) / [`widgetConfig.js`](./widgetConfig.js.md) for schema + feature metadata.
- `tilePool.js` for bundled image sources.
- [`ResizeHandle.jsx`](./ResizeHandle.jsx.md) and [`WidgetWrapper.jsx`](./WidgetWrapper.jsx.md).

## Dependents

- Registered in [`index.js`](./index.js.md) as `tiles`.
- Toolbar grouping in [`widgetConfig.js`](./widgetConfig.js.md) references its grid actions.

## Notes

- Production persistence is intentionally local-only because published canvases are read-only.
- Saved tile composition is stored as indexes into `TILE_POOL`, not raw URLs, so the persisted state stays compact and stable.
