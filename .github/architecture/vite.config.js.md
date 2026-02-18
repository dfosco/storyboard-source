# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

The Vite configuration is the build system entry point for the Storyboard app. It wires together the storyboard data plugin (from `@dfosco/storyboard-react/vite`), the React plugin, the Generouted file-based routing plugin, and a PostCSS pipeline that makes Primer Primitives CSS custom media queries available globally and transpiles modern CSS features for target browsers. It also configures vendor chunk splitting and dependency pre-bundling for optimal dev/build performance.

This file controls how data files (`*.scene.json`, `*.object.json`, `*.record.json`) are discovered and bundled, how routes are auto-generated from `src/pages/`, how CSS custom properties from `@primer/primitives` are made available across the codebase, which CSS features are enabled or disabled during the build, and how the base path is resolved (via `VITE_BASE_PATH` env var, defaulting to `/storyboard/`).

## Composition

Exports a single Vite config via `defineConfig` with a base path of `/storyboard/`. Four plugins handle storyboard data discovery, React transforms, automatic route generation, and dev-server URL rewriting:

```js
import storyboardData from '@dfosco/storyboard-react/vite'

base: process.env.VITE_BASE_PATH || '/storyboard/',
plugins: [
    storyboardData(),
    react(),
    generouted(),
    {
        name: 'base-redirect',
        configureServer(server) {
            // Redirects requests not starting with base to base/...
        },
    },
],
server: { port: 1234 },
optimizeDeps: {
    include: ['reshaped', '@primer/react', '@primer/octicons-react'],
},
build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                'vendor-primer': ['@primer/react'],
                'vendor-octicons': ['@primer/octicons-react'],
                'vendor-reshaped': ['reshaped'],
            },
        },
    },
},
```

The [`storyboardData()`](./packages/react/src/vite/data-plugin.js.md) plugin (imported from `@dfosco/storyboard-react/vite`) scans the repo for `*.scene.json`, `*.object.json`, and `*.record.json` files, validates name uniqueness, and generates the `virtual:storyboard-data-index` module consumed by [`packages/core/src/loader.js`](./packages/core/src/loader.js.md).

The `optimizeDeps.include` array pre-bundles heavy vendor packages for faster dev server startup. The `build` section raises the chunk size warning limit (for `@primer/react`'s barrel export) and splits vendor dependencies into separate long-lived cacheable chunks via `manualChunks`.

The custom `base-redirect` plugin ensures the dev server redirects bare URLs (e.g., `/Overview`) to the base-prefixed path (`/storyboard/Overview`), keeping the dev experience consistent with the production deployment path.

The PostCSS pipeline has two stages. First, `postcssGlobalData` injects all Primer Primitives CSS files so their custom media queries are resolvable in any stylesheet:

```js
postcssGlobalData({
    files: globSync('node_modules/@primer/primitives/dist/css/**/*.css'),
}),
```

Then `postcssPresetEnv` transpiles Stage 2 CSS features for the browsers defined in `@github/browserslist-config`, with specific feature overrides:

```js
postcssPresetEnv({
    stage: 2,
    browsers,
    features: {
        'nesting-rules': { noIsPseudoSelector: true },
        'focus-visible-pseudo-class': false,
        'logical-properties-and-values': false,
    },
}),
```

## Dependencies

- [`@dfosco/storyboard-react/vite`](./packages/react/src/vite/data-plugin.js.md) — Storyboard data file discovery and virtual module generation (from `packages/react`)
- `@vitejs/plugin-react` — React JSX transform
- `@generouted/react-router/plugin` — File-based routing from `src/pages/`
- `@csstools/postcss-global-data` — Makes Primer custom media queries globally available
- `postcss-preset-env` — CSS transpilation to target browsers
- `@github/browserslist-config` — GitHub's browser support targets
- `glob` — `globSync` for finding Primer CSS files at build time

## Dependents

No files import this directly; it is consumed by the Vite CLI (`vite`, `vite build`, `vite preview`).
