# `packages/storyboard/src/internals/canvas/widgets/StickyNote.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/StickyNote.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`StickyNote.jsx` renders the simplest editable canvas widget: a colored note with inline text editing and optional resize support. It is one of the baseline components registered in [`index.js`](./index.js.md) and gets all selection/toolbar behavior from [`WidgetChrome.jsx`](./WidgetChrome.jsx.md).

The component is intentionally small: it reads a flat props object, lets the user double-click into a textarea, and persists edits through `onUpdate()` as the canonical canvas state.

## Composition

```jsx
export default function StickyNote({ props, onUpdate, resizable })
```

Props come from [`widgetProps.js`](./widgetProps.js.md) via `stickyNoteSchema`:

- `text` (`text`, default `""`)
- `color` (`select`, default `"yellow"`)
- `width` (`number`, default `270`)
- `height` (`number`, default `170`)

Key state and behavior:

- `editing` toggles between static `<p>` content and an overlayed `<textarea>`.
- `palette` is chosen from the local `COLORS` map; the same palette also feeds [`WidgetChrome.jsx`](./WidgetChrome.jsx.md)’s color picker.
- A `useEffect()` focuses the textarea and moves the cursor to the end when editing starts.
- `handleResize()` persists `{ width, height }` through [`ResizeHandle.jsx`](./ResizeHandle.jsx.md).

Core render path:

```jsx
<p onDoubleClick={canEdit ? () => setEditing(true) : undefined}>
  {text || (canEdit ? 'Double-click to edit…' : 'No content')}
</p>
```

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for schema-backed prop reads.
- [`ResizeHandle.jsx`](./ResizeHandle.jsx.md) for drag resizing.
- CSS module styling for note colors, layout, and editing overlay.
- Toolbar features such as color/copy/delete are declared in [`widgetConfig.js`](./widgetConfig.js.md) and surfaced by [`WidgetChrome.jsx`](./WidgetChrome.jsx.md).

## Dependents

- Registered by [`index.js`](./index.js.md) under the `sticky-note` type.
- Covered by `StickyNote.test.jsx` for editing and resize semantics.

## Notes

- The component does not own selection, delete, or color UI; those come from [`WidgetChrome.jsx`](./WidgetChrome.jsx.md).
- In read-only contexts it still renders selectable text via `data-canvas-allow-text-selection` and never tries to enter edit mode.
