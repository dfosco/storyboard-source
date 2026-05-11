# `packages/storyboard/src/core/tools/handlers/featureFlags.js`

<!--
source: packages/storyboard/src/core/tools/handlers/featureFlags.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler exposes the feature-flag store as a dynamic submenu. It is a pure menu handler: it queries the flag registry at render time and returns one toggle row per known flag, which keeps the UI automatically in sync as new flags are added to the central store.

## Composition

```js
export async function handler() {
  const ff = await import('../../index.js')

  return {
    getChildren: () =>
      ff.getFlagKeys().map(key => ({
        id: `flags/${key}`,
        label: key,
        type: 'toggle',
        active: ff.getFlag(key),
        execute: () => ff.toggleFlag(key),
      })),
  }
}
```

Because the menu is derived from `getFlagKeys()`, the handler does not need per-flag maintenance code.

## Dependencies

- Imports flag helpers from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes the loader under `feature-flags`.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
