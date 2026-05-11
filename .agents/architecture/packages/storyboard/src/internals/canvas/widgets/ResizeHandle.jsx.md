# `packages/storyboard/src/internals/canvas/widgets/ResizeHandle.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ResizeHandle.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ResizeHandle.jsx` is the shared drag affordance used by multiple canvas widgets to persist width and height changes. It centralizes pointer math, minimum-size clamping, and zoom-aware resizing so widgets such as sticky notes, markdown blocks, images, links, prompts, prototypes, and story widgets do not each implement their own document-level drag handlers.

## Composition

The component reads the target element’s starting box size, derives canvas zoom from rendered versus layout width, and emits size updates while the document-level drag is active.

```jsx
export default function ResizeHandle({
  targetRef,
  minWidth = 180,
  minHeight = 60,
  axis = 'both',
  onResize,
  onResizeStart,
  onResizeEnd,
})
```

Key behavior:

- `handleMouseDown()` stops event propagation so widget dragging does not start.
- `scale` is computed from `getBoundingClientRect().width / offsetWidth`, keeping resize deltas correct under canvas CSS zoom.
- `axis` can lock resizing to vertical or horizontal motion.
- `onResize()` fires on every `mousemove`; `onResizeEnd()` receives the final clamped size on `mouseup`.
- The handle renders as an ARIA `separator` with orientation and cursor hints.

```jsx
function onMove(ev) {
  const dx = (ev.clientX - startX) / scale
  const dy = (ev.clientY - startY) / scale
  lastW = axis === 'vertical' ? startW : Math.max(minWidth, startW + dx)
  lastH = axis === 'horizontal' ? startH : Math.max(minHeight, startH + dy)
  onResize?.(lastW, lastH)
}
```

## Dependencies

- React `useCallback()` to keep the mouse-down handler stable.
- `ResizeHandle.module.css` for positioning and the visual grip.

## Dependents

- [`StickyNote.jsx`](./StickyNote.jsx.md)
- [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md)
- [`LinkPreview.jsx`](./LinkPreview.jsx.md)
- [`PrototypeEmbed.jsx`](./PrototypeEmbed.jsx.md)
- [`ImageWidget.jsx`](./ImageWidget.jsx.md)
- [`PromptWidget.jsx`](./PromptWidget.jsx.md)
- [`TilesWidget.jsx`](./TilesWidget.jsx.md)
- [`StoryWidget.jsx`](./StoryWidget.jsx.md)
- [`StorySetWidget.jsx`](./StorySetWidget.jsx.md)

## Notes

- The component relies on document listeners rather than pointer capture, which keeps it simple across the existing widget implementations.
