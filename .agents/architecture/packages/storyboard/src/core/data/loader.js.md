# `packages/storyboard/src/core/data/loader.js`

<!--
source: packages/storyboard/src/core/data/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`loader.js` is the runtime data engine for the storyboard system. It maintains a module-level data index (seeded once at app startup via `init()`) and provides synchronous functions to load flows, objects, and records from that index. The loader handles all data composition: `$ref` resolution (inline object substitution at any nesting depth), `$global` merging (root-level object merge into a flow), prototype scoping (name resolution that tries `Proto/name` before `name`), and deep-clone isolation (consumers receive copies, never references to the shared index).

The loader is intentionally framework-agnostic — zero npm dependencies. It is the single source of truth for all data at runtime. It does not fetch from the network; all data was pre-parsed at build time by [`data-plugin.js`](../../internals/vite/data-plugin.js.md) and injected into the index via `init()`.

## Composition

### `init({ flows, objects, records, prototypes, folders, canvases, stories })`

Replaces the module-level `dataIndex` singleton. Called once on startup from the generated virtual module:

```js
export function init(index) {
  dataIndex = {
    flows: index.flows || index.scenes || {},  // scenes alias for compat
    objects: index.objects || {},
    records: index.records || {},
    prototypes: index.prototypes || {},
    folders: index.folders || {},
    canvases: index.canvases || {},
    stories: index.stories || {},
  }
}
```

### `loadFlow(flowName = 'default')`

The primary data loading API. Resolves `$global` (root merge) and `$ref` (deep inline substitution), applies prototype scoping, and returns a deep clone:

```js
export function loadFlow(flowName = 'default') {
  const scope = flowName.includes('/') ? flowName.split('/')[0] : null
  let flowData = structuredClone(loadDataFile(flowName, 'flows'))

  // $global: array of names merged into root (flow values win on conflict)
  if (Array.isArray(flowData.$global)) {
    const globalNames = flowData.$global
    delete flowData.$global
    let mergedGlobals = {}
    for (const name of globalNames) {
      const resolvedName = scope ? resolveObjectName(scope, name) : name
      let globalData = loadDataFile(resolvedName)
      globalData = resolveRefs(globalData, new Set(), scope)
      mergedGlobals = deepMerge(mergedGlobals, globalData)
    }
    flowData = deepMerge(mergedGlobals, flowData)  // flow wins on conflict
  }

  flowData = resolveRefs(flowData, new Set(), scope)
  return structuredClone(flowData)
}
```

### `$ref` resolution via `resolveRefs(node, seen, scope)`

Recursively walks any JSON value and replaces `{ "$ref": "name" }` objects with the resolved object data:

```js
function resolveRefs(node, seen = new Set(), scope = null) {
  if (node.$ref && typeof node.$ref === 'string') {
    const refName = node.$ref
    const resolvedRef = scope ? resolveObjectName(scope, refName) : refName
    if (seen.has(resolvedRef)) throw new Error(`Circular $ref detected: ${refName}`)
    seen.add(resolvedRef)
    const refData = loadDataFile(resolvedRef, 'objects')
    return resolveRefs(refData, seen, scope)
  }
  // recurse into arrays and plain objects...
}
```

### Name resolution helpers

```js
// Tries "Proto/name" first, falls back to "name"
export function resolveFlowName(scope, name)
export function resolveRecordName(scope, name)
export function resolveObjectName(scope, name)
```

### Other exports

```js
export function loadRecord(recordName)    // returns cloned array
export function findRecord(name, id)      // single entry by .id field
export function loadObject(name, scope?)  // resolves $refs, returns clone
export function flowExists(name)          // case-insensitive check
export function listFlows()              // all flow names
export function getFlowsForPrototype(name) // flows scoped to a prototype
export function listPrototypes()         // prototype names from .prototype.json
export function getPrototypeMetadata(name)
export function listFolders(), getFolderMetadata(name)
export function listCanvases(), getCanvasData(name)
export function listStories(), getStoryData(name)
export function deepMerge(target, source) // shallow-merges objects, replaces arrays
```

## Dependencies

None — zero npm dependencies. Pure JavaScript.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md) — re-exports all loader functions
- [`packages/storyboard/src/core/data/viewfinder.js`](./viewfinder.js.md) — imports `loadFlow`, `listFlows`, `listPrototypes`, etc.
- [`packages/storyboard/src/internals/context.jsx`](../../internals/context.jsx.md) — calls `loadFlow`, `flowExists`, `findRecord`, `resolveFlowName`, `getPrototypeMetadata`
- `packages/storyboard/src/core/ui/CoreUIBar.jsx` — calls `loadFlow` for dev tools display
- `packages/storyboard/src/core/stores/configStore.js`, `toolbarConfigStore.js`, `paletteProviders.js` — use loader for prototype-scoped data
- `packages/storyboard/src/core/data/loader.test.js` — unit tests

## Notes

- `dataIndex` is a module singleton. There is intentionally no getter for it — all access is through the typed load functions which return clones.
- `loadDataFile` includes a case-insensitive fallback for flow names, which handles the common case where a page is `/Dashboard` and the flow file is `dashboard.flow.json` (or vice versa).
- `structuredClone` is used at the load boundary (before and after resolution) so mutations by consumers never corrupt the index.
- `deepMerge` replaces arrays (not concatenates) — this is intentional to allow flow data to override global object arrays rather than merging with them.
- `getStoryData` has a fallback that tries the basename of a scoped name (e.g. `"folder/button"` → `"button"`) for cases where story names haven't been fully scoped yet.
