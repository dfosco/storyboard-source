# `packages/storyboard/src/core/tools/handlers/canvasAgents.js`

<!--
source: packages/storyboard/src/core/tools/handlers/canvasAgents.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler exposes configured canvas agent presets as a toolbar menu. It uses a `guard` to keep the tool absent unless `canvas.agents` is configured, then lazy-loads [`packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx) for the actual menu UI.

## Composition

```js
export const id = 'canvas-agents'

export async function guard(_ctx) {
  const { getConfig } = await import('../../index.js')
  const canvasConfig = getConfig('canvas')
  const agents = canvasConfig?.agents
  return agents && typeof agents === 'object' && Object.keys(agents).length > 0
}

export async function component() {
  const mod = await import('../../ui/CanvasAgentsMenu.jsx')
  return mod.default
}
```

The `guard` is the important architectural piece: missing configuration removes the tool entirely rather than rendering an empty dropdown.

## Dependencies

- Reads canvas config through [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).
- Dynamically imports [`packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the lazy loader.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
