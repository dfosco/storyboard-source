# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Configuration

The build toolchain is Vite with React and PostCSS. Vite handles bundling, dev server, and file-based route generation (via the Generouted plugin). The PostCSS pipeline injects Primer Primitives design tokens as global CSS custom media and transpiles modern CSS features for GitHub's browser targets. The project is an ESM-only (`"type": "module"`) React 19 app with Primer React as the UI layer.

- [`package.json`](./package.json.md) — Project manifest: scripts (`dev`, `build`, `lint`, `preview`), runtime and dev dependencies
- [`vite.config.js`](./vite.config.js.md) — Vite config: React plugin, Generouted routing plugin, PostCSS pipeline with Primer Primitives

## Entry Points

The app mounts at `src/index.jsx`, which sets up the React root with Primer's `ThemeProvider` (auto color mode), global styles, and the Generouted `<Routes />` component that loads the file-based route tree from `src/pages/`.

- [`src/index.jsx`](./src/index.jsx.md) — React root: ThemeProvider, BaseStyles, ColorModeSwitcher, and Routes

## Routing

Routing uses Generouted's file-based convention: files in `src/pages/` become routes automatically. The `_app.jsx` file is the root layout that wraps all routes in the `StoryboardProvider`, making scene data available to every page via React context. This means any page component can call `useSceneData()` without setup.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout: wraps all routes in StoryboardProvider + Outlet

## Storyboard System

The storyboard system separates prototype data from UI components. Data lives in JSON files under `src/data/` (split into reusable "objects" and composable "scenes"). The **loader** (`core/loader.js`) reads scene files at build time via `import.meta.glob`, resolves `$ref` (inline file replacement) and `$global` (root-level merge) directives, and returns a flat data object. The **provider** (`context.jsx`) loads a scene on mount and exposes it via React context. Components access data through the **`useSceneData(path?)`** hook, which supports dot-notation paths like `'user.profile.name'`. Scene selection is URL-driven (`?scene=name`) with a `"default"` fallback.

- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene loader: resolves `$ref`/`$global` directives, JSONC support, circular ref detection
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — StoryboardProvider: loads scene data, blocks rendering until ready, provides context
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context object (separated to avoid circular imports)
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — `useSceneData(path?)` and `useSceneLoading()` hooks for consuming scene data
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — `getByPath()` utility for dot-notation object traversal
- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Public barrel: re-exports Provider, hooks, loader, and utilities
- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component showcasing `useSceneData()` hook usage
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug component: renders resolved scene data as formatted JSON

## Pages

Page routes are auto-generated from `src/pages/` by Generouted. Each `.jsx` file becomes a route at its corresponding URL path. All pages render inside the `_app.jsx` layout and have access to storyboard scene data.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page (`/`): renders Playground and ColorModeSwitcher

## Data Files

Scene data lives in `src/data/scenes/` and reusable data fragments in `src/data/objects/`. Scenes compose objects using `$ref` directives (`{ "$ref": "../objects/name" }`) that get resolved at load time. Each scene defines a complete data context for a prototype — switching scenes via the `?scene=` URL param swaps all the data components see, enabling the same UI to render with different content.

- [`src/data/scenes/default.json`](./src/data/scenes/default.json.md) — Default scene: Jane Doe user, navigation, projects, and settings (uses `$ref` for shared objects)
- [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) — Alternate scene: John Doe user (inline), same navigation/projects/settings


