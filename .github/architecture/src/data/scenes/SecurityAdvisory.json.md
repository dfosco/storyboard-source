# `src/data/scenes/SecurityAdvisory.json`

<!--
source: src/data/scenes/SecurityAdvisory.json
category: data
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Scene data file for the Security Advisory page (`/SecurityAdvisory`). This scene is auto-loaded via page-scene matching in [`StoryboardProvider`](../../../storyboard/context.jsx.md) — when the user navigates to `/SecurityAdvisory`, the provider detects that `scenes/SecurityAdvisory.json` exists and loads it automatically without a `?scene=` parameter.

It composes data from security-advisory-specific navigation and advisory detail objects.

## Composition

```json
{
  "$global": ["../objects/security-advisory-navigation"],
  "advisory": { "$ref": "../objects/security-advisory" }
}
```

After resolution by [`loadScene()`](../../../storyboard/core/loader.js.md):
- The `$global` directive merges `security-advisory-navigation.json` into the root, providing page-specific navigation data
- The `$ref` inlines `security-advisory.json` as the `advisory` key

## Dependencies

- `src/data/objects/security-advisory-navigation.json` — Navigation data (via `$global`)
- `src/data/objects/security-advisory.json` — Advisory detail data (via `$ref`)

## Dependents

- [`src/pages/SecurityAdvisory.jsx`](../../../pages/SecurityAdvisory.jsx) — auto-loaded as the page's scene data
- [`src/storyboard/core/loader.js`](../../../storyboard/core/loader.js.md) — loaded and resolved at runtime
