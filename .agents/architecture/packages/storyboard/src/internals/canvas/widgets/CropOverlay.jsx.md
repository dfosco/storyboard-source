# `packages/storyboard/src/internals/canvas/widgets/CropOverlay.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/CropOverlay.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`CropOverlay.jsx` provides the transient crop-selection UI used by [`ImageWidget.jsx`](./ImageWidget.jsx.md). It is not a standalone registry widget from [`index.js`](./index.js.md); instead it is a specialized interaction layer that temporarily replaces normal image chrome while the user defines a crop rectangle.

The image widget still lives under [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), but this overlay and its crop bar take over the direct manipulation experience during crop mode.

## Composition

```jsx
export default function CropOverlay({
  containerWidth, containerHeight, cropRect,
  onCropRectChange, onCancel,
})
```

Main pieces:

- `MIN_CROP = 20` enforces a minimum crop size.
- `HANDLES = ['NW', 'NE', 'SW', 'SE', 'N', 'S', 'W', 'E']` defines corner and edge drag affordances.
- `dragging.current` stores the active drag session.
- A global Escape listener triggers `onCancel()`.

Pointer logic:

```jsx
if (handle === 'move') { ... }
if (handle.includes('W')) { ... }
if (handle.includes('E')) { ... }
```

The companion export `CropBar` renders the save / undo / cancel controls plus current pixel dimensions.

## Dependencies

- CSS module styling for the overlay, handles, and crop bar.
- [`ImageWidget.jsx`](./ImageWidget.jsx.md) for persistence and actual crop saving.

## Dependents

- Used directly by [`ImageWidget.jsx`](./ImageWidget.jsx.md).

## Notes

- The file only works in display-pixel space; [`ImageWidget.jsx`](./ImageWidget.jsx.md) converts the rectangle back into natural image pixels before calling the upload API.
- `CropBar` is rendered outside the image frame specifically to avoid wrapper overflow clipping.
