# `packages/storyboard/src/core/tools/handlers/create.js`

<!--
source: packages/storyboard/src/core/tools/handlers/create.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler turns workshop feature metadata into a configurable “Create” tool. It is the main example of a tool module using both `setup` and `guard`: `setup` materializes only the configured create actions that have overlays, and `guard` suppresses the button entirely when nothing renderable remains.

## Composition

```js
export async function setup(ctx) {
  const { config } = ctx
  const { features } = await import('../../workshop/features/registry.js')

  const createFeatures = (Array.isArray(config.actions) ? config.actions : [])
    .filter(a => a.feature)
    .map(a => {
      const feat = features[a.feature]
      if (!feat || !feat.overlayId || !feat.overlay) return null
      return {
        name: feat.name,
        label: a.label || feat.label,
        overlayId: feat.overlayId,
        overlay: feat.overlay,
      }
    })
    .filter(Boolean)

  return { features: createFeatures }
}

export async function guard(ctx) {
  const result = await setup(ctx)
  return result.features.length > 0
}
```

The component export lazy-loads `CreateMenuButton`, which receives the prepared feature list instead of having to re-resolve registry data itself.

## Dependencies

- Imports workshop feature definitions from [`packages/storyboard/src/core/workshop/features/registry.js`](../../../../../../../../packages/storyboard/src/core/workshop/features/registry.js).
- Dynamically imports [`packages/storyboard/src/core/ui/CreateMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CreateMenuButton.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) registers the handler for create-menu tool definitions.
- [`packages/storyboard/src/core/ui/CreateMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CreateMenuButton.jsx) consumes the prepared `features` returned from `setup()`.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
