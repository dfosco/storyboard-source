# `packages/react/src/vite/data-plugin.js`

<!--
source: packages/react/src/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vite plugin that powers the Storyboard data pipeline. It scans the entire repository for data files (`*.scene.json`, `*.object.json`, `*.record.json`), validates name uniqueness, pre-parses JSONC content at build time, and generates a virtual module (`virtual:storyboard-data-index`) that seeds the core data index. This eliminates any runtime file I/O or JSON parsing — all data is baked into the JavaScript bundle.

## Composition

### Constants

```js
const VIRTUAL_MODULE_ID = 'virtual:storyboard-data-index'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID
const SUFFIXES = ['scene', 'object', 'record']
const GLOB_PATTERN = '**/*.{scene,object,record}.{json,jsonc}'
```

### Internal functions

**`parseDataFile(filePath)`** — Extracts name and suffix from a filename:

```js
// "src/data/default.scene.json" → { name: "default", suffix: "scene" }
// "anywhere/posts.record.jsonc" → { name: "posts", suffix: "record" }
```

**`buildIndex(root)`** — Scans the repo (excluding `node_modules/`, `dist/`, `.git/`) and builds a `{ scene: {}, object: {}, record: {} }` index mapping names to absolute paths. Throws a hard build error on duplicate `name.suffix` pairs.

**`generateModule(index)`** — Produces JavaScript source code that:
1. Reads and JSONC-parses each data file at build time
2. Emits pre-parsed JavaScript object literals (`const _d0 = {...}`)
3. Calls `init({ scenes, objects, records })` from `@dfosco/storyboard-core`
4. Exports `scenes`, `objects`, `records`, and a combined `index`

### Plugin object (`storyboardDataPlugin()`)

Default export. Returns a Vite plugin with `enforce: 'pre'`:

| Hook | Behavior |
|------|----------|
| `configResolved` | Captures project root |
| `resolveId` | Resolves `virtual:storyboard-data-index` to internal ID |
| `load` | Lazily builds index, generates virtual module source |
| `configureServer` | Watches for data file add/remove/change in dev mode; invalidates virtual module and triggers full reload |
| `buildStart` | Clears cached index on each build |

### Dev mode file watching

```js
const invalidate = (filePath) => {
  const parsed = parseDataFile(filePath)
  if (!parsed) return
  index = null
  const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
  if (mod) {
    server.moduleGraph.invalidateModule(mod)
    server.ws.send({ type: 'full-reload' })
  }
}
watcher.on('add', invalidate)
watcher.on('unlink', invalidate)
watcher.on('change', invalidate)
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `node:fs` | Read data files at build time |
| `node:path` | Path resolution and basename extraction |
| `glob` | `globSync` for file discovery |
| `jsonc-parser` | Parse JSONC (JSON with comments) |
| `@dfosco/storyboard-core` | `init()` — called in the generated virtual module |

## Dependents

- `vite.config.js` — imports as `storyboardData` from `@dfosco/storyboard-react/vite` and registers it as a Vite plugin
- [`packages/react/src/context.jsx`](../context.jsx.md) — imports the generated `virtual:storyboard-data-index` module as a side effect

## Notes

- Both `.json` and `.jsonc` extensions are supported. JSONC allows comments in data files, which is useful for documenting complex scene structures.
- The duplicate detection is global across the entire repo — two files named `default.scene.json` in different directories will cause a hard build error with both paths printed.
- In dev mode, file watching triggers a `full-reload` (not HMR) because the virtual module affects the entire data layer.
- The plugin uses `enforce: 'pre'` so the virtual module is available before other plugins process imports.
