# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is a two-package architecture that separates framework-agnostic data logic from React-specific UI bindings. The core package ([`@dfosco/storyboard-core`](./packages/core/src/index.js.md)) handles data loading, URL hash session management, dot-notation accessors, hide mode, and devtools — all with zero npm dependencies. The React package ([`@dfosco/storyboard-react`](./packages/react/src/index.js.md)) provides context providers, hooks, a hash-preserving navigation interceptor, and the Vite data plugin that discovers and bundles data files at build time. This split means the core can be reused with any frontend framework while React gets a purpose-built integration layer.

Data flows through a pipeline that starts with three file types: **scenes** (`.scene.json`), **objects** (`.object.json`), and **records** (`.record.json`). At build time, the [Vite data plugin](./packages/react/src/vite/data-plugin.js.md) scans the repository for these files, validates name uniqueness, and generates a virtual module that seeds the [core loader](./packages/core/src/loader.js.md). When a page loads, the [StoryboardProvider](./packages/react/src/context.jsx.md) resolves the appropriate scene — resolving `$ref` references to objects and merging `$global` arrays into the scene root — and exposes the result through React context. Hooks like [`useSceneData`](./packages/react/src/hooks/useSceneData.js.md) then let components read any value by dot-notation path (e.g. `'user.profile.name'`).

The override system is what makes storyboard prototypes interactive. When a user tweaks a value, the override is written to the URL hash via [`session.js`](./packages/core/src/session.js.md) — chosen specifically because React Router ignores hash changes, avoiding full re-renders. The [`useOverride`](./packages/react/src/hooks/useOverride.js.md) hook merges these hash params on top of scene data, so components always see the overridden value. For persistent overrides that survive page refreshes, [`useLocalStorage`](./packages/react/src/hooks/useLocalStorage.js.md) writes to namespaced localStorage instead. Every override write pushes a snapshot to a history stack, enabling [`useUndoRedo`](./packages/react/src/hooks/useUndoRedo.js.md) to navigate back and forth through changes.

For sharing prototypes with stakeholders, **hide mode** ([`hideMode.js`](./packages/core/src/hideMode.js.md)) moves all hash overrides into localStorage shadow storage so the URL stays clean. Users toggle it via `?hide` / `?show` query params handled by [`interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md). During development, the floating [devtools toolbar](./packages/core/src/devtools.js.md) provides scene inspection and parameter reset, while [`sceneDebug.js`](./packages/core/src/sceneDebug.js.md) offers an embeddable JSON debug panel.

### Core (`@storyboard/core`)

Framework-agnostic data layer with zero npm dependencies. Handles data loading, session state, dot-notation accessors, hide mode, and developer tooling.

- [`packages/core/src/index.js`](./packages/core/src/index.js.md) — Barrel module re-exporting all public APIs of the core package
- [`packages/core/src/loader.js`](./packages/core/src/loader.js.md) — Data loader that manages the scene/object/record index with `$ref` and `$global` resolution
- [`packages/core/src/session.js`](./packages/core/src/session.js.md) — URL hash-based session state management, chosen to avoid React Router re-renders
- [`packages/core/src/dotPath.js`](./packages/core/src/dotPath.js.md) — Dot-notation path utilities for reading, writing, and cloning nested data structures
- [`packages/core/src/hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md) — Minimal subscription API for hash changes, designed for `useSyncExternalStore` integration
- [`packages/core/src/hideMode.js`](./packages/core/src/hideMode.js.md) — Clean-URL presentation mode that moves overrides from the hash into localStorage
- [`packages/core/src/interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md) — Detects `?hide` and `?show` query params to toggle hide mode via URL
- [`packages/core/src/localStorage.js`](./packages/core/src/localStorage.js.md) — Namespaced localStorage API for persistent storyboard overrides
- [`packages/core/src/sceneDebug.js`](./packages/core/src/sceneDebug.js.md) — Embeddable debug panel that renders resolved scene data as formatted JSON
- [`packages/core/src/devtools.js`](./packages/core/src/devtools.js.md) — Floating DevTools toolbar for scene inspection and parameter reset

### React (`@storyboard/react`)

React-specific integration layer providing context providers, hooks, navigation utilities, and the Vite build plugin.

#### Context & Providers

- [`packages/react/src/index.js`](./packages/react/src/index.js.md) — Public barrel file defining the React package's API surface
- [`packages/react/src/StoryboardContext.js`](./packages/react/src/StoryboardContext.js.md) — Shared React context object used by all storyboard hooks, isolated to prevent circular imports
- [`packages/react/src/context.jsx`](./packages/react/src/context.jsx.md) — `StoryboardProvider` component that loads scene data and exposes it via React context
- [`packages/react/src/hashPreserver.js`](./packages/react/src/hashPreserver.js.md) — Patches link clicks and `router.navigate()` to preserve URL hash across navigations
- [`packages/react/src/context/FormContext.js`](./packages/react/src/context/FormContext.js.md) — Shared context connecting `<StoryboardForm>` to child input components without prop drilling

#### Hooks

- [`packages/react/src/hooks/useSceneData.js`](./packages/react/src/hooks/useSceneData.js.md) — Primary data-access hook that resolves dot-notation paths with hash-param overrides merged on top
- [`packages/react/src/hooks/useOverride.js`](./packages/react/src/hooks/useOverride.js.md) — Core hook for reading and writing overrides on top of scene data via the URL hash
- [`packages/react/src/hooks/useScene.js`](./packages/react/src/hooks/useScene.js.md) — Hook for reading the current scene name and programmatically switching between scenes
- [`packages/react/src/hooks/useRecord.js`](./packages/react/src/hooks/useRecord.js.md) — Hooks for loading record collections with URL-hash override support for dynamic routes
- [`packages/react/src/hooks/useRecordOverride.js`](./packages/react/src/hooks/useRecordOverride.js.md) — Convenience wrapper around `useOverride` for record entry fields with automatic path construction
- [`packages/react/src/hooks/useLocalStorage.js`](./packages/react/src/hooks/useLocalStorage.js.md) — Hook for persistent localStorage-backed overrides that survive page refreshes
- [`packages/react/src/hooks/useHideMode.js`](./packages/react/src/hooks/useHideMode.js.md) — Hook exposing hide mode to move hash overrides into localStorage for clean URLs
- [`packages/react/src/hooks/useUndoRedo.js`](./packages/react/src/hooks/useUndoRedo.js.md) — Undo/redo controls for the override history stack
- [`packages/react/src/hooks/useSession.js`](./packages/react/src/hooks/useSession.js.md) — Deprecated alias for `useOverride`, kept for backwards compatibility

#### Build Tools

- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — Vite plugin that scans for data files, validates uniqueness, and generates the virtual data index module

## Entry Points

The application bootstraps from a single entry point that wires together React, Primer theming, React Router, and all storyboard runtime interceptors. This is where the component tree is mounted to the DOM and where development-only features like devtools are conditionally installed.

- [`src/index.jsx`](./src/index.jsx.md) — Application entry point that mounts React with Primer theming, React Router, hash preservation, and devtools

## Routing

Routing uses Generouted's file-based convention where each file in `src/pages/` becomes a route automatically. The root layout component (`_app.jsx`) wraps all routes in a `StoryboardProvider`, ensuring scene data is available everywhere. A `<Suspense>` boundary handles lazy-loaded route transitions with a spinner fallback, and `<Outlet />` renders the matched child route.

Because routes are auto-generated from the filesystem, adding a new page is as simple as creating a `.jsx` file in `src/pages/`. Dynamic routes use bracket notation (e.g. `[id].jsx`) and pair with `.record.json` files for data-driven pages.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout wrapping all routes in `StoryboardProvider` with `Suspense` and `Outlet`

## Configuration

The project is a private ESM monorepo using npm workspaces, with the two storyboard packages (`@dfosco/storyboard-core` and `@dfosco/storyboard-react`) living under `packages/*`. The Vite configuration orchestrates the build pipeline — wiring together the storyboard data plugin, React plugin, Generouted routing, and a PostCSS pipeline for Primer Primitives CSS custom media queries.

- [`package.json`](./package.json.md) — Monorepo root defining workspaces, scripts, and the dependency tree for React 19 + Vite
- [`vite.config.js`](./vite.config.js.md) — Build configuration connecting the data plugin, React, Generouted, PostCSS, and chunk splitting

## Pages

Page components live in `src/pages/` and are automatically mapped to URL routes by Generouted. Each page consumes storyboard data via hooks and renders UI with Primer React components.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page route (`/`) rendering the Playground component and ColorModeSwitcher

