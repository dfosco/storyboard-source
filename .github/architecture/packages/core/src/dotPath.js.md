# `packages/core/src/dotPath.js`

<!--
source: packages/core/src/dotPath.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides dot-notation path utilities for reading, writing, and cloning nested data structures. These are the fundamental building blocks for the override system — every hook that reads or writes scene data at a specific path (like `useSceneData('user.profile.name')` or `useOverride('settings.theme')`) depends on these functions.

## Composition

**`getByPath(obj, path)`** — Resolves a dot-notation path against an object. Returns `undefined` for missing segments.

```js
export function getByPath(obj, path) {
  if (obj == null || typeof path !== 'string' || path === '') return undefined
  const segments = path.split('.')
  let current = obj
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[segment]
  }
  return current
}
```

**`setByPath(obj, path, value)`** — Sets a value at a dot-notation path, mutating the object. Auto-creates intermediate objects or arrays based on whether the next segment is numeric.

**`deepClone(val)`** — Deep-clones arrays and plain objects. Primitives pass through unchanged.

## Dependencies

None — pure utility module with no imports.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all three functions
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Uses `getByPath`, `setByPath`, `deepClone` for scene data resolution and override merging
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Uses `getByPath` to read scene defaults
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — Uses `getByPath` to read scene defaults
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Uses `deepClone` and `setByPath` for record override merging
