# `packages/storyboard/src/core/tools/handlers/hideToolbars.js`

<!--
source: packages/storyboard/src/core/tools/handlers/hideToolbars.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler contributes a command-palette action for toggling toolbar visibility without a dedicated button. Instead of rendering custom UI, it returns one computed action whose label reflects the current DOM class state on `document.documentElement`.

## Composition

```js
export async function handler() {
  return {
    getChildren() {
      const hidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
      return [{
        id: 'core/toggle-toolbars',
        label: hidden ? 'Show toolbars' : 'Hide toolbars',
        type: 'default',
        execute: () => {
          const isHidden = document.documentElement.classList.contains('storyboard-chrome-hidden')
          document.documentElement.classList.toggle('storyboard-chrome-hidden', !isHidden)
          document.documentElement.classList.remove('storyboard-chrome-completely-hidden')
        },
      }]
    },
  }
}
```

The execute callback mirrors the keyboard shortcut behavior, which keeps the palette action and direct shortcut in sync.

## Dependencies

- No imports; behavior is implemented entirely through DOM class toggles.

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes the handler for command-palette configuration.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
