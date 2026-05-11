# `packages/storyboard/src/core/tools/handlers/inspector.js`

<!--
source: packages/storyboard/src/core/tools/handlers/inspector.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler exists for side-effectful setup rather than custom rendering. When the inspector tool is present, it checks for `?inspect=` in the URL and proactively opens the side panel through [`packages/storyboard/src/core/stores/sidePanelStore.js`](../../../../../../../../packages/storyboard/src/core/stores/sidePanelStore.js); the actual button chrome can remain generic because the tool uses the standard sidepanel renderer.

## Composition

```js
export const id = 'inspector'

export async function setup() {
  const { openPanel } = await import('../../stores/sidePanelStore.js')

  try {
    const inspectParam = new URL(window.location.href).searchParams.get('inspect')
    if (inspectParam) openPanel('inspector')
  } catch {}
}
```

There is deliberately no `component()` export. Sidepanel tools use the generic trigger button provided by the render pipeline.

## Dependencies

- Dynamically imports [`packages/storyboard/src/core/stores/sidePanelStore.js`](../../../../../../../../packages/storyboard/src/core/stores/sidePanelStore.js).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the sidepanel setup module.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
