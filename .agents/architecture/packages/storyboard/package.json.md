# `packages/storyboard/package.json`

<!--
source: packages/storyboard/package.json
category: config
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

[`packages/storyboard/package.json`](./package.json.md) defines the publishable `@dfosco/storyboard` package that now consolidates the framework's public surface. It is the contract between the source repo and consumers: CLI binaries, package exports, publishable files, build scripts, peer dependency expectations, and optional runtime pieces are all declared here.

Within this repo, the manifest also explains why the root app can import `@dfosco/storyboard/...` everywhere while still developing against source. [`vite.config.js`](../../vite.config.js.md) aliases those package exports back into `packages/storyboard/src/*`, and the root [`package.json`](../../package.json.md) drives package-scoped scripts against this manifest. That makes this file a key boundary between local development, bundling, and npm consumption.

## Composition

The manifest identifies a single publishable package with multiple executables:

```json
{
  "name": "@dfosco/storyboard",
  "version": "0.5.0-alpha.23",
  "bin": {
    "storyboard-scaffold": "./src/core/scaffold.js",
    "storyboard": "./src/core/cli/index.js",
    "sb": "./src/core/cli/index.js",
    "storyboard-runtime": "./bin/storyboard-runtime.js"
  }
}
```

Its `scripts` split the package into build targets instead of one monolithic bundle. UI assets, canvas assets, and the runtime are built independently:

```json
"scripts": {
  "build:css": "tailwindcss -i src/core/styles/tailwind.css -o dist/tailwind.css --minify",
  "build:ui": "vite build --config vite.ui.config.js",
  "build:canvas": "vite build --config vite.canvas.config.js",
  "build:runtime": "tsup --config tsup.runtime.config.ts",
  "prepublishOnly": "npm run build:css && npm run build:ui && npm run build:canvas && npm run build:runtime"
}
```

The `exports` map is the architectural center of the file. It publishes multiple surfaces from one package: React internals, framework-agnostic core, prebuilt canvas/UI bundles, config JSON, runtime artifacts, and targeted subpath helpers:

```json
"exports": {
  ".": "./src/internals/index.js",
  "./core": "./src/core/index.js",
  "./canvas": {
    "import": "./dist/tiny-canvas.js",
    "types": "./src/canvas/index.d.ts"
  },
  "./vite": "./src/internals/vite/data-plugin.js",
  "./vite/server": "./src/core/vite/server-plugin.js",
  "./runtime": {
    "types": "./dist/runtime/index.d.ts",
    "import": "./dist/runtime/index.js"
  }
}
```

Dependencies show the package's mixed role: UI libraries such as `@base-ui/react`, `@neodrag/react`, and `lucide-react`; markdown and syntax tooling such as `remark` and `highlight.js`; config/schema libraries such as `jsonc-parser` and `zod`; and operational packages such as `glob`, `ws`, and optional `node-pty`. Peer dependencies keep `react`, `react-dom`, `react-router-dom`, and `vite` in the consumer's app, with `vite` marked optional so non-plugin consumers are not forced to install it.

## Dependencies

- [`vite.ui.config.js`](./vite.ui.config.js.md) is referenced by the `build:ui` and `dev:ui` scripts to build the precompiled UI runtime.
- `vite.canvas.config.js`, `tsup.runtime.config.ts`, and `tsconfig.runtime.json` back the other package build outputs.
- Source entry files under `./src/core/*`, `./src/internals/*`, `./src/canvas/*`, and `./dist/runtime/*` define the concrete modules named in `bin`, `files`, and `exports`.
- Root [`package.json`](../../package.json.md) invokes this package's scripts through npm workspace flags.

## Dependents

- Root [`package.json`](../../package.json.md) runs `lint`, `build:ui`, and `dev:ui` against `-w @dfosco/storyboard`.
- [`vite.config.js`](../../vite.config.js.md), `vitest.config.js`, [`src/index.jsx`](../../src/index.jsx.md), `src/routes.jsx`, and `src/components/ThemeSync/ThemeSync.jsx` all import `@dfosco/storyboard` subpaths that are defined by this export map.
- `scripts/sync-root-version.js` reads this manifest to sync the root version.
- Consumer-facing docs such as `README.md` and `releasing.md` describe installation and imports based on this package surface.

## Notes

- The package intentionally mixes source exports (for framework internals and plugins) with built artifacts in `dist/` (for canvas and runtime bundles); consumers get one package, but not every subpath is produced the same way.
- `node-pty` is an `optionalDependency`, which lets installs succeed in environments where native terminal support is unavailable while preserving richer behavior when it is present.
