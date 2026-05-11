# `packages/storyboard/src/core/tools/surfaces/mainToolbar.js`

<!--
source: packages/storyboard/src/core/tools/surfaces/mainToolbar.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This surface defines the primary floating toolbar rendered at the bottom-right of the app chrome. It supports the full set of standard toolbar render types—buttons, menus, sidepanels, and separators—because it is the main host for always-visible command affordances.

## Composition

```js
export const id = 'command-toolbar'
export const label = 'Command Toolbar'
export const position = 'bottom-right'
export const renderTypes = ['button', 'menu', 'sidepanel', 'separator']
```

The file also documents an ordering contract: config order is reversed at render time so the first JSON entry lands leftmost, while the command menu trigger stays pinned on the far right outside the tool list.

## Dependencies

- No imports; surface metadata only.

## Dependents

- [`packages/storyboard/src/core/tools/surfaces/registry.js`](registry.js.md) re-exports its `id`.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) filters tools by `tool.surface === "command-toolbar"` and renders them here.

## Notes

Most built-in toolbar buttons ultimately target this surface, including triggers backed by [`packages/storyboard/src/core/tools/handlers/commandPalette.js`](../handlers/commandPalette.js.md), [`packages/storyboard/src/core/tools/handlers/theme.js`](../handlers/theme.js.md), and [`packages/storyboard/src/core/tools/handlers/hideChrome.js`](../handlers/hideChrome.js.md). 
