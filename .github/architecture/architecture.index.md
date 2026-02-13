# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is the runtime data layer that powers this prototyping app. It loads JSON scene files, resolves `$global` and `$ref` directives, and provides the resulting data to React components via context. The system is designed so designers and developers can iterate on UI prototypes without hard-coding data — instead, data lives in composable JSON files under `src/data/`, and components read it through hooks.

The data flow starts with [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md), which eagerly bundles all data files at build time via `import.meta.glob` and resolves scene composition directives (`$global` for root-level merging, `$ref` for inline replacement). The [`StoryboardProvider`](./src/storyboard/context.jsx.md) wraps the app, calls the loader on mount, and exposes the resolved data through [`StoryboardContext`](./src/storyboard/StoryboardContext.js.md). Components access this data via [`useSceneData()`](./src/storyboard/hooks/useSceneData.js.md) with dot-notation paths (overrides applied transparently), or use [`useOverride()`](./src/storyboard/hooks/useOverride.js.md) when they need to **write** overrides to the URL hash.

The two hooks have a clear division: **`useSceneData(path)`** is for reading data (use this by default), and **`useOverride(path)`** is for writing overrides (use this in form inputs, toggle buttons, or any interactive control that modifies state). Both resolve the same merged value (scene data + hash overrides), but `useOverride` additionally returns a setter and a clear function.

The form component subsystem ([`StoryboardForm`](./src/storyboard/components/StoryboardForm.jsx.md), [`TextInput`](./src/storyboard/components/TextInput.jsx.md), [`Select`](./src/storyboard/components/Select.jsx.md), [`Checkbox`](./src/storyboard/components/Checkbox.jsx.md), [`Textarea`](./src/storyboard/components/Textarea.jsx.md)) provides form inputs that buffer values locally and persist to the URL hash on submit. The public API is exposed through the barrel file [`src/storyboard/index.js`](./src/storyboard/index.js.md), which re-exports all hooks, components, and utilities.

- [`src/storyboard/components/Checkbox.jsx`](./src/storyboard/components/Checkbox.jsx.md) — Wrapped Primer Checkbox with form integration and boolean override persistence
- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component showing override read/write and scene switching
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug component that renders resolved scene data as formatted JSON
- [`src/storyboard/components/Select.jsx`](./src/storyboard/components/Select.jsx.md) — Wrapped Primer Select with form integration and override persistence
- [`src/storyboard/components/StoryboardForm.jsx`](./src/storyboard/components/StoryboardForm.jsx.md) — Form wrapper that buffers input values and persists overrides on submit
- [`src/storyboard/components/Textarea.jsx`](./src/storyboard/components/Textarea.jsx.md) — Wrapped Primer Textarea with form integration and override persistence
- [`src/storyboard/components/TextInput.jsx`](./src/storyboard/components/TextInput.jsx.md) — Wrapped Primer TextInput with form integration and override persistence
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — StoryboardProvider that loads scene data and provides it via React context
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — Dot-notation path resolution utility for nested data access
- [`src/storyboard/core/hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md) — Intercepts client-side navigation to preserve URL hash parameters
- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene loader that resolves $global and $ref directives from JSON data files
- [`src/storyboard/core/session.js`](./src/storyboard/core/session.js.md) — URL hash parameter read/write utilities (low-level primitives)
- [`src/storyboard/hooks/useOverride.js`](./src/storyboard/hooks/useOverride.js.md) — Hook for reading/writing URL hash overrides on scene data
- [`src/storyboard/hooks/useScene.js`](./src/storyboard/hooks/useScene.js.md) — Hook for reading current scene name and switching scenes
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — Primary read-only hook for accessing scene data (overrides applied transparently)
- [`src/storyboard/hooks/useSession.js`](./src/storyboard/hooks/useSession.js.md) — Deprecated re-export of useOverride (backwards compatibility)
- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Public barrel file re-exporting all storyboard APIs
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context definition for storyboard data

## Data Files

Scene files and data objects form the content layer of the storyboard system. Scenes in `src/data/scenes/` define the complete data context for a page or flow, composing reusable objects from `src/data/objects/` via `$global` (root merge) and `$ref` (inline replacement) directives. The loader resolves these at runtime, producing a flat data object that components consume.

Page-scene matching enables automatic scene loading: when a scene file name matches the current page route (e.g., `Repositories.json` for `/Repositories`), the [`StoryboardProvider`](./src/storyboard/context.jsx.md) loads it without requiring a `?scene=` URL parameter.

- [`src/data/scenes/default.json`](./src/data/scenes/default.json.md) — Default scene loaded when no scene is specified
- [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) — Alternative scene for testing scene switching
- [`src/data/scenes/Repositories.json`](./src/data/scenes/Repositories.json.md) — Scene for the Repositories page with Finch Pearl design data
- [`src/data/scenes/SecurityAdvisory.json`](./src/data/scenes/SecurityAdvisory.json.md) — Scene for the Security Advisory page with advisory detail data

## Entry Points

The app entry point bootstraps React, applies the Primer theme, and sets up the router.

- [`src/index.jsx`](./src/index.jsx.md) — App root: React DOM render, Primer ThemeProvider, and router mounting

## Routing

File-based routing is handled by `@generouted/react-router`, which auto-generates routes from `src/pages/`. The app layout wraps all routes with the [`StoryboardProvider`](./src/storyboard/context.jsx.md).

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout component wrapping routes with StoryboardProvider and hash preserver

## Configuration

Build tooling and project metadata. The Vite config wires together React, file-based routing, and the PostCSS pipeline for Primer design tokens.

- [`package.json`](./package.json.md) — Project manifest with scripts, dependencies, and ESM configuration
- [`vite.config.js`](./vite.config.js.md) — Vite build config with React, Generouted, and PostCSS for Primer tokens

## Pages

Page components live in `src/pages/` and are auto-discovered by the Generouted routing plugin. Each file becomes a route.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page at `/`

