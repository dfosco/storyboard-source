# `packages/storyboard/src/core/tools/surfaces/registry.js`

<!--
source: packages/storyboard/src/core/tools/surfaces/registry.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This registry centralizes the set of rendering surfaces that declarative tools may target. It gives the rest of the tool system stable surface IDs for validation and for UI routing into CoreUIBar and the command palette.

## Composition

```js
export { id as commandToolbar } from './mainToolbar.js'
export { id as canvasToolbar } from './canvasToolbar.js'
export { id as commandPalette } from './commandList.js'
export { id as collabBar } from './collabBar.js'

export const SURFACE_IDS = ['command-toolbar', 'canvas-toolbar', 'command-palette', 'collab-bar']
```

The named re-exports keep surface identifiers co-located with each surface definition while still exposing a single import point. `SURFACE_IDS` gives validation code a compact allow-list.

## Dependencies

- Re-exports [`packages/storyboard/src/core/tools/surfaces/mainToolbar.js`](mainToolbar.js.md), [`packages/storyboard/src/core/tools/surfaces/canvasToolbar.js`](canvasToolbar.js.md), [`packages/storyboard/src/core/tools/surfaces/commandList.js`](commandList.js.md), and [`packages/storyboard/src/core/tools/surfaces/collabBar.js`](collabBar.js.md).

## Dependents

- [`packages/storyboard/src/core/stores/toolRegistry.js`](../../../../../../../../packages/storyboard/src/core/stores/toolRegistry.js) validates configured `surface` values against the known IDs.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) and [`packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`](../../../../../../../../packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx) implement the concrete rendering behavior for these IDs.

## Notes

The file deliberately exports identifiers rather than full objects; the rendering code cares about stable surface names more than metadata aggregation.
