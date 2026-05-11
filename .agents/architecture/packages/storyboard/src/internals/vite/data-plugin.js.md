# `packages/storyboard/src/internals/vite/data-plugin.js`
<!--
source: packages/storyboard/src/internals/vite/data-plugin.js
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

`data-plugin.js` is the Vite plugin responsible for the entire data discovery and configuration pipeline. It scans the project filesystem for all storyboard data files (flows, objects, records, prototypes, folders, canvases, stories), validates uniqueness, builds a unified config object from all config sources, and generates the `virtual:storyboard-data-index` virtual module that seeds the runtime data layer.

This file is one of the most architecturally critical in the system. Every prototype's data, every canvas's metadata, every config option, and every story's lazy import all flow through this single plugin at build time. The virtual module it emits is the bridge between the static filesystem and the live React application — it calls `init()`, `initConfig()`, `initFeatureFlags()`, and other core initializers so the entire data and config system is ready before any component renders.

## Composition

### `buildUnifiedConfig(root)` — Config layering

Reads and merges configuration from multiple sources into a single object using priority order (lowest → highest):

```
configSchema defaults
  → core domain configs (toolbar.config.json, commandpalette.config.json, etc. from node_modules)
    → storyboard.config.json (explicit user overrides only)
      → user domain config files (toolbar.config.json etc. at project root)
```

Arrays with `id` fields are merged by identity; all other arrays and scalars are replaced. Overlapping keys between `storyboard.config.json` and user domain files emit warnings.

```js
function buildUnifiedConfig(root) {
  const coreToolbar = readCoreConfigFile(root, 'toolbar.config.json') || {}
  const { config: sbConfig } = readConfig(root)
  const rawSbConfig = readJsonFile(path.resolve(root, 'storyboard.config.json')) || {}
  const afterSbToolbar = rawSbConfig.toolbar ? deepMergeBuild(coreToolbar, sbConfig.toolbar) : coreToolbar
  // ... similar for commandPalette, paste, widgets
  // User domain config files override everything
  const finalToolbar = userConfigs.toolbar ? deepMergeBuild(afterSbToolbar, userConfigs.toolbar.data) : afterSbToolbar
  return { unified: { ...sbConfig, toolbar: finalToolbar, ... }, warnings }
}
```

### `generateModule(...)` — Virtual module emission

Reads every data file, parses JSONC at build time, resolves template variables (`${currentDir}`, `${currentProto}`, `${currentProtoDir}`), injects `_route`, `_group`, `_folder`, `_canvasMeta`, `gitAuthor`, `lastModified` metadata, and emits:

```js
import { init } from '@dfosco/storyboard/core'
import { initConfig } from '@dfosco/storyboard/core'
// + conditional: initFeatureFlags, initPlugins, initModesConfig, initUIConfig, etc.

const _d0 = { /* parsed flow data */ }
const flows = { "default": _d0, "Dashboard/overview": _d1, ... }
const objects = { ... }
const records = { ... }
const prototypes = { ... }
const canvases = { ... }
const stories = { ..., _storyImport: () => import('/src/components/Button.story.jsx') }

init({ flows, objects, records, prototypes, folders, canvases, stories })
initConfig({ toolbar: {...}, commandPalette: {...}, ... })

export { flows, scenes, objects, records, prototypes, folders, canvases, canvasAliases, stories }
```

Canvas `.jsonl` files are materialized via `materializeFromText()` (JSONL → JS object) rather than parsed as JSON.

### HMR — Canvas and story changes

The emitted module includes client-side HMR listeners that patch the live `canvases` and `stories` objects in place **without triggering a full-reload**:

```js
if (import.meta.hot) {
  import.meta.hot.on('storyboard:canvas-file-changed', (data) => {
    if (data.removed) delete canvases[id]
    else canvases[id] = Object.assign({}, canvases[id], data.metadata)
    init({ flows, objects, records, prototypes, folders, canvases, stories })
  })
  import.meta.hot.on('storyboard:story-file-changed', (data) => {
    if (data.removed) delete stories[data.name]
    else stories[data.name] = { ..., _storyImport: () => import(data._storyModule) }
    init({ flows, objects, records, prototypes, folders, canvases, stories })
    document.dispatchEvent(new CustomEvent('storyboard:story-index-changed'))
  })
}
```

For canvas files, a **soft invalidate** (invalidate the virtual module without triggering full-reload) is used when the change was triggered by the canvas server API (write-guard check via `isCanvasWriteInFlight`). For all other changes (add/remove data files, config changes), a **full-reload** is triggered.

### File watching

In dev mode, `configureServer` registers watchers for:
- `*.flow.json`, `*.object.json`, `*.record.json`, `*.prototype.json`, `*.folder.json` — full-reload on change
- `*.canvas.jsonl` — soft-invalidate + HMR event (preserves canvas editing state)
- `*.story.{jsx,tsx}` — HMR event via `storyboard:story-file-changed` + soft-invalidate
- Config files (`storyboard.config.json`, `toolbar.config.json`, etc.) — full-reload

## Dependencies

- [`../../core/canvas/materializer.js`](../../core/canvas/materializer.js.md) — `materializeFromText` (JSONL → JS object)
- [`../../core/canvas/identity.js`](../../core/canvas/identity.js.md) — `toCanvasId` (canonical canvas ID)
- [`../../core/canvas/writeGuard.js`](../../core/canvas/writeGuard.js.md) — `isCanvasWriteInFlight` (skip HMR for server-initiated writes)
- [`../../core/stores/configSchema.js`](../../core/stores/configSchema.js.md) — `getConfig` (schema defaults)
- [`../../core/worktree/serverRegistry.js`](../../core/worktree/serverRegistry.js.md) — `list` (running server list, injected into virtual module)
- `glob`, `jsonc-parser`, `node:fs`, `node:path`, `node:child_process` (execSync for git metadata)

## Dependents

- `packages/storyboard/src/index.js` / `vite.config.js` consumers — import `storyboardDataPlugin()` and add to Vite plugins array
- [`context.jsx`](../context.jsx.md) — imports from `virtual:storyboard-data-index` at runtime
- All data hooks — indirectly depend on `init()` being called by the generated module

## Notes

- `parseDataFile()` applies prototype scoping rules: files inside `src/prototypes/{Name}/` are prefixed with the prototype name (e.g. `Dashboard/default`). `.folder/` directory segments are stripped from prototype names but preserved in canvas IDs.
- `batchGitMetadata()` fetches git author and last-modified date for all prototype and canvas files in 1–2 subprocess calls (not per-file) to keep startup fast.
- Template variable resolution (`${currentDir}` etc.) happens at build time — zero runtime overhead.
- The plugin enforces **no duplicate name+suffix** combinations across the project and throws a descriptive error on collision, including hints about prototype scoping.
- Canvas files use path-based canonical IDs (from `toCanvasId`) rather than basenames, enabling two canvas files with the same basename to coexist in different directories without collision.
