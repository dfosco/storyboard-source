# `packages/storyboard/src/core/tools/handlers/devtools.test.js`

<!--
source: packages/storyboard/src/core/tools/handlers/devtools.test.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This test file protects the behavioral contract of [`the devtools handler`](devtools.js.md). It verifies that the submenu exposes the production-mode toggle only in local dev, and that the two auto-reload flags appear with the intended defaults.

## Composition

```js
import { handler as createDevtoolsHandler } from './devtools.js'

function getProdModeItem(children) {
  return children.find(item => item.id === 'core/prod-mode')
}

it('shows the toggle in local dev', async () => {
  window.__SB_LOCAL_DEV__ = true
  const devtools = await createDevtoolsHandler({})
  const prodModeItem = getProdModeItem(devtools.getChildren())
  expect(prodModeItem.active).toBe(false)
})
```

The helper selectors keep the assertions focused on submenu item shape instead of unrelated menu entries. The remaining tests repeat that pattern for `core/canvas-auto-reload` and `core/prototype-auto-reload`.

## Dependencies

- Imports the production code from [`packages/storyboard/src/core/tools/handlers/devtools.js`](devtools.js.md).

## Dependents

- This file is executed by the repository's Vitest test suite; no runtime source file imports it.

## Notes

Unlike the other files in `handlers/`, this is a verification artifact rather than a toolbar handler module. It still belongs with the group because it documents the expected behavior of the devtools menu.
