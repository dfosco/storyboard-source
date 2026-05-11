# `packages/storyboard/src/internals/canvas/widgets/StorySetWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/StorySetWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`StorySetWidget.jsx` renders every export from a story inside one isolate-set iframe instead of creating one widget per export. It is the grid-preview counterpart to [`StoryWidget.jsx`](./StoryWidget.jsx.md) in [`index.js`](./index.js.md), optimized for browsing and selecting components.

The widget is still wrapped by [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), but it also listens to postMessage events from the embedded page so export selection and auto-resize can round-trip back into canvas state.

## Composition

```jsx
export default forwardRef(function StorySetWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const layout = props?.layout || 'horizontal'
  const selected = props?.selected || ''
})
```

Schema-backed props:

- `storyId` (`text`, default `""`)
- `layout` (`text`, default `"horizontal"`)
- `selected` (`text`, default `""`)
- `width` (`number`)
- `height` (`number`)

Key state/effects:

- `interactive` controls the overlay gate.
- `storyIndexKey` listens for `storyboard:story-index-changed` to refresh HMR story routing.
- `window.message` listens for:
  - `storyboard:component-set:select` to persist `selected`
  - `storyboard:component-set:resize` to auto-size the widget to the grid content

Imperative actions handled for [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): `flip-layout` and `open-external`.

## Dependencies

- `getStoryData()` from `core/index.js` for isolate-set URL resolution.
- [`ResizeHandle.jsx`](./ResizeHandle.jsx.md) for manual sizing.
- `useIframeDevLogs()` and embed overlay styling for iframe behavior.

## Dependents

- Registered in [`index.js`](./index.js.md) as `component-set`.
- Re-exported by [`ComponentSetWidget.jsx`](./ComponentSetWidget.jsx.md) for backward compatibility.

## Notes

- The selected export is stored in widget props so connected agents and other canvas logic can observe it.
- Unlike [`StoryWidget.jsx`](./StoryWidget.jsx.md), this component does not use [`ExpandedPane.jsx`](./ExpandedPane.jsx.md); it stays inline only.
