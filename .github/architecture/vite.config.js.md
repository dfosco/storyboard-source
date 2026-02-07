# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

The Vite configuration is the build system entry point for the Storyboard app. It wires together the React plugin, the Generouted file-based routing plugin, and a PostCSS pipeline that makes Primer Primitives CSS custom media queries available globally and transpiles modern CSS features for target browsers.

This file is architecturally significant because it controls how routes are auto-generated from `src/pages/`, how CSS custom properties from `@primer/primitives` are made available across the codebase, and which CSS features (nesting, focus-visible, logical properties) are enabled or disabled during the build.

<details>
<summary>Technical details</summary>

### Composition

Exports a single `defineConfig` object with:
- **plugins**: `@vitejs/plugin-react` for JSX/React support, `@generouted/react-router/plugin` for file-based route generation from `src/pages/`.
- **server.port**: Dev server runs on port `1234`.
- **css.postcss.plugins**:
  - `@csstools/postcss-global-data` — injects all `@primer/primitives` CSS files as global data so custom media queries are resolvable everywhere.
  - `postcss-preset-env` — Stage 2 CSS features with `@github/browserslist-config` targets. Nesting enabled (with `noIsPseudoSelector`), `focus-visible` and `logical-properties` disabled.

### Dependencies

- `@vitejs/plugin-react` — React JSX transform
- `@generouted/react-router/plugin` — File-based routing
- `@csstools/postcss-global-data` — Global CSS custom media
- `postcss-preset-env` — CSS transpilation
- `@github/browserslist-config` — Browser targets
- `glob` — Glob sync for finding Primer CSS files

### Dependents

No files import `vite.config.js` directly; it is consumed by the Vite CLI (`vite`, `vite build`, `vite preview`).

</details>
