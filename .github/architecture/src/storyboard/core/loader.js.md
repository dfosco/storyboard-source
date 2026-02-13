# `src/storyboard/core/loader.js`

<!--
source: src/storyboard/core/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

The scene loader is the data engine of the storyboard system. It loads scene JSON files from `src/data/scenes/`, resolves `$global` and `$ref` directives, and returns a fully merged, flattened data object. This is the only module that reads from the data layer — all other storyboard code accesses data through the context provided by the loader's output.

The loader supports JSONC (JSON with comments) via `jsonc-parser`, uses Vite's `import.meta.glob` for eager loading of all data files at build time, and detects circular `$ref` chains to prevent infinite loops.

## Composition

**`loadScene(sceneName)`** — the main entry point. Loads a scene file, processes `$global` merges, then resolves all `$ref` objects recursively:

```js
export async function loadScene(sceneName = 'default') {
  const scenePath = `scenes/${sceneName}`
  let sceneData = loadDataFile(scenePath)

  // 1. Merge $global references into root (scene values win)
  if (Array.isArray(sceneData.$global)) {
    const globalPaths = sceneData.$global
    delete sceneData.$global

    let mergedGlobals = {}
    for (const ref of globalPaths) {
      const resolved = resolveRefPath(ref, baseDir)
      let globalData = loadDataFile(resolved)
      globalData = await resolveRefs(globalData, refDir)
      mergedGlobals = deepMerge(mergedGlobals, globalData)
    }
    sceneData = deepMerge(mergedGlobals, sceneData)
  }

  // 2. Resolve $ref objects throughout the tree
  sceneData = await resolveRefs(sceneData, baseDir)
  return sceneData
}
```

**`deepMerge(target, source)`** — deep merges two objects. Source wins on conflicts, arrays are replaced (not concatenated):

```js
function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (/* both values are plain objects */) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      result[key] = sourceValue
    }
  }
  return result
}
```

**`resolveRefs(node, baseDir, seen)`** — recursively walks the data tree replacing `{ "$ref": "path" }` objects with the referenced file's contents. Tracks visited paths in a `Set` for circular reference detection:

```js
if (node.$ref && typeof node.$ref === 'string') {
  const resolved = resolveRefPath(node.$ref, baseDir)
  if (seen.has(resolved)) {
    throw new Error(`Circular $ref detected: ${resolved}`)
  }
  seen.add(resolved)
  const refData = loadDataFile(resolved)
  return resolveRefs(refData, refDir, seen)
}
```

**`sceneExists(sceneName)`** — checks whether a scene file exists for the given name, with case-insensitive fallback:

```js
export function sceneExists(sceneName) {
  const jsoncKey = `../../data/scenes/${sceneName}.jsonc`
  const jsonKey = `../../data/scenes/${sceneName}.json`
  if ((dataModules[jsoncKey] ?? dataModules[jsonKey]) != null) return true
  const match = findSceneKey(sceneName)
  return match != null
}
```

**`findSceneKey(sceneName)`** — case-insensitive lookup for a scene module key in `dataModules`. Returns the matching key or `null`.

**`loadDataFile(dataPath)`** — loads a data file by path (without extension), trying `.jsonc` then `.json`, parsing with JSONC parser. Includes a case-insensitive fallback for scene files.

**`dataModules`** — all data files eagerly loaded at build time via:

```js
const dataModules = import.meta.glob('../../data/**/*.{json,jsonc}', {
  eager: true,
  query: '?raw',
  import: 'default',
})
```

## Dependencies

- `jsonc-parser` — `parse` function for JSONC support
- Vite's `import.meta.glob` — Build-time eager import of all data files

## Dependents

- [`src/storyboard/context.jsx`](../context.jsx.md) — calls `loadScene()` and `sceneExists()` in the provider
- [`src/storyboard/components/SceneDebug.jsx`](../components/SceneDebug.jsx.md) — calls `loadScene()` directly for debug display
- [`src/storyboard/index.js`](../index.js.md) — re-exports `loadScene` and `sceneExists`

## Notes

- Data files are loaded eagerly at build time via `import.meta.glob` with `{ eager: true, query: '?raw' }`. This means all JSON/JSONC files under `src/data/` are bundled regardless of whether a scene references them.
- The `$global` directive is processed before `$ref` resolution, so global objects can themselves contain `$ref` entries that will be resolved.
- Circular `$ref` detection uses a shared `Set` within a single `resolveRefs` call tree. Each `$global` reference is resolved independently (no cross-global cycle detection).
- Scene files like [`src/data/scenes/default.json`](../../data/scenes/default.json.md) use `$ref` to compose reusable objects from `src/data/objects/`.
- Scene name lookup includes a case-insensitive fallback: `findSceneKey()` scans all module keys to find a case-insensitive match, enabling page-scene matching regardless of file name casing.
- `deepMerge` is also exported for use by other modules.
