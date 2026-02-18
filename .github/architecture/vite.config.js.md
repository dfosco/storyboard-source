# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Vite configuration for the storyboard prototyping app. Configures plugins (storyboard data discovery, React, file-based routing, base path redirect), dev server settings, build optimization (vendor chunk splitting for React, Primer, Octicons, Reshaped), and PostCSS processing (Primer Primitives CSS custom properties, CSS nesting, browser compatibility).

## Composition

Plugins (in order):
1. `storyboardData()` — Data file discovery from [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md)
2. `react()` — React JSX transform
3. `generouted()` — File-based routing from `src/pages/`
4. `base-redirect` — Custom middleware redirecting root requests to the configured base path

Key configuration:
```js
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || '/storyboard/',
  server: { port: 1234, fs: { allow: ['..'] } },
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
  css: { postcss: { plugins: [postcssGlobalData(...), postcssPresetEnv(...)] } },
}))
```

## Dependencies

- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — `storyboardData` plugin
- `@vitejs/plugin-react` — React support
- `@generouted/react-router/plugin` — File-based routing
- `@csstools/postcss-global-data` — Injects Primer Primitives CSS custom properties
- `postcss-preset-env` — CSS nesting and modern CSS features

## Dependents

- Used by `vite` CLI commands (`npm run dev`, `npm run build`)

## Notes

- The `chunkSizeWarningLimit` is raised to 700KB because `@primer/react` barrel export can't be tree-shaken below ~664KB.
- `.worktrees/**` is excluded from file watching to avoid interference from git worktrees.
- Client file warmup includes all source directories for faster HMR.
