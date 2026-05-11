# `packages/storyboard/src/internals/canvas/widgets/ImageWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ImageWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ImageWidget.jsx` displays pasted canvas images, preserving aspect ratio on resize and exposing canvas-specific actions such as privacy toggling, cropping, downloading, copying, and expand/split-screen viewing. It is the only widget in this group that also talks directly to canvas image APIs.

The file works closely with [`CropOverlay.jsx`](./CropOverlay.jsx.md) for crop selection and with [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) for toolbar actions like privacy and the image-actions dropdown.

## Composition

```jsx
const ImageWidget = forwardRef(function ImageWidget({ id, props, onUpdate, resizable }, ref) {
  const src = readProp(props, 'src', imageSchema)
  const isPrivate = readProp(props, 'private', imageSchema)
  const width = readProp(props, 'width', imageSchema)
  const height = readProp(props, 'height', imageSchema)
})
```

Schema-backed props:

- `src` (`text`, default `""`)
- `private` (`boolean`, default `false`)
- `width` (`number`)
- `height` (`number`)

Key state:

- `naturalRatio` / `naturalSize` capture loaded image dimensions.
- `expandMode` drives single vs split expanded view.
- `cropping`, `cropRect`, `previousSrc`, and `containerSize` manage crop mode and undo.

Toolbar actions exposed to [`WidgetChrome.jsx`](./WidgetChrome.jsx.md):

- `expand` / `split-screen`
- `crop-image`
- `toggle-private`
- `download-image`
- `copy-as-png`
- `copy-file-path`

Cropping flow:

```jsx
const result = await cropAndUpload(src, naturalCropRect, canvasId)
if (result.success) onUpdate?.({ src: result.filename })
```

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) and [`widgetConfig.js`](./widgetConfig.js.md) for schema + feature metadata.
- [`CropOverlay.jsx`](./CropOverlay.jsx.md) for selection UI and `CropBar`.
- `canvasApi.js` for `toggleImagePrivacy()` and `cropAndUpload()`.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) and `expandUtils.js` for expanded image views.

## Dependents

- Registered in [`index.js`](./index.js.md) as `image`.
- Referenced by `expandUtils.js` to build split panes around images.

## Notes

- Private images are intentionally hidden in production builds.
- `getImageUrl()` always resolves through `/_storyboard/canvas/images/…`, so image widgets are tied to the canvas asset pipeline rather than arbitrary external URLs.
