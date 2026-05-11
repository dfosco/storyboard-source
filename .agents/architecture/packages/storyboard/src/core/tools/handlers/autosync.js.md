# `packages/storyboard/src/core/tools/handlers/autosync.js`

<!--
source: packages/storyboard/src/core/tools/handlers/autosync.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler is the UI entry point for the local-only autosync workflow. Rather than embedding autosync logic in the tool module, it lazily mounts [`packages/storyboard/src/core/ui/AutosyncMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/AutosyncMenuButton.jsx), keeping the declarative tool layer thin.

## Composition

```js
export const id = 'autosync'

export async function component() {
  const mod = await import('../../ui/AutosyncMenuButton.jsx')
  return mod.default
}
```

The module advertises only a component export, so all behavior lives in the button component and the autosync services it invokes.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/ui/AutosyncMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/AutosyncMenuButton.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes it as a lazy core handler.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
