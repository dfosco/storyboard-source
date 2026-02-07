# `src/storyboard/core/dotPath.js`

<!--
source: src/storyboard/core/dotPath.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A small utility that resolves dot-notation paths (e.g., `'user.profile.name'` or `'projects.0'`) against a JavaScript object. This is the core accessor used by `useSceneData()` to let components retrieve nested values from scene data without manual property drilling.

It handles edge cases gracefully — `null`/`undefined` objects, non-string paths, empty paths, and missing intermediate segments all return `undefined` instead of throwing.

## Composition

Single exported function:

```js
export function getByPath(obj, path) {
  if (obj == null || typeof path !== 'string' || path === '') {
    return undefined
  }

  const segments = path.split('.')
  let current = obj

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[segment]
  }

  return current
}
```

Works with both object keys and array indices (via numeric string segments like `'0'`). Returns `undefined` at the first missing segment rather than throwing.

## Dependencies

None — pure utility with no imports.

## Dependents

- `src/storyboard/hooks/useSceneData.js` — uses `getByPath` to resolve user-supplied paths
- `src/storyboard/index.js` — re-exports `getByPath`
