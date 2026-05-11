# `packages/storyboard/vite.ui.config.js`

<!--
source: packages/storyboard/vite.ui.config.js
category: config
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

[`packages/storyboard/vite.ui.config.js`](./vite.ui.config.js.md) builds the package's precompiled UI runtime bundle. Its main job is to emit a self-contained `dist/storyboard-ui.js` + `dist/storyboard-ui.css` pair while externalizing stateful core modules so consumers share the same singleton stores instead of bundling duplicate copies.

## Composition

The file defines a `sharedStateModules` map and a small Rollup/Vite plugin that rewrites relative imports of those modules to external package subpaths:

```js
const sharedStateModules = {
  'index.js': '@dfosco/storyboard/core',
  'data/loader.js': '@dfosco/storyboard/core',
  'stores/configStore.js': '@dfosco/storyboard/core',
  'comments/api.js': '@dfosco/storyboard/comments',
}
```

```js
function externalizeSharedState() {
  return {
    name: 'externalize-shared-state',
    enforce: 'pre',
    resolveId(source, importer) {
      // rewrites matched modules to external package imports
    },
  }
}
```

That plugin is combined with Tailwind and library-build settings to output one ESM bundle with inline dynamic imports and a fixed CSS filename:

```js
build: {
  lib: {
    entry: path.resolve(__dirname, 'src/core/ui-entry.js'),
    formats: ['es'],
    fileName: () => 'storyboard-ui.js',
  },
  cssFileName: 'storyboard-ui',
  rollupOptions: {
    external: [/^@dfosco\/storyboard(\/|$)/, /^react($|\/)/, /^react-dom($|\/)/],
    output: { inlineDynamicImports: true },
  },
}
```

## Dependencies

- `vite` and `@tailwindcss/vite` provide the library-build pipeline.
- `node:path` is used to normalize importer paths before matching against `sharedStateModules`.
- [`packages/storyboard/package.json`](./package.json.md) invokes this config from `build:ui` and `dev:ui` scripts.

## Dependents

- [`packages/storyboard/package.json`](./package.json.md) calls this file in both `build:ui` and watch-mode `dev:ui`.
- The generated `dist/storyboard-ui.js` and `dist/storyboard-ui.css` outputs are exported by [`packages/storyboard/package.json`](./package.json.md) as `./ui-runtime` and `./ui-runtime/style.css`.

## Notes

- `emptyOutDir: false` is intentional so UI builds do not wipe other artifacts from the shared `dist/` directory.
