# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system separates prototype data from UI components, enabling the same interface to render with different data by switching scenes via a URL parameter (`?scene=name`). It has three layers: a **data layer** (JSON files in `src/data/`), a **loader** that resolves references at build time, and a **React context + hooks** layer that delivers resolved data to components.

The data flow starts with [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md), which uses Vite's `import.meta.glob` to eagerly bundle all JSON/JSONC files under `src/data/` at build time. When a scene is requested, the loader reads the scene file, processes `$global` directives (root-level merges from referenced files), then recursively resolves `$ref` directives (inline replacements where `{ "$ref": "../objects/name" }` is replaced with that file's contents). The result is a single flat JavaScript object with all references inlined. Circular `$ref` chains are detected and throw an error.

The [`StoryboardProvider`](./src/storyboard/context.jsx.md) (placed at the root layout in [`src/pages/_app.jsx`](./src/pages/_app.jsx.md)) calls `loadScene()` on mount and exposes the result via [`StoryboardContext`](./src/storyboard/StoryboardContext.js.md). Components access data through [`useSceneData(path?)`](./src/storyboard/hooks/useSceneData.js.md), which supports dot-notation paths like `'user.profile.name'` powered by the [`getByPath()`](./src/storyboard/core/dotPath.js.md) utility. The provider blocks rendering until data is loaded, so components can safely destructure without null checks.

The public API is re-exported through a barrel file at [`src/storyboard/index.js`](./src/storyboard/index.js.md): `StoryboardProvider`, `useSceneData`, `useSceneLoading`, `getByPath`, and `loadScene`. Two debug/demo components — [`SceneDataDemo`](./src/storyboard/components/SceneDataDemo.jsx.md) (uses hooks) and [`SceneDebug`](./src/storyboard/components/SceneDebug.jsx.md) (uses loader directly) — demonstrate both consumption patterns.

- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene loader: resolves `$ref`/`$global` directives, JSONC support, circular ref detection
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — StoryboardProvider: loads scene data, blocks rendering until ready, provides context
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context object (separated to avoid circular imports)
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — `useSceneData(path?)` and `useSceneLoading()` hooks for consuming scene data
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — `getByPath()` utility for dot-notation object traversal
- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Public barrel: re-exports Provider, hooks, loader, and utilities
- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component showcasing `useSceneData()` hook usage
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug component: renders resolved scene data as formatted JSON

## Data Files

Scene data is the content layer of the storyboard system. It lives in two directories under `src/data/`: **objects** (`src/data/objects/`) contain reusable data fragments (a user profile, navigation items), while **scenes** (`src/data/scenes/`) compose those objects into complete data contexts for a prototype.

Scenes support two composition directives processed by the [`loader`](./src/storyboard/core/loader.js.md): `$ref` replaces an object with the contents of another file (`{ "$ref": "../objects/jane-doe" }`), and `$global` merges an array of referenced files into the scene root. This separation means shared data (like navigation) is defined once and reused across scenes, while scene-specific data (like project lists or settings) is defined inline.

Switching between scenes is URL-driven — navigating to `?scene=other-scene` causes the [`StoryboardProvider`](./src/storyboard/context.jsx.md) to load [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) instead of the [`default`](./src/data/scenes/default.json.md), swapping all the data that components see. This enables testing the same UI with different users, configurations, or content without changing any component code.

- [`src/data/scenes/default.json`](./src/data/scenes/default.json.md) — Default scene: Jane Doe user, navigation, projects, and settings (uses `$ref` for shared objects)
- [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) — Alternate scene: John Doe user (inline), same navigation/projects/settings

## Entry Points

The app mounts at [`src/index.jsx`](./src/index.jsx.md), which sets up the React root with Primer's `ThemeProvider` (auto color mode), global styles (`reset.css`, `globals.css`), and the Generouted `<Routes />` component that loads the file-based route tree from `src/pages/`.

- [`src/index.jsx`](./src/index.jsx.md) — React root: ThemeProvider, BaseStyles, ColorModeSwitcher, and Routes

## Routing

Routing uses Generouted's file-based convention: files in `src/pages/` become routes automatically. The [`_app.jsx`](./src/pages/_app.jsx.md) file is the root layout that wraps all routes in the [`StoryboardProvider`](./src/storyboard/context.jsx.md), making scene data available to every page via React context. This means any page component can call [`useSceneData()`](./src/storyboard/hooks/useSceneData.js.md) without setup.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout: wraps all routes in StoryboardProvider + Outlet

## Configuration

The build toolchain is Vite with React and PostCSS. [`vite.config.js`](./vite.config.js.md) configures the Generouted plugin for file-based routing and a PostCSS pipeline that injects Primer Primitives design tokens as global CSS custom media. The project is defined in [`package.json`](./package.json.md) as a private ESM React 19 app.

- [`package.json`](./package.json.md) — Project manifest: scripts (`dev`, `build`, `lint`, `preview`), runtime and dev dependencies
- [`vite.config.js`](./vite.config.js.md) — Vite config: React plugin, Generouted routing plugin, PostCSS pipeline with Primer Primitives

## Pages

Page routes are auto-generated from `src/pages/` by Generouted. Each `.jsx` file becomes a route at its corresponding URL path. All pages render inside the [`_app.jsx`](./src/pages/_app.jsx.md) layout and have access to storyboard scene data.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page (`/`): renders Playground and ColorModeSwitcher

