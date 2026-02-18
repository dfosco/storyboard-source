# `packages/react/src/vite/data-plugin.js`

<!--
source: packages/react/src/vite/data-plugin.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vite plugin that discovers all storyboard data files (`*.scene.json`, `*.object.json`, `*.record.json`) at build time, validates uniqueness, and generates a virtual module (`virtual:storyboard-data-index`) that pre-parses all JSON/JSONC data and calls `init()` to seed the core data index. This eliminates runtime file I/O and parsing — all data is available as JavaScript objects at import time.

In dev mode, the plugin watches for file additions, removals, and changes, rebuilding the index and triggering a full reload when data files are modified.

## Composition

**`storyboardDataPlugin()`** — Returns a Vite plugin object with:

- `resolveId` / `load` — Resolves the `virtual:storyboard-data-index` module ID and generates its source code
- `configureServer` — Watches for data file changes in dev mode, invalidates the module graph and triggers full reload
- `buildStart` — Resets the index on each build

Internal helpers:
- `parseDataFile(filePath)` — Extracts `{ name, suffix }` from a file path (e.g., `default.scene.json` → `{ name: "default", suffix: "scene" }`)
- `buildIndex(root)` — Scans the repo with glob, validates no duplicate name+suffix combinations, returns an index of absolute paths
- `generateModule(index)` — Reads each data file, parses JSONC, generates JavaScript source with pre-parsed objects and an `init()` call

Generated virtual module shape:
```js
import { init } from '@dfosco/storyboard-core'
const _d0 = { /* parsed JSON */ }
const scenes = { "default": _d0 }
const objects = { ... }
const records = { ... }
init({ scenes, objects, records })
export { scenes, objects, records }
```

## Dependencies

- `node:fs`, `node:path` — File system access
- `glob` — File discovery
- `jsonc-parser` — JSONC parsing (supports comments in JSON)
- [`packages/core/src/index.js`](../../core/src/index.js.md) — The generated module imports `init` from `@dfosco/storyboard-core`

## Dependents

- [`packages/react/src/context.jsx`](../context.jsx.md) — Side-effect imports `virtual:storyboard-data-index`
- [`vite.config.js`](../../../../vite.config.js.md) — Registers the plugin as `storyboardData()`

## Notes

- Duplicate name+suffix combinations cause a hard build error with file paths shown.
- JSONC support allows comments in data files for documentation purposes.
- The plugin enforces uniqueness across the entire repo, not just within directories.
