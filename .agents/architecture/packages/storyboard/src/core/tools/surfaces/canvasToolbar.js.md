# `packages/storyboard/src/core/tools/surfaces/canvasToolbar.js`

<!--
source: packages/storyboard/src/core/tools/surfaces/canvasToolbar.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This surface describes the floating toolbar rendered on canvas pages. It lives in the canvas chrome and only accepts menu-style canvas controls plus the custom `zoom-control` render type used for the dedicated zoom widget.

## Composition

```js
export const id = 'canvas-toolbar'
export const label = 'Canvas Toolbar'
export const position = 'bottom-left'
export const renderTypes = ['menu', 'zoom-control']
```

The surface metadata is intentionally tiny: the UI implementation decides layout, while config and registry code only need the public ID, label, placement hint, and supported render types.

## Dependencies

- No imports; this is a pure metadata definition.

## Dependents

- [`packages/storyboard/src/core/tools/surfaces/registry.js`](registry.js.md) re-exports its `id`.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) uses the `canvas-toolbar` surface to place canvas controls.
- The shared handler [`packages/storyboard/src/core/tools/handlers/canvasToolbar.js`](../handlers/canvasToolbar.js.md) supplies the zoom, undo/redo, and snap actions rendered here.

## Notes

This surface is the clearest example of the tools system's separation of concerns: placement is defined here, while actual canvas behaviors live in the linked handler and UI components.
