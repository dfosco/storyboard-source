# `packages/storyboard/src/core/tools/handlers/canvasToolbar.js`

<!--
source: packages/storyboard/src/core/tools/handlers/canvasToolbar.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler is the shared behavior layer for multiple canvas toolbar controls. Instead of creating one handler module per zoom, undo/redo, and snap button, the tool system points several config entries at this file and chooses the right component at runtime based on the render type.

## Composition

```js
export async function handler() {
  const { min: ZOOM_MIN, max: ZOOM_MAX, step: ZOOM_STEP } = getCanvasZoom()

  return {
    zoomIn(currentZoom) { ...dispatchEvent('storyboard:canvas:set-zoom') },
    zoomOut(currentZoom) { ...dispatchEvent('storyboard:canvas:set-zoom') },
    zoomReset() { ...dispatchEvent('storyboard:canvas:set-zoom') },
    zoomToFit() { document.dispatchEvent(new CustomEvent('storyboard:canvas:zoom-to-fit')) },
    undo() { document.dispatchEvent(new CustomEvent('storyboard:canvas:undo')) },
    redo() { document.dispatchEvent(new CustomEvent('storyboard:canvas:redo')) },
    toggleSnap() { document.dispatchEvent(new CustomEvent('storyboard:canvas:toggle-snap')) },
    ZOOM_MIN,
    ZOOM_MAX,
  }
}

const componentMap = {
  'canvas-zoom':        () => import('../../ui/CanvasZoomControl.jsx'),
  'canvas-zoom-to-fit': () => import('../../ui/CanvasZoomToFit.jsx'),
  'canvas-undo-redo':   () => import('../../ui/CanvasUndoRedo.jsx'),
  'canvas-snap':        () => import('../../ui/CanvasSnap.jsx'),
}
```

`handler()` exposes imperative methods consumed by the four UI variants, while `component(renderType)` turns the tool's render type into the corresponding component module.

## Dependencies

- Imports zoom limits from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).
- Dynamically imports [`packages/storyboard/src/core/ui/CanvasZoomControl.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasZoomControl.jsx), [`packages/storyboard/src/core/ui/CanvasZoomToFit.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasZoomToFit.jsx), [`packages/storyboard/src/core/ui/CanvasUndoRedo.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasUndoRedo.jsx), and [`packages/storyboard/src/core/ui/CanvasSnap.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasSnap.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) maps `canvas-toolbar` to this shared loader.
- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx) listens for the custom events dispatched here.
- The handler is intended for tools rendered on [`packages/storyboard/src/core/tools/surfaces/canvasToolbar.js`](../surfaces/canvasToolbar.js.md). 

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
