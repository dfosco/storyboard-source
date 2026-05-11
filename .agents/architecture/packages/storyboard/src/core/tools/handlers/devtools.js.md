# `packages/storyboard/src/core/tools/handlers/devtools.js`

<!--
source: packages/storyboard/src/core/tools/handlers/devtools.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler builds the developer utilities submenu that hangs off the command palette or toolbar menus. It is the richest menu-oriented tool module in this group: instead of loading a custom component, it returns `getChildren()` closures that translate runtime state into a dynamic action list.

## Composition

```js
export async function handler(ctx) {
  let loader = null
  let hm = null
  let commentsAuth = null
  let prodMode = null
  let ff = null
  try { loader = await import('../../index.js') } catch {}
  try { hm = await import('../../index.js') } catch {}
  try { commentsAuth = await import('../../comments/auth.js') } catch {}
  try { prodMode = await import('../../utils/prodMode.js') } catch {}
  try { ff = await import('../../index.js') } catch {}

  return {
    getChildren: () => {
      const children = []
      // production mode toggle, flow info, reset params, hide mode,
      // logout, dev logs, canvas auto-reload, prototype auto-reload
      return children
    },
  }
}
```

The repeated defensive imports are deliberate: optional features can fail closed without breaking the rest of the menu. `ctx.showFlowInfoDialog` is the one injected callback from `CoreUIBar` used to open a raw flow-data dialog.

## Dependencies

- Optionally imports shared APIs from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).
- Optionally imports auth helpers from [`packages/storyboard/src/core/comments/auth.js`](../../../../../../../../packages/storyboard/src/core/comments/auth.js) and prod-mode helpers from [`packages/storyboard/src/core/utils/prodMode.js`](../../../../../../../../packages/storyboard/src/core/utils/prodMode.js). 

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) lazy-loads the submenu handler.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) passes `showFlowInfoDialog` into its context.
- Feature-flagged reload behaviors are consumed elsewhere, including [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx). 
- [`packages/storyboard/src/core/tools/handlers/devtools.test.js`](devtools.test.js.md) verifies the production-mode and reload toggles.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
