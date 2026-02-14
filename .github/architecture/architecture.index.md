# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is the core engine that separates data from UI. It provides a layered data pipeline: **data files** (`.scene.json`, `.object.json`, `.record.json`) are discovered at build time by a Vite plugin, loaded and resolved by the scene loader, and exposed to components via React context and hooks.

The system has three data tiers. **Objects** are reusable fragments (a user profile, navigation config). **Scenes** compose objects into a full page data context using `$ref` (inline replacement) and `$global` (root-level merge). **Records** are collections (arrays with `id` per entry) that power dynamic routes — the same page template renders different content based on the URL slug.

Data flows through a clear pipeline: the [`storyboardData()`](./src/storyboard/vite/data-plugin.js.md) Vite plugin scans the repo and generates a virtual module → [`loader.js`](./src/storyboard/core/loader.js.md) consumes the index, resolves references, and returns flat data → [`StoryboardProvider`](./src/storyboard/context.jsx.md) loads scenes into React context → hooks like [`useSceneData()`](./src/storyboard/hooks/useSceneData.js.md), [`useRecord()`](./src/storyboard/hooks/useRecord.js.md), and [`useOverride()`](./src/storyboard/hooks/useOverride.js.md) give components read and write access to the data. URL hash parameters provide a runtime override layer — every value can be overridden via the URL, enabling shareable prototype states.

The hash preservation system ([`hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md)) patches both `<a>` click handling and `router.navigate()` to automatically carry hash params across page navigations. This means overrides persist without any per-page wiring — a critical architectural invariant.

- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Public barrel: all exports for external consumers
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — StoryboardProvider: loads scenes, optional record merging
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context object
- [`src/storyboard/vite/data-plugin.js`](./src/storyboard/vite/data-plugin.js.md) — Vite plugin: suffix-based data discovery, uniqueness validation, virtual module generation
- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene/record loader: name-based $ref/$global resolution
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — Dot-notation path accessor utility
- [`src/storyboard/core/hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md) — URL hash preservation across navigations
- [`src/storyboard/core/session.js`](./src/storyboard/core/session.js.md) — Low-level hash param read/write utilities
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — Read scene data with hash override merging
- [`src/storyboard/hooks/useOverride.js`](./src/storyboard/hooks/useOverride.js.md) — Read/write hash overrides
- [`src/storyboard/hooks/useRecord.js`](./src/storyboard/hooks/useRecord.js.md) — Load record entries by URL param
- [`src/storyboard/hooks/useScene.js`](./src/storyboard/hooks/useScene.js.md) — Scene name and switching
- [`src/storyboard/hooks/useSession.js`](./src/storyboard/hooks/useSession.js.md) — Legacy session hook
- [`src/storyboard/components/StoryboardForm.jsx`](./src/storyboard/components/StoryboardForm.jsx.md) — Form wrapper with submit-based hash persistence
- [`src/storyboard/components/TextInput.jsx`](./src/storyboard/components/TextInput.jsx.md) — Wrapped Primer TextInput for forms
- [`src/storyboard/components/Textarea.jsx`](./src/storyboard/components/Textarea.jsx.md) — Wrapped Primer Textarea for forms
- [`src/storyboard/components/Select.jsx`](./src/storyboard/components/Select.jsx.md) — Wrapped Primer Select for forms
- [`src/storyboard/components/Checkbox.jsx`](./src/storyboard/components/Checkbox.jsx.md) — Wrapped Primer Checkbox for forms
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug component showing resolved scene JSON
- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component for scene data

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
