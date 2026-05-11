# `packages/storyboard/src/core/tools/handlers/canvasAddWidget.js`

<!--
source: packages/storyboard/src/core/tools/handlers/canvasAddWidget.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler wires the canvas “add widget” control into the declarative toolbar system. It delegates the actual menu UI to [`packages/storyboard/src/core/ui/CanvasCreateMenu.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasCreateMenu.jsx), so config can place the tool on canvas pages without duplicating widget-creation logic.

## Composition

```js
export const id = 'canvas-add-widget'

export async function component() {
  const mod = await import('../../ui/CanvasCreateMenu.jsx')
  return mod.default
}
```

The absence of `guard` means visibility is controlled by config and surface selection rather than by runtime capability checks.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/CanvasCreateMenu.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasCreateMenu.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the handler for `core:canvas-add-widget` references.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
