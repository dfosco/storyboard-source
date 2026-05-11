# `packages/storyboard/src/core/tools/handlers/agentsReady.js`

<!--
source: packages/storyboard/src/core/tools/handlers/agentsReady.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler backs the canvas collaboration button that highlights completed agent work. It is intentionally tiny: the declarative tool system loads the module, then hands rendering off to [`packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx) on the [`collab bar`](../surfaces/collabBar.js.md) surface.

## Composition

```js
export const id = 'agents-ready'

export async function component() {
  const mod = await import('../../ui/AgentsReadyTrigger.jsx')
  return mod.default
}
```

There is no `handler`, `setup`, or `guard`. The module exists purely to name the tool and lazy-load the UI component.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the `agents-ready` loader.
- The trigger component consumes canvas state surfaced by [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx).

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
