# `packages/storyboard/src/core/tools/handlers/hideChrome.js`

<!--
source: packages/storyboard/src/core/tools/handlers/hideChrome.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler mounts the dedicated chrome-visibility toggle button. Its entire job is to lazy-load [`packages/storyboard/src/core/ui/HideChromeTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/HideChromeTrigger.jsx) so the hide/show affordance can be configured like any other toolbar tool.

## Composition

```js
export const id = 'hide-chrome'

export async function component() {
  const mod = await import('../../ui/HideChromeTrigger.jsx')
  return mod.default
}
```

There is no runtime gating here; whether the button appears is controlled by tool config and higher-level UI logic in `CoreUIBar`.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/HideChromeTrigger.jsx`](../../../../../../../../packages/storyboard/src/core/ui/HideChromeTrigger.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the handler.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) gives the hide-chrome tool special placement treatment.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
