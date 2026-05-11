# `packages/storyboard/src/core/tools/handlers/theme.js`

<!--
source: packages/storyboard/src/core/tools/handlers/theme.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler is the toolbar-facing entry point for theme selection. Like several other simple handlers in this group, it keeps the declarative layer small by only identifying the tool and lazy-loading [`packages/storyboard/src/core/ui/ThemeMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/ThemeMenuButton.jsx). 

## Composition

```js
export const id = 'theme'

export async function component() {
  const mod = await import('../../ui/ThemeMenuButton.jsx')
  return mod.default
}
```

Theme state, setting persistence, and “apply theme to” behavior are all delegated to the loaded component and shared theme store.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/ThemeMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/ThemeMenuButton.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the handler.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
