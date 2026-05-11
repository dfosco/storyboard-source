# `vite.config.js`

<!--
source: vite.config.js
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

[`vite.config.js`](./vite.config.js.md) is the root build and dev-server contract for the app. It wires React, Tailwind, file-based routing, Storyboard's Vite plugins, and the alias strategy that makes this worktree behave like an isolated source checkout instead of accidentally resolving package code from another workspace.

It also encodes several repo-specific runtime constraints: base-path-aware redirects for branch URLs, warmup hints for frequently edited source, custom PostCSS setup for Primer tokens, and manual vendor chunking for production builds. Together with [`src/index.jsx`](./src/index.jsx.md), [`storyboard.config.json`](./storyboard.config.json.md), and the root [`package.json`](./package.json.md), it defines how the prototype app starts, reloads, and ships.

## Composition

The config is wrapped in `defineConfig(() => { ... })` so it can compute `base` from `VITE_BASE_PATH` at runtime:

```js
export default defineConfig(() => {
    const base = process.env.VITE_BASE_PATH || '/'

    return {
        base,
        // ...
    }
})
```

A large `resolve.alias` block forces `@dfosco/storyboard` subpath imports back to local source files inside `packages/storyboard/`. That avoids workspace links pointing at another worktree and preserves HMR against the files in this checkout:

```js
alias: {
    '@': path.resolve(__dirname, './src'),
    '@dfosco/storyboard/ui-runtime': path.resolve(__dirname, 'packages/storyboard/src/core/ui-entry.js'),
    '@dfosco/storyboard/core': path.resolve(__dirname, 'packages/storyboard/src/core/index.js'),
    '@dfosco/storyboard/hash-preserver': path.resolve(__dirname, 'packages/storyboard/src/internals/hashPreserver.js'),
    '@dfosco/storyboard': path.resolve(__dirname, 'packages/storyboard/src/internals/index.js'),
}
```

The plugin chain mixes ecosystem plugins with inline repo-specific middleware. The two local Storyboard plugins are imported by relative path specifically so the current worktree's source is used:

```js
plugins: [
    tailwindcss(),
    storyboardData(),
    storyboardServer(),
    react(),
    generouted({
        source: {
            routes: './src/prototypes/**/[\\w[-]*.{jsx,tsx,mdx}',
            modals: './src/prototypes/**/[+]*.{jsx,tsx,mdx}',
        },
    }),
]
```

Two inline plugins handle gaps in upstream tooling: `prototypes-watcher` triggers a full reload when prototype files are added or removed, and `base-redirect` normalizes requests so branch-prefixed base paths still resolve correctly:

```js
{
    name: 'base-redirect',
    configureServer(server) {
        const baseNoTrail = base.replace(/\/$/, '')
        server.middlewares.use((req, res, next) => {
            if (req.url === baseNoTrail) {
                res.writeHead(302, { Location: base })
                res.end()
                return
            }
            if (req.url && req.url !== baseNoTrail && !req.url.startsWith(base) && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules/')) {
                const newUrl = baseNoTrail + req.url
                res.writeHead(302, { Location: newUrl })
                res.end()
                return
            }
            next()
        })
    },
}
```

The rest of the file tunes developer and production behavior: a fixed dev port, permissive FS access for workspace-relative reads, warmup globs that pre-transform hot paths such as [`src/index.jsx`](./src/index.jsx.md), dependency prebundling for Primer, `keepNames` for inspector readability, manual vendor chunking, and PostCSS setup that injects Primer CSS data before `postcss-preset-env` rewrites modern syntax.

## Dependencies

- `@vitejs/plugin-react` — enables JSX transform and Fast Refresh for the React app bootstrapped in [`src/index.jsx`](./src/index.jsx.md).
- `@tailwindcss/vite` — injects Tailwind's Vite integration for both app styles and the UI runtime bundle consumed from [`packages/storyboard/package.json`](./packages/storyboard/package.json.md).
- `@generouted/react-router/plugin` — generates the `routes` module later consumed by [`src/index.jsx`](./src/index.jsx.md).
- `./packages/storyboard/src/internals/vite/data-plugin.js` — Storyboard data discovery plugin for flows, objects, records, and canvases.
- `./packages/storyboard/src/core/vite/server-plugin.js` — Storyboard dev-server plugin for server-side behaviors layered onto Vite.
- `node:fs` — reads [`storyboard.config.json`](./storyboard.config.json.md) without making it a watched Vite config dependency.
- `glob`, `@csstools/postcss-global-data`, `postcss-preset-env`, and `@github/browserslist-config` — build the CSS pipeline around Primer token files.

## Dependents

- [`package.json`](./package.json.md) runs this config through `dev`, `dev:vite`, `build`, and `preview` scripts.
- [`src/index.jsx`](./src/index.jsx.md) is explicitly warmed up by `server.warmup.clientFiles`.
- `index.html` loads the app entry that this config serves and builds.
- `packages/storyboard/src/core/vite/server-plugin.js`, `packages/storyboard/src/runtime/vite-plugin/plugin.ts`, and `packages/storyboard/src/runtime/vite-plugin/wrapper.ts` reference this file as the expected integration point for Storyboard's Vite-side runtime.
- `packages/storyboard/src/internals/canvas/canvasReloadGuard.js` documents server coordination with behavior configured here.

## Notes

- [`storyboard.config.json`](./storyboard.config.json.md) is parsed via `fs.readFileSync(...)` only to validate availability; avoiding a static import prevents full Vite server restarts on config edits.
- The alias order matters: specific subpaths must be declared before `@dfosco/storyboard` itself or Vite will collapse them to the broadest match.
- `base-redirect` and `basename` handling in [`src/index.jsx`](./src/index.jsx.md) are a paired design; changing one without the other breaks branch-prefixed URLs.
