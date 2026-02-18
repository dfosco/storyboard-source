# `packages/core/src/loader.js`

<!--
source: packages/core/src/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The loader is the heart of the storyboard data system. It manages a module-level data index (scenes, objects, records) that is seeded at app startup via `init()`, and provides functions to load and resolve scene data with `$ref` and `$global` references. Scenes are the primary data context for pages — they compose objects into a complete data shape that components consume.

The loader is framework-agnostic with zero npm dependencies. It supports case-insensitive scene lookup, circular `$ref` detection, deep merging of `$global` data, and returns `structuredClone`d data to prevent consumer mutation of the index.

## Composition

**`init(index)`** — Seeds the data index. Called once at startup by the Vite data plugin's virtual module.

```js
export function init(index) {
  if (!index || typeof index !== 'object') {
    throw new Error('[storyboard-core] init() requires { scenes, objects, records }')
  }
  dataIndex = {
    scenes: index.scenes || {},
    objects: index.objects || {},
    records: index.records || {},
  }
}
```

**`loadScene(sceneName)`** — Loads a scene and resolves `$global` (root-level merges) and `$ref` (inline object replacement). Returns a `structuredClone` to prevent mutation.

```js
export function loadScene(sceneName = 'default') {
  // ... loads scene, handles $global merge, resolves $ref, clones
  return structuredClone(sceneData)
}
```

**`deepMerge(target, source)`** — Deep merges two objects. Source wins conflicts; arrays are replaced, not concatenated.

**`sceneExists(sceneName)`** — Case-insensitive check for scene existence.

**`listScenes()`** — Returns all registered scene names.

**`loadRecord(recordName)`** / **`findRecord(recordName, id)`** — Load record collections (arrays) and find individual entries by id. Both return clones.

Internal helpers:
- `loadDataFile(name, type)` — Resolves a data file from the index with case-insensitive fallback for scenes
- `resolveRefs(node, seen)` — Recursively resolves `$ref` objects with circular dependency detection

## Dependencies

No external dependencies. Pure JavaScript with no imports.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/devtools.js`](./devtools.js.md) — Imports `loadScene` for scene info panel
- [`packages/core/src/sceneDebug.js`](./sceneDebug.js.md) — Imports `loadScene` for debug display
- [`packages/core/src/viewfinder.js`](./viewfinder.js.md) — Imports `loadScene` for route resolution
- [`packages/react/src/context.jsx`](../../react/src/context.jsx.md) — Imports `loadScene`, `sceneExists`, `findRecord`, `deepMerge`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Imports `loadRecord`

## Notes

- The `$ref` resolution looks up objects first, then falls back to searching all types. This means object names take priority.
- Circular `$ref` chains throw immediately — the `seen` Set tracks visited names during resolution.
- `$global` entries that fail to load are silently warned (not thrown), allowing partial scene resolution.
