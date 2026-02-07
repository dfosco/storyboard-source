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

<details>
<summary>Technical details</summary>

### Composition

- **`loadScene(sceneName)`** (exported) — Main entry point. Loads a scene file, processes `$global` merges, then resolves all `$ref` objects recursively. Returns a `Promise<object>`.
- **`deepMerge(target, source)`** (exported) — Deep merges two objects; source wins on conflicts, arrays are replaced (not concatenated).
- **`resolveRefs(node, baseDir, seen)`** (internal) — Recursively walks the data tree replacing `{ "$ref": "path" }` objects with the referenced file's contents. Tracks visited paths in a `Set` to detect circular references.
- **`resolveRefPath(ref, baseDir)`** (internal) — Resolves relative paths like `../objects/navigation` against a base directory.
- **`loadDataFile(dataPath)`** (internal) — Loads a data file by path (without extension), trying `.jsonc` then `.json`. Uses JSONC parser.
- **`dataModules`** (internal) — `import.meta.glob('../../data/**/*.{json,jsonc}')` eagerly loaded as raw text strings.

### Dependencies

- `jsonc-parser` — `parse` function for JSONC support
- Vite's `import.meta.glob` — Build-time eager import of all data files

### Dependents

- `src/storyboard/context.jsx` — calls `loadScene()` in the provider
- `src/storyboard/components/SceneDebug.jsx` — calls `loadScene()` directly for debug display
- `src/storyboard/index.js` — re-exports `loadScene`

### Notes

- Data files are loaded eagerly at build time via `import.meta.glob` with `{ eager: true, query: '?raw' }`. This means all JSON/JSONC files under `src/data/` are bundled, regardless of whether a scene references them.
- The `$global` directive is processed before `$ref` resolution, so global objects can themselves contain `$ref` entries that will be resolved.
- Circular `$ref` detection uses a shared `Set` within a single `resolveRefs` call tree. Each `$global` reference is resolved independently (no cross-global cycle detection).

</details>
