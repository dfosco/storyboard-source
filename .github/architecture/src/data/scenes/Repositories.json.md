# `src/data/scenes/Repositories.json`

<!--
source: src/data/scenes/Repositories.json
category: data
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Scene data file for the Repositories page (`/Repositories`). This scene is auto-loaded via page-scene matching in [`StoryboardProvider`](../../../storyboard/context.jsx.md) — when the user navigates to `/Repositories`, the provider detects that `scenes/Repositories.json` exists and loads it automatically without a `?scene=` parameter.

It composes data from the "Finch Pearl" design variant's navigation and repository objects.

## Composition

```json
{
  "$global": ["../objects/finch-pearl-navigation"],
  "repositories": { "$ref": "../objects/finch-pearl-repositories" }
}
```

After resolution by [`loadScene()`](../../../storyboard/core/loader.js.md):
- The `$global` directive merges `finch-pearl-navigation.json` into the root, providing navigation data
- The `$ref` inlines `finch-pearl-repositories.json` as the `repositories` key

## Dependencies

- `src/data/objects/finch-pearl-navigation.json` — Navigation data (via `$global`)
- `src/data/objects/finch-pearl-repositories.json` — Repository list data (via `$ref`)

## Dependents

- [`src/pages/Repositories.jsx`](../../../pages/Repositories.jsx) — auto-loaded as the page's scene data
- [`src/storyboard/core/loader.js`](../../../storyboard/core/loader.js.md) — loaded and resolved at runtime
