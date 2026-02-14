# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.
>
> **Note:** The storyboard system was restructured into `core/` (framework-agnostic) and `internals/` (framework-specific) layers. Some linked docs below may reference old paths until the architecture scanner is re-run.

## Storyboard System

The storyboard system is the core engine that separates data from UI. It is split into two layers:

### Core Layer (`storyboard/core/`) — Framework-agnostic

Pure JavaScript with zero framework dependencies. Any frontend (React, Vue, Svelte, Alpine, vanilla JS) can use these directly. The core provides:
- **Data initialization** via `init({ scenes, objects, records })` — called once at app startup to seed the data index
- **Scene/record loading** — resolves `$ref` and `$global` references
- **URL hash session state** — read/write override params stored in the URL hash
- **Hash change subscription** — `subscribeToHash()` for reactive frameworks
- **Dot-notation utilities** — `getByPath`, `setByPath`, `deepClone`

### Vite Plugin (`storyboard/vite/`) — Build tool layer

Framework-agnostic Vite plugin that discovers data files and calls `core.init()` at import time. Works with any Vite-based frontend.

### Internals (`storyboard/internals/`) — Framework-specific (currently React)

Everything that depends on React, React Router, or Primer React: context providers, hooks, form components, and DevTools. When building a non-React frontend, this entire layer gets replaced — including routing (generouted → vue-router, SvelteKit, etc.).

Data flows through a clear pipeline: the [`storyboardData()`](./storyboard/vite/data-plugin.js.md) Vite plugin scans the repo and generates a virtual module that calls `init()` → [`loader.js`](./storyboard/core/loader.js.md) resolves references and returns flat data → [`StoryboardProvider`](./storyboard/internals/context.jsx.md) loads scenes into React context → hooks like [`useSceneData()`](./storyboard/internals/hooks/useSceneData.js.md), [`useRecord()`](./storyboard/internals/hooks/useRecord.js.md), and [`useOverride()`](./storyboard/internals/hooks/useOverride.js.md) give components read and write access to the data. URL hash parameters provide a runtime override layer.

#### Core
- [`storyboard/core/index.js`](./storyboard/core/index.js.md) — Core barrel: all framework-agnostic exports
- [`storyboard/core/loader.js`](./storyboard/core/loader.js.md) — Scene/record loader: init(), name-based $ref/$global resolution
- [`storyboard/core/dotPath.js`](./storyboard/core/dotPath.js.md) — Dot-notation path accessor utility
- [`storyboard/core/session.js`](./storyboard/core/session.js.md) — Low-level hash param read/write utilities
- [`storyboard/core/hashSubscribe.js`](./storyboard/core/hashSubscribe.js.md) — Hash change subscription for reactive frameworks

#### Vite Plugin
- [`storyboard/vite/data-plugin.js`](./storyboard/vite/data-plugin.js.md) — Vite plugin: suffix-based data discovery, uniqueness validation, virtual module generation

#### Internals
- [`storyboard/index.js`](./storyboard/index.js.md) — Public barrel: re-exports from core + react
- [`storyboard/internals/index.js`](./storyboard/internals/index.js.md) — React barrel: all React-specific exports
- [`storyboard/internals/context.jsx`](./storyboard/internals/context.jsx.md) — StoryboardProvider: loads scenes, optional record merging
- [`storyboard/internals/StoryboardContext.js`](./storyboard/internals/StoryboardContext.js.md) — React context object
- [`storyboard/internals/hashPreserver.js`](./storyboard/internals/hashPreserver.js.md) — URL hash preservation across React Router navigations
- [`storyboard/internals/hooks/useSceneData.js`](./storyboard/internals/hooks/useSceneData.js.md) — Read scene data with hash override merging
- [`storyboard/internals/hooks/useOverride.js`](./storyboard/internals/hooks/useOverride.js.md) — Read/write hash overrides
- [`storyboard/internals/hooks/useRecord.js`](./storyboard/internals/hooks/useRecord.js.md) — Load record entries by URL param
- [`storyboard/internals/hooks/useScene.js`](./storyboard/internals/hooks/useScene.js.md) — Scene name and switching
- [`storyboard/internals/hooks/useSession.js`](./storyboard/internals/hooks/useSession.js.md) — Legacy session hook (deprecated alias)
- [`storyboard/internals/components/StoryboardForm.jsx`](./storyboard/internals/components/StoryboardForm.jsx.md) — Form wrapper with submit-based hash persistence
- [`storyboard/internals/components/TextInput.jsx`](./storyboard/internals/components/TextInput.jsx.md) — Wrapped Primer TextInput for forms
- [`storyboard/internals/components/Textarea.jsx`](./storyboard/internals/components/Textarea.jsx.md) — Wrapped Primer Textarea for forms
- [`storyboard/internals/components/Select.jsx`](./storyboard/internals/components/Select.jsx.md) — Wrapped Primer Select for forms
- [`storyboard/internals/components/Checkbox.jsx`](./storyboard/internals/components/Checkbox.jsx.md) — Wrapped Primer Checkbox for forms
- [`storyboard/internals/components/SceneDebug.jsx`](./storyboard/internals/components/SceneDebug.jsx.md) — Debug component showing resolved scene JSON
- [`storyboard/internals/components/SceneDataDemo.jsx`](./storyboard/internals/components/SceneDataDemo.jsx.md) — Demo component for scene data

## Entry Points

The app entry point wires together the React root, Primer theme provider, storyboard system, and hash preservation. The app shell in `_app.jsx` wraps all routes with the StoryboardProvider and DevTools.

- [`src/index.jsx`](./src/index.jsx.md) — React root mount, theme config, hash preserver installation

## Routing

File-based routing via `@generouted/react-router` with lazy loading. Each `.jsx` file in `src/pages/` becomes a route. Dynamic routes use `[paramName]` brackets (e.g., `posts/[slug].jsx` → `/posts/:slug`).

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — App shell: StoryboardProvider + DevTools wrapping all routes

## Configuration

Build tooling configuration: Vite plugins, PostCSS pipeline with Primer Primitives, and package dependencies.

- [`package.json`](./package.json.md) — Dependencies and scripts
- [`vite.config.js`](./vite.config.js.md) — Vite config: storyboard data plugin, React, generouted, PostCSS

## Pages

Individual page components. Each file corresponds to a route. Pages using different design systems (Primer, Reshaped) are code-split via lazy loading.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page
