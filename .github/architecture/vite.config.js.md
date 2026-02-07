# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

The Vite configuration is the build system entry point for the Storyboard app. It wires together the React plugin, the Generouted file-based routing plugin, and a PostCSS pipeline that makes Primer Primitives CSS custom media queries available globally and transpiles modern CSS features for target browsers.

This file controls how routes are auto-generated from `src/pages/`, how CSS custom properties from `@primer/primitives` are made available across the codebase, and which CSS features are enabled or disabled during the build.

## Composition

Exports a single Vite config via `defineConfig`. The two plugins handle React JSX transforms and automatic route generation:

```js
plugins: [react(), generouted()],
server: { port: 1234 },
```

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

- `@vitejs/plugin-react` — React JSX transform
- `@generouted/react-router/plugin` — File-based routing from `src/pages/`
- `@csstools/postcss-global-data` — Makes Primer custom media queries globally available
- `postcss-preset-env` — CSS transpilation to target browsers
- `@github/browserslist-config` — GitHub's browser support targets
- `glob` — `globSync` for finding Primer CSS files at build time

## Dependents

No files import this directly; it is consumed by the Vite CLI (`vite`, `vite build`, `vite preview`).
