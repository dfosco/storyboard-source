# `packages/core/src/loader.js`

<!--
source: packages/core/src/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

The data loader is the heart of the storyboard data system. It manages a module-level **data index** (scenes, objects, records) and provides functions to initialize that index, load scene files with full `$ref` / `$global` resolution, and retrieve record collections. All functions are framework-agnostic and have zero npm dependencies.

The index is seeded once at app startup via `init()`, typically called automatically by the Vite data plugin's generated virtual module. After initialization, `loadScene()` recursively resolves references, merges globals, and returns a deep-cloned result that is safe from consumer mutation.

## Composition

### Module state

```js
let dataIndex = { scenes: {}, objects: {}, records: {} }
```

A singleton holding all pre-parsed data files, populated by `init()`.

### Exported functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `init` | `(index: { scenes, objects, records }) → void` | Seeds the data index. Throws if argument is not an object. |
| `loadScene` | `(sceneName?: string) → object` | Loads a scene by name (default: `'default'`). Resolves `$global` merges and `$ref` replacements. Returns a `structuredClone`. |
| `sceneExists` | `(sceneName: string) → boolean` | Case-insensitive check for scene existence. |
| `loadRecord` | `(recordName: string) → Array` | Returns a cloned array from the records index. Throws if not found or not an array. |
| `findRecord` | `(recordName: string, id: string) → object\|null` | Finds a single entry by `id` within a record collection. |
| `deepMerge` | `(target, source) → object` | Deep merges two objects; source wins. Arrays are replaced, not concatenated. |

### Internal helpers

| Function | Purpose |
|----------|---------|
| `loadDataFile(name, type?)` | Looks up a data file by name in the index. Falls back to case-insensitive search for scenes. |
| `resolveRefs(node, seen?)` | Recursively walks a data tree and replaces `{ "$ref": "name" }` nodes with the referenced object data. Detects circular refs via a `Set`. |

### Scene loading flow

```
loadScene("default")
  → loadDataFile("default", "scenes")
  → process $global: merge each named object into root
  → resolveRefs(): replace $ref nodes recursively
  → structuredClone() for mutation safety
```

## Dependencies

None — this module has no imports. It is entirely self-contained.

## Dependents

**Direct (internal) imports:**

- [`packages/core/src/index.js`](./index.js.md) — re-exports `init`, `loadScene`, `sceneExists`, `loadRecord`, `findRecord`, `deepMerge`
- `packages/core/src/devtools.js` — `import { loadScene } from './loader.js'`
- `packages/core/src/sceneDebug.js` — `import { loadScene } from './loader.js'`

**Indirect consumers** (via `@dfosco/storyboard-core` barrel):

- [`packages/react/src/context.jsx`](../../react/src/context.jsx.md) — `loadScene`, `sceneExists`, `findRecord`, `deepMerge`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — `loadRecord`
- [`packages/react/src/vite/data-plugin.js`](../../react/src/vite/data-plugin.js.md) — generates call to `init`
- [`packages/react-primer/src/SceneDebug.jsx`](../../react-primer/src/SceneDebug.jsx.md) — `loadScene`
- [`packages/react-primer/src/DevTools/DevTools.jsx`](../../react-primer/src/DevTools/DevTools.jsx.md) — `loadScene`

## Notes

- **Case-insensitive fallback:** `loadDataFile` and `sceneExists` perform a case-insensitive search for scenes. This allows page-scene auto-matching to work when file casing doesn't match exactly (e.g., `Overview` vs `overview`).
- **Circular $ref detection:** `resolveRefs` tracks visited names in a `Set` and throws immediately on re-entry, preventing infinite loops.
- **Mutation safety:** `structuredClone` is called once at the boundary of `loadScene` and `loadRecord`, rather than per-node, because `resolveRefs` already builds new objects internally.
