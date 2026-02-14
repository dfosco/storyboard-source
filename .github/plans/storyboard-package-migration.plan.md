# Plan: Turn Storyboard into an Installable npm Package

## Vision

Turn the storyboard system into an npm package (`@storyboard/core` or `storyboard`) that can be installed into any Vite project, providing a complete prototyping framework. The user runs a scaffold command, gets a ready-to-go project, and only touches `src/` (pages + data). The framework internals are hidden inside `node_modules/`.

### What the user experience looks like

```bash
# Create a new storyboard project
npx create-storyboard my-prototype

# Or add to an existing Vite project
npm install @storyboard/react
```

The scaffold produces:

```
my-prototype/
├── src/
│   ├── pages/          ← user writes these
│   ├── components/     ← user writes these
│   ├── templates/      ← user writes these
│   └── data/           ← user writes these (*.scene.json, *.object.json, *.record.json)
├── vite.config.js      ← imports storyboard plugin from package
├── package.json
└── node_modules/
    └── @storyboard/
        ├── core/       ← framework-agnostic data layer
        └── react/      ← React hooks, context, components, Vite plugin
```

---

## Current State

The storyboard system already lives outside `src/` at the repo root:

```
storyboard/
├── core/          ← Pure JS. Zero npm deps. Uses only browser APIs.
├── internals/     ← React hooks, context, Primer components.
│                    Deps: react, react-router-dom, @primer/react, @primer/octicons-react
├── vite/          ← data-plugin.js. Deps: node:fs, node:path, glob, jsonc-parser
└── index.js       ← Barrel re-exporting from core + internals
```

### Dependency Analysis

| Layer | npm Dependencies | Browser APIs |
|-------|-----------------|--------------|
| `core/` | **None** | `window.location`, `URLSearchParams`, `structuredClone`, `addEventListener` |
| `internals/` | `react`, `react-router-dom`, `@primer/react`, `@primer/octicons-react`, `prop-types` | `virtual:storyboard-data-index` (Vite) |
| `vite/` | `glob`, `jsonc-parser` | None (Node.js only) |

---

## Package Architecture

### Option: Two packages (Recommended)

**`@storyboard/core`** — Framework-agnostic data layer
- Contains: `core/` (dotPath, loader, session, hashSubscribe)
- Zero runtime dependencies
- Can be used by React, Vue, Svelte, Alpine, vanilla JS
- Entry point: `@storyboard/core`

**`@storyboard/react`** — React renderer + Vite plugin
- Contains: `internals/` + `vite/`
- Depends on: `@storyboard/core`, `react`, `react-router-dom`
- Peer dependencies: `@primer/react`, `@primer/octicons-react`, `vite`
- Entry points:
  - `@storyboard/react` — hooks, context, components
  - `@storyboard/react/vite` — Vite data plugin
  - `@storyboard/react/hash-preserver` — React Router hash preservation

This means the user's `vite.config.js` becomes:

```js
import { storyboardData } from '@storyboard/react/vite'
// instead of
import storyboardData from './storyboard/vite/data-plugin.js'
```

And page imports become:

```js
import { useSceneData } from '@storyboard/react'
// instead of
import { useSceneData } from '../../storyboard'
```

### Why not one package?

Separating core from react means:
1. Future `@storyboard/vue`, `@storyboard/alpine` packages only depend on `@storyboard/core`
2. Core can be tested independently (Node.js + jsdom, no React needed)
3. Clear API boundary — core is stable, renderers can evolve independently

### Why not three packages (core + vite + react)?

The Vite plugin is tightly coupled to the React renderer right now (it generates the virtual module that calls `core.init()`, and the `context.jsx` imports it). Keeping vite + react together is simpler. If a Vue renderer needs the same Vite plugin, it can depend on the same one or we can extract it then.

---

## Todos

### Phase 1: Monorepo Setup

1. **setup-monorepo** — Initialize a monorepo structure (npm workspaces or pnpm workspaces). Create `packages/core/` and `packages/react/` with their own `package.json` files. The root `package.json` becomes the workspace root.

2. **move-core-to-package** — Move `storyboard/core/` → `packages/core/src/`. Create `packages/core/package.json` with `name: "@storyboard/core"`, `type: "module"`, `exports` field pointing to the barrel. No dependencies.

3. **move-react-to-package** — Move `storyboard/internals/` + `storyboard/vite/` → `packages/react/src/`. Create `packages/react/package.json` with dependencies on `@storyboard/core`, peer deps on `react`, `vite`, `@primer/react`. Set up `exports` for multiple entry points (`@storyboard/react`, `@storyboard/react/vite`, `@storyboard/react/hash-preserver`).

### Phase 2: Import Path Migration

4. **update-internal-imports** — Update all imports within `packages/react/` to use `@storyboard/core` instead of relative `../../core/` paths.

5. **update-consumer-imports** — Update all `src/` imports from `../../storyboard` to `@storyboard/react`. Update `vite.config.js` to import from `@storyboard/react/vite`.

6. **remove-old-storyboard-dir** — Delete the root `storyboard/` directory once everything is migrated to `packages/`.

### Phase 3: Build & Publish Setup

7. **add-package-build** — Decide whether packages need a build step. Options:
   - **No build** (recommended for now): packages export raw ESM source. Vite handles transpilation. Simple, no build toolchain needed.
   - **With build**: use `tsup` or `unbuild` to produce compiled ESM + CJS. Needed if packages will be published to npm for use outside Vite.

8. **verify-workspace** — Run `npm install` at root to link workspaces. Verify `npm run build` and `npm run dev` still work. All imports resolve via workspace symlinks.

### Phase 4: Scaffold CLI (Future)

9. **create-scaffold** — Build `create-storyboard` CLI that scaffolds a new project:
   - `npx create-storyboard my-app`
   - Creates directory, `package.json`, `vite.config.js`, `src/pages/index.jsx`, `src/data/default.scene.json`
   - Installs `@storyboard/react` (which pulls in `@storyboard/core`)

10. **scaffold-templates** — Create starter templates:
    - `primer` — Primer React + generouted (current setup)
    - `minimal` — Bare React, no design system
    - Future: `vue`, `alpine`, `svelte`

### Phase 5: Documentation

11. **package-readme** — Write README for each package:
    - `@storyboard/core`: API reference for `init()`, `loadScene()`, session utils, hash subscription
    - `@storyboard/react`: Quick start, hooks reference, component catalog, Vite plugin setup

12. **migration-guide** — Document how to migrate an existing storyboard project from the single-repo layout to the package-based layout.

---

## Design Decisions to Make

### 1. Primer React coupling

Currently `internals/components/` wraps Primer React components (TextInput, Select, Checkbox, etc.). Options:

- **A) Keep them in `@storyboard/react`** — Primer is a peer dep. Users not using Primer can ignore these components.
- **B) Extract to `@storyboard/primer`** — Separate package for Primer-specific components. `@storyboard/react` stays design-system-agnostic.
- **C) Make components generic** — Replace Primer wrappers with plain HTML/headless components. Users bring their own design system.

**Recommendation: A for now.** The form components are small and optional. Extract later if there's demand for non-Primer usage.

### 2. Workspace manager

- **npm workspaces** — Zero additional tooling. Works with the existing `package-lock.json`.
- **pnpm workspaces** — Faster, stricter, but requires switching package managers.
- **Turborepo / Nx** — Overkill for two packages.

**Recommendation: npm workspaces.** Simplest, already using npm.

### 3. Package scope

- `@storyboard/core` + `@storyboard/react` — Clear, professional, but requires npm org.
- `storyboard-core` + `storyboard-react` — No org needed, but less clean.

**Recommendation: Decide based on npm name availability and whether you want to claim an org.**

### 4. Data file location

Currently data files (`*.scene.json`, `*.object.json`, `*.record.json`) can live anywhere in the repo. Should this change?

- **Keep as-is** — Flexible. Data can live alongside pages or in a central `src/data/` directory.
- **Enforce `src/data/`** — More opinionated but clearer for new users.

**Recommendation: Keep as-is.** The Vite plugin already scans the whole repo. Opinionated directory structure can be a scaffold default without being enforced.

### 5. generouted coupling

The current setup uses `@generouted/react-router` for file-based routing. This is a React Router + Vite integration. Options:

- **Keep as user-land dependency** — `@storyboard/react` doesn't depend on generouted. The scaffold includes it. Users can swap routing.
- **Bundle generouted integration** — Deeper integration but harder to swap.

**Recommendation: Keep as user-land.** generouted is a scaffold choice, not a framework requirement.
