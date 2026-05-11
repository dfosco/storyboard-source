# `packages/storyboard/src/internals/canvas/widgets/ComponentWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ComponentWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ComponentWidget.jsx` is a deprecated compatibility stub for an older `jsx`-based canvas path. The modern widget system uses the registry in [`index.js`](./index.js.md) plus specific widget types, but [`CanvasPage.jsx`](../CanvasPage.jsx.md) still imports this file so dormant legacy canvases do not crash.

Unlike active widgets wrapped by [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), this component simply mounts a passed React component inside [`WidgetWrapper.jsx`](./WidgetWrapper.jsx.md).

## Composition

```jsx
export default function ComponentWidget({ component: Component }) {
  if (!Component) return null
  return (
    <WidgetWrapper>
      <Component />
    </WidgetWrapper>
  )
}
```

There is no schema-backed props contract here. The only effective prop is `component`, which is expected to be a React component constructor.

Key characteristics:

- no local state
- no effects
- no resize handling
- no imperative action API for [`WidgetChrome.jsx`](./WidgetChrome.jsx.md)

## Dependencies

- [`WidgetWrapper.jsx`](./WidgetWrapper.jsx.md) for consistent canvas framing.
- Legacy `jsx` canvas rendering inside [`CanvasPage.jsx`](../CanvasPage.jsx.md).

## Dependents

- Imported directly by [`CanvasPage.jsx`](../CanvasPage.jsx.md) for the dormant legacy path.

## Notes

- The header comment is the important architectural signal: the file exists to preserve backward compatibility, not as a current extension point.
- New widget work should go through [`widgetConfig.js`](./widgetConfig.js.md), [`widgetProps.js`](./widgetProps.js.md), and the registry in [`index.js`](./index.js.md) instead.
