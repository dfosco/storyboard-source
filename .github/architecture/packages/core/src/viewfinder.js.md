# `packages/core/src/viewfinder.js`

<!--
source: packages/core/src/viewfinder.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides utility functions for the viewfinder feature: a deterministic hash function for seeding generative placeholders, and a route resolver that maps scene names to their target routes. The route resolver supports three strategies: matching against known route names (case-insensitive), reading an explicit `route` key from scene data, and falling back to the root path.

## Composition

**`hash(str)`** — Deterministic hash from a string. Returns a non-negative number.

```js
export function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
```

**`resolveSceneRoute(sceneName, knownRoutes?)`** — Resolves the target route path for a scene. Returns a full path with `?scene=` param.

Resolution order:
1. Case-insensitive match against `knownRoutes` array
2. Explicit `route` key in scene data (loaded via `loadScene`)
3. Fallback to `/?scene={sceneName}`

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadScene` for reading the `route` key from scene data

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `hash` and `resolveSceneRoute`
