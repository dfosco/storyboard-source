# `packages/storyboard/src/internals/canvas/CanvasToolbar.jsx`

<!--
source: packages/storyboard/src/internals/canvas/CanvasToolbar.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/CanvasToolbar.jsx`](./CanvasToolbar.jsx.md) is a small legacy add-widget launcher for canvas pages. It exposes the widget menu from widget config metadata, creates a widget through [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md), and returns the created record through `onWidgetAdded`.

## Composition

```jsx
const WIDGET_TYPES = getMenuWidgetTypes()

export default function CanvasToolbar({ canvasId, onWidgetAdded }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
```

```jsx
const defaultProps = schemas[type] ? getDefaults(schemas[type]) : {}
const result = await addWidgetApi(canvasId, {
  type,
  props: defaultProps,
  position: { x: 0, y: 0 },
})
```

The component is mostly UI state: open/close, disable while a request is in flight, and render the configured menu items.

## Dependencies

- [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md) for widget creation.
- Widget schemas and menu metadata in `./widgets/widgetProps.js` and `./widgets/widgetConfig.js`.
- Local CSS in `CanvasToolbar.module.css`.

## Dependents

No current architecture doc imports this component directly; it appears to be an older standalone control kept alongside [`packages/storyboard/src/internals/canvas/CanvasControls.jsx`](./CanvasControls.jsx.md).

## Notes

- Newer canvas flows mainly use [`packages/storyboard/src/internals/canvas/CanvasControls.jsx`](./CanvasControls.jsx.md), so this file is useful to document as historical/alternate UI rather than the primary orchestration path.
