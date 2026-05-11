# `packages/storyboard/src/core/tools/handlers/paletteTheme.js`

<!--
source: packages/storyboard/src/core/tools/handlers/paletteTheme.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler exposes theme choices inside the command palette. It complements [`the toolbar theme handler`](theme.js.md) by translating the shared theme store into palette-friendly toggle items plus one bridge action that asks the toolbar theme menu to open its settings sub-menu.

## Composition

```js
export async function handler() {
  const { themeState, setTheme, THEMES } = await import('../../index.js')

  return {
    getChildren() {
      const current = themeState.theme
      return [
        ...THEMES.map(t => ({
          id: `theme:${t.value}`,
          label: t.name,
          type: 'toggle',
          active: current === t.value,
          execute: () => setTheme(t.value),
        })),
        {
          id: 'theme:settings',
          label: 'Theme settings',
          execute: () => {
            document.dispatchEvent(new CustomEvent('storyboard:open-theme-settings'))
          },
        },
      ]
    },
  }
}
```

The custom event is the cross-surface handshake: the palette can open toolbar settings without directly importing the toolbar component.

## Dependencies

- Imports theme state from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes the handler.
- [`packages/storyboard/src/core/ui/ThemeMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/ThemeMenuButton.jsx) listens for the `storyboard:open-theme-settings` event emitted here.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
