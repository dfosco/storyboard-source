# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is the core data layer that separates UI prototype data from components. It is split into two packages: **`@dfosco/storyboard-core`** (framework-agnostic, zero npm dependencies) and **`@dfosco/storyboard-react`** (React bindings with hooks and context providers). A Vite plugin bridges build-time data discovery with runtime consumption.

Data flows through three file types — scenes (`.scene.json`), objects (`.object.json`), and records (`.record.json`) — discovered at build time by the [Vite data plugin](./packages/react/src/vite/data-plugin.js.md). The plugin pre-parses all JSON/JSONC files and generates a virtual module that calls [`init()`](./packages/core/src/loader.js.md) to seed the in-memory data index. At runtime, the [`StoryboardProvider`](./packages/react/src/context.jsx.md) loads scene data via [`loadScene()`](./packages/core/src/loader.js.md), resolving `$ref` and `$global` references, and makes it available to the component tree through React context.

The override system allows interactive manipulation of scene data without modifying JSON files. Overrides live in the URL hash (`#key=value`) in normal mode or in localStorage in "hide mode" (clean URLs for sharing). The [`useOverride`](./packages/react/src/hooks/useOverride.js.md) hook provides read/write access with automatic shadow mirroring, while [`useSceneData`](./packages/react/src/hooks/useSceneData.js.md) provides read-only access with transparent override merging. A full undo/redo history stack is maintained in localStorage by [`hideMode.js`](./packages/core/src/hideMode.js.md), with React access via [`useUndoRedo`](./packages/react/src/hooks/useUndoRedo.js.md).

Reactivity is achieved through two `useSyncExternalStore` subscriptions: [`subscribeToHash`](./packages/core/src/hashSubscribe.js.md) for URL hash changes and [`subscribeToStorage`](./packages/core/src/localStorage.js.md) for localStorage changes (both intra-tab via custom events and cross-tab via the native `storage` event). This dual-subscription pattern appears in nearly every React hook. The [`hashPreserver`](./packages/react/src/hashPreserver.js.md) ensures hash params survive client-side navigations by intercepting both `<a>` clicks and programmatic `router.navigate()` calls.

### Core Package (`@dfosco/storyboard-core`)

- [`packages/core/src/index.js`](./packages/core/src/index.js.md) — Barrel export for all core utilities
- [`packages/core/src/loader.js`](./packages/core/src/loader.js.md) — Data index, scene/record loading, `$ref`/`$global` resolution
- [`packages/core/src/dotPath.js`](./packages/core/src/dotPath.js.md) — Dot-notation path utilities (`getByPath`, `setByPath`, `deepClone`)
- [`packages/core/src/session.js`](./packages/core/src/session.js.md) — URL hash session state (read/write params)
- [`packages/core/src/localStorage.js`](./packages/core/src/localStorage.js.md) — localStorage persistence with cross-tab and intra-tab reactivity
- [`packages/core/src/hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md) — Hash change subscription for `useSyncExternalStore`
- [`packages/core/src/hideMode.js`](./packages/core/src/hideMode.js.md) — Hide mode toggle, undo/redo history stack, shadow read/write
- [`packages/core/src/interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md) — Intercepts `?hide`/`?show` URL params
- [`packages/core/src/devtools.js`](./packages/core/src/devtools.js.md) — Floating DevTools toolbar (vanilla JS)
- [`packages/core/src/sceneDebug.js`](./packages/core/src/sceneDebug.js.md) — Inline scene debug panel (vanilla JS)
- [`packages/core/src/viewfinder.js`](./packages/core/src/viewfinder.js.md) — Deterministic hash and scene-to-route resolution

### Core Tests

- [`packages/core/src/loader.test.js`](./packages/core/src/loader.test.js.md) — Tests for data loading, `$ref`/`$global` resolution, circular detection
- [`packages/core/src/dotPath.test.js`](./packages/core/src/dotPath.test.js.md) — Tests for path utilities and deep cloning
- [`packages/core/src/session.test.js`](./packages/core/src/session.test.js.md) — Tests for hash session CRUD
- [`packages/core/src/localStorage.test.js`](./packages/core/src/localStorage.test.js.md) — Tests for localStorage CRUD, events, and snapshots
- [`packages/core/src/hashSubscribe.test.js`](./packages/core/src/hashSubscribe.test.js.md) — Tests for hash subscription and snapshots
- [`packages/core/src/hideMode.test.js`](./packages/core/src/hideMode.test.js.md) — Tests for hide mode, history, undo/redo, shadow ops
- [`packages/core/src/interceptHideParams.test.js`](./packages/core/src/interceptHideParams.test.js.md) — Tests for URL param interception
- [`packages/core/src/devtools.test.js`](./packages/core/src/devtools.test.js.md) — Tests for DevTools DOM mounting
- [`packages/core/src/sceneDebug.test.js`](./packages/core/src/sceneDebug.test.js.md) — Tests for scene debug panel
- [`packages/core/src/viewfinder.test.js`](./packages/core/src/viewfinder.test.js.md) — Tests for hash function and route resolution

### React Package (`@dfosco/storyboard-react`)

- [`packages/react/src/index.js`](./packages/react/src/index.js.md) — Barrel export for React bindings
- [`packages/react/src/context.jsx`](./packages/react/src/context.jsx.md) — `StoryboardProvider` component (loads scene data into context)
- [`packages/react/src/StoryboardContext.js`](./packages/react/src/StoryboardContext.js.md) — React context object
- [`packages/react/src/hashPreserver.js`](./packages/react/src/hashPreserver.js.md) — Preserves URL hash across navigations
- [`packages/react/src/context/FormContext.js`](./packages/react/src/context/FormContext.js.md) — Form context for design system integration
- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — Vite plugin for data file discovery and virtual module generation

### React Hooks

- [`packages/react/src/hooks/useSceneData.js`](./packages/react/src/hooks/useSceneData.js.md) — Read scene data by dot-notation path with override merging
- [`packages/react/src/hooks/useOverride.js`](./packages/react/src/hooks/useOverride.js.md) — Read/write overrides (hash or shadow depending on mode)
- [`packages/react/src/hooks/useRecord.js`](./packages/react/src/hooks/useRecord.js.md) — Load record entries with hash override support
- [`packages/react/src/hooks/useRecordOverride.js`](./packages/react/src/hooks/useRecordOverride.js.md) — Override individual record entry fields
- [`packages/react/src/hooks/useScene.js`](./packages/react/src/hooks/useScene.js.md) — Read current scene name and switch scenes
- [`packages/react/src/hooks/useLocalStorage.js`](./packages/react/src/hooks/useLocalStorage.js.md) — Persistent localStorage overrides
- [`packages/react/src/hooks/useHideMode.js`](./packages/react/src/hooks/useHideMode.js.md) — Read/control hide mode
- [`packages/react/src/hooks/useUndoRedo.js`](./packages/react/src/hooks/useUndoRedo.js.md) — Undo/redo controls for override history
- [`packages/react/src/hooks/useSession.js`](./packages/react/src/hooks/useSession.js.md) — Deprecated alias for `useOverride`

### React Hook Tests

- [`packages/react/src/hooks/useSceneData.test.js`](./packages/react/src/hooks/useSceneData.test.js.md) — Tests for scene data reads and override merging
- [`packages/react/src/hooks/useOverride.test.js`](./packages/react/src/hooks/useOverride.test.js.md) — Tests for override read/write
- [`packages/react/src/hooks/useRecord.test.js`](./packages/react/src/hooks/useRecord.test.js.md) — Tests for record loading and hash overrides
- [`packages/react/src/hooks/useRecordOverride.test.js`](./packages/react/src/hooks/useRecordOverride.test.js.md) — Tests for record field overrides
- [`packages/react/src/hooks/useScene.test.js`](./packages/react/src/hooks/useScene.test.js.md) — Tests for scene name and switching
- [`packages/react/src/hooks/useLocalStorage.test.js`](./packages/react/src/hooks/useLocalStorage.test.js.md) — Tests for persistent overrides
- [`packages/react/src/hooks/useHideMode.test.js`](./packages/react/src/hooks/useHideMode.test.js.md) — Tests for hide mode toggle
- [`packages/react/src/hooks/useUndoRedo.test.js`](./packages/react/src/hooks/useUndoRedo.test.js.md) — Tests for undo/redo navigation
- [`packages/react/src/hooks/useSession.test.js`](./packages/react/src/hooks/useSession.test.js.md) — Tests for deprecated alias identity

## Entry Points

The application entry point initializes all framework-level integrations before rendering the React tree. It installs the hash preserver, hide param listener, history sync, and DevTools, then renders the app wrapped in Primer's `ThemeProvider`.

- [`src/index.jsx`](./src/index.jsx.md) — Application entry point, router setup, and integration bootstrapping

## Routing

File-based routing is provided by `@generouted/react-router`. The `_app.jsx` layout wraps all pages with the `StoryboardProvider` and a `Suspense` boundary. Each `.jsx` file in `src/pages/` automatically becomes a route.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout with `StoryboardProvider` and `Suspense`

## Configuration

Project configuration covers the Vite build system (plugins, dev server, chunk splitting, PostCSS) and the npm workspace structure for the monorepo.

- [`package.json`](./package.json.md) — Root monorepo manifest with workspaces, scripts, and dependencies
- [`vite.config.js`](./vite.config.js.md) — Vite config with storyboard data plugin, vendor splitting, and PostCSS

## Pages

Page components live in `src/pages/` and are automatically routed by generouted. Each page receives scene data via the `StoryboardProvider` in the `_app.jsx` layout.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Root page (`/`) with Playground and ColorModeSwitcher

