# `packages/storyboard/src/core/tools/handlers/flows.js`

<!--
source: packages/storyboard/src/core/tools/handlers/flows.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler turns prototype flow metadata into a switcher menu. It is the main place where the declarative tools layer intersects with routing rules: it computes the active flow from URL state, preserves branch-prefixed deploy paths, and emits radio-style menu items that navigate to the chosen flow.

## Composition

```js
export async function handler(ctx) {
  const loader = await import('../../index.js')
  const { basePath = '/' } = ctx

  return {
    getChildren: () => {
      // trim basePath, preserve optional branch-- prefix,
      // derive active flow, then map available flows to radio items
    },
  }
}

export async function component() {
  const mod = await import('../../ui/ActionMenuButton.jsx')
  return mod.default
}
```

Inside `getChildren()`, the handler resolves `flow`/`scene` query params first, then falls back to page-name and prototype-name conventions before building `href` values with `resolveFlowRoute()`.

## Dependencies

- Imports flow lookup helpers from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).
- Dynamically imports [`packages/storyboard/src/core/ui/ActionMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/ActionMenuButton.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes the lazy loader.
- [`packages/storyboard/src/internals/hooks/useFlows.js`](../../../../../../../../packages/storyboard/src/internals/hooks/useFlows.js) relies on the same lower-level route helpers this menu uses.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
