# `packages/storyboard/src/core/tools/handlers/commandPalette.js`

<!--
source: packages/storyboard/src/core/tools/handlers/commandPalette.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler adds the dedicated command-palette trigger to the main toolbar. It exists so the same declarative tool config system that places ordinary buttons can also lazy-load [`packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx) as the entry point into the broader command palette UI.

## Composition

```js
export const id = 'command-palette'

export async function component() {
  const mod = await import('../../ui/CommandPaletteTrigger.jsx')
  return mod.default
}
```

The module is intentionally minimal because the actual command aggregation logic lives elsewhere, in the command palette implementation.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the handler.
- [`packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`](../../../../../../../../packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx) responds to the trigger's open/toggle events.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
