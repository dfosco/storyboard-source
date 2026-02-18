# `packages/core/src/dotPath.js`

<!--
source: packages/core/src/dotPath.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides dot-notation path utilities for reading, writing, and cloning nested data structures. These are the fundamental accessors used throughout the storyboard system to navigate scene data by string paths like `'user.profile.name'` or `'projects.0'`.

## Composition

### Exports

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getByPath` | `(obj, path: string) → any` | Resolves a dot-notation path against an object. Returns `undefined` if any segment is missing or the input is nullish. |
| `setByPath` | `(obj, path: string, value) → void` | Sets a value at a dot-notation path, **mutating** the target object. Auto-creates intermediate objects or arrays (numeric segments trigger array creation). |
| `deepClone` | `(val) → any` | Deep-clones plain objects and arrays. Non-object primitives pass through unchanged. |

### Implementation details

**`getByPath`** splits the path on `.` and walks segment-by-segment, returning `undefined` on any null/non-object intermediate:

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

**`setByPath`** walks to the penultimate segment, creating intermediates as needed. If the next segment is numeric, it creates an array; otherwise an object:

```js
if (current[seg] == null || typeof current[seg] !== 'object') {
  current[seg] = /^\d+$/.test(segments[i + 1]) ? [] : {}
}
```

**`deepClone`** is a recursive manual clone that handles arrays and plain objects only — no support for `Date`, `Map`, `Set`, etc. For full structured cloning, `loader.js` uses `structuredClone` at the boundary instead.

## Dependencies

None — this module has no imports.

## Dependents

**Direct (internal) import:**

- [`packages/core/src/index.js`](./index.js.md) — re-exports `getByPath`, `setByPath`, `deepClone`

**Indirect consumers** (via `@dfosco/storyboard-core` barrel):

- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — `getByPath`, `deepClone`, `setByPath`
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — `getByPath`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — `deepClone`, `setByPath`
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — `getByPath`

## Notes

- `setByPath` **mutates** its target. Callers (e.g., `useSceneData`) typically clone the object first before applying overrides with `setByPath`.
- `deepClone` is intentionally simple and only handles plain objects and arrays. Complex types are not expected in scene data.
