# `packages/storyboard/src/core/tools/surfaces/collabBar.js`

<!--
source: packages/storyboard/src/core/tools/surfaces/collabBar.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This surface defines the compact floating collaboration bar shown at the top-right of canvas pages. It supports `button` and `menu` tools so agent- and collaboration-focused affordances can stay visually separate from the main command toolbar.

## Composition

```js
export const id = 'collab-bar'
export const label = 'Collab Bar'
export const position = 'top-right'
export const renderTypes = ['button', 'menu']
```

The file gives configuration a stable target for canvas collaboration chrome without coupling toolbar config to concrete DOM selectors or CSS hooks.

## Dependencies

- No imports; surface metadata only.

## Dependents

- [`packages/storyboard/src/core/tools/surfaces/registry.js`](registry.js.md) re-exports its `id`.
- [`packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx) is the main built-in component targeting this surface.
- Canvas page state in [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx) feeds the `done` counts shown by those tools.

## Notes

The current built-in occupant is [`packages/storyboard/src/core/tools/handlers/agentsReady.js`](../handlers/agentsReady.js.md), but the surface stays open-ended for future collab tools registered through config.
