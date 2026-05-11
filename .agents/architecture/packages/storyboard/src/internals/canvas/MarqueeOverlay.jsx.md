# `packages/storyboard/src/internals/canvas/MarqueeOverlay.jsx`

<!--
source: packages/storyboard/src/internals/canvas/MarqueeOverlay.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/MarqueeOverlay.jsx`](./MarqueeOverlay.jsx.md) is the visual half of marquee selection. It simply turns the screen-space rectangle produced by [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md) into the translucent overlay drawn over the scroll container.

## Composition

```jsx
export default function MarqueeOverlay({ rect }) {
  if (!rect) return null
  return (
    <div
      className={styles.marqueeRect}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  )
}
```

## Dependencies

- Shared canvas styling from `CanvasPage.module.css`.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) renders it above the zoom layer during marquee drags.

## Notes

- The rectangle is intentionally dumb; all selection math lives in [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md).
