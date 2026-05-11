# `packages/storyboard/src/core/data/dotPath.js`
<!--
source: packages/storyboard/src/core/data/dotPath.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Provides three pure utility functions for working with dot-notation paths (`"user.profile.name"`, `"projects.0"`) against plain JavaScript objects. These are the primitives that power `useFlowData(path)` — consumers pass a dot path to select a nested value from the loaded flow data.

## Composition

```js
// Read a value at a dot-notation path
export function getByPath(obj, path) {
  const segments = path.split('.')
  let current = obj
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[segment]
  }
  return current
}

// Set a value at a dot-notation path (mutating)
export function setByPath(obj, path, value) {
  const segments = path.split('.')
  // Walk to the parent, creating intermediaries as needed
  // Detects array indices (/^\d+$/) to create [] vs {}
  current[lastSegment] = value
}

// Deep-clone arrays and plain objects (arrays and objects only, primitives returned as-is)
export function deepClone(val) {
  if (Array.isArray(val)) return val.map(deepClone)
  if (val !== null && typeof val === 'object') { /* shallow copy + recurse */ }
  return val
}
```

## Dependencies

None — pure JavaScript.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md) — re-exports `getByPath`, `setByPath`, `deepClone`
- `packages/storyboard/src/internals/hooks/useSceneData.js` — uses `getByPath` to select nested flow data
- `packages/storyboard/src/internals/hooks/useOverride.js` — uses `getByPath`/`setByPath` for hash param access
- `packages/storyboard/src/core/data/dotPath.test.js` — unit tests

## Notes

- `getByPath` returns `undefined` (not throws) for any missing path — consistent with optional chaining semantics.
- `setByPath` mutates its target object; callers are responsible for cloning beforehand when immutability is required.
- Array index access works via numeric string segments: `getByPath(data, "items.0.name")` resolves `data.items[0].name`.
