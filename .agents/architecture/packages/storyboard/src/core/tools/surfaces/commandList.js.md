# `packages/storyboard/src/core/tools/surfaces/commandList.js`

<!--
source: packages/storyboard/src/core/tools/surfaces/commandList.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This surface represents the overlay command palette rather than a visible toolbar strip. It renders inside the ⌘K palette and only supports link-like command entries or nested submenus, so tools targeting it become searchable actions instead of standalone chrome buttons.

## Composition

```js
export const id = 'command-palette'
export const label = 'Command Palette'
export const position = 'overlay'
export const renderTypes = ['link', 'submenu']
```

That narrow render contract is what lets `CommandPalette.jsx` flatten tool definitions into command groups without worrying about button chrome, sidepanel triggers, or toolbar separators.

## Dependencies

- No imports; surface metadata only.

## Dependents

- [`packages/storyboard/src/core/tools/surfaces/registry.js`](registry.js.md) re-exports its `id`.
- [`packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`](../../../../../../../../packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx) filters tools by `tool.surface === "command-palette"` and materializes them as palette rows.
- Handlers such as [`packages/storyboard/src/core/tools/handlers/flows.js`](../handlers/flows.js.md), [`packages/storyboard/src/core/tools/handlers/devtools.js`](../handlers/devtools.js.md), and [`packages/storyboard/src/core/tools/handlers/paletteTheme.js`](../handlers/paletteTheme.js.md) populate this surface with submenu data.

## Notes

This surface is metadata for overlay content, not an actual toolbar bar despite the surrounding “tools” naming.
