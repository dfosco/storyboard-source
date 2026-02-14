# `src/storyboard/vite/data-plugin.js`

<!--
source: src/storyboard/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A custom Vite plugin that implements suffix-based data file discovery for the storyboard system. It scans the entire repository for files matching `*.scene.json`, `*.object.json`, and `*.record.json` (or `.jsonc`), validates that no two files share the same name+suffix combination, and generates a `virtual:storyboard-data-index` module that the [`loader`](../core/loader.js.md) imports to access all data at runtime.

This plugin replaces the previous `import.meta.glob`-based approach that required data files to live in specific folders (`src/data/scenes/`, `src/data/objects/`). Data files can now live anywhere in the repository — the plugin discovers them by suffix. In dev mode, it watches for file additions and removals and triggers a full reload when the data file set changes.

## Composition

**`storyboardDataPlugin()`** — the exported Vite plugin factory. Returns a plugin object with `enforce: 'pre'`:

```js
export default function storyboardDataPlugin() {
  return {
    name: 'storyboard-data',
    enforce: 'pre',
    configResolved(config) { root = config.root },
    resolveId(id) { /* resolves virtual:storyboard-data-index */ },
    load(id) { /* builds index and generates module */ },
    configureServer(server) { /* watches for data file changes */ },
    buildStart() { index = null },
  }
}
```

**`parseDataFile(filePath)`** — extracts the name and type suffix from a data file path:

```js
function parseDataFile(filePath) {
  const base = path.basename(filePath)
  const match = base.match(/^(.+)\.(scene|object|record)\.(jsonc?)$/)
  if (!match) return null
  return { name: match[1], suffix: match[2], ext: match[3] }
}
// "src/data/default.scene.json" → { name: "default", suffix: "scene" }
// "anywhere/posts.record.jsonc" → { name: "posts", suffix: "record" }
```

**`buildIndex(root)`** — scans the repo using `globSync('**/*.{scene,object,record}.{json,jsonc}')`, excluding `node_modules/`, `dist/`, and `.git/`. Builds an index keyed by suffix and name, and throws a hard error on duplicate name+suffix combinations:

```js
function buildIndex(root) {
  const index = { scene: {}, object: {}, record: {} }
  const seen = {} // "name.suffix" → absolute path

  for (const relPath of files) {
    const key = `${parsed.name}.${parsed.suffix}`
    if (seen[key]) {
      throw new Error(`Duplicate data file: "${key}.json"\n  Found at: ${seen[key]}\n  And at: ${absPath}`)
    }
    index[parsed.suffix][parsed.name] = absPath
  }
  return index
}
```

**`generateModule(index)`** — emits the virtual module source code. Each data file is imported as a raw string via Vite's `?raw` query, making the file contents available without filesystem access at runtime:

```js
function generateModule(index) {
  // Generates:
  // import _d0 from '/absolute/path/to/default.scene.json?raw'
  // export const scenes = { "default": _d0 }
  // export const objects = { ... }
  // export const records = { ... }
  // export default { scenes, objects, records }
}
```

**Dev server watcher** — listens for `add` and `unlink` events on data files. When the set of data files changes, it invalidates the virtual module and triggers a full page reload:

```js
configureServer(server) {
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
}
```

## Dependencies

- `node:fs` — filesystem access (imported but used transitively through `glob`)
- `node:path` — path manipulation for `basename` and `resolve`
- `glob` — `globSync` for data file discovery

## Dependents

- [`vite.config.js`](../../../vite.config.js.md) — imports and registers the plugin as `storyboardData()`
- [`src/storyboard/core/loader.js`](../core/loader.js.md) — imports the generated `virtual:storyboard-data-index` module

## Notes

- **Uniqueness constraint** — Every `name.suffix` combination must be unique across the entire repository. For example, you cannot have both `src/data/posts.record.json` and `src/features/posts.record.json`. This is enforced as a hard build error with clear messaging showing both file paths.
- **Build-time only** — The plugin runs at build/dev-start time. The virtual module it generates is a static JavaScript module that gets bundled like any other import.
- **Index rebuild** — The index is lazily built on first access and reset on `buildStart()` (production builds) and on file add/remove events (dev mode). Content changes to existing files are handled by Vite's normal HMR — the plugin only needs to rebuild when the set of files changes.
- The virtual module ID follows Vite convention: `virtual:storyboard-data-index` resolves to `\0virtual:storyboard-data-index` internally.
