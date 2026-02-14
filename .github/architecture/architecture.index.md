# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is the core engine that makes Storyboard a stateful prototyping framework. It provides a complete data flow: scene JSON files define defaults, a loader resolves `$ref` and `$global` directives into flat data, React context makes that data available to all components, and URL hash params enable runtime overrides that persist across navigations and can be shared via URL.

The two primary hooks are [`useSceneData(path)`](./src/storyboard/hooks/useSceneData.js.md) for read-only access (hash overrides applied transparently) and [`useOverride(path)`](./src/storyboard/hooks/useOverride.js.md) for read/write access to hash-based overrides. The [`hashPreserver`](./src/storyboard/core/hashPreserver.js.md) ensures hash params survive all navigations — both `<a>` clicks and programmatic `navigate()` calls — by patching both the document click handler and `router.navigate()` at the router level.

The storyboard also provides form components ([`TextInput`](./src/storyboard/components/TextInput.jsx.md), [`Select`](./src/storyboard/components/Select.jsx.md), [`Textarea`](./src/storyboard/components/Textarea.jsx.md), [`Checkbox`](./src/storyboard/components/Checkbox.jsx.md)) that wrap Primer React originals and automatically persist values to URL hash via [`StoryboardForm`](./src/storyboard/components/StoryboardForm.jsx.md). The session layer ([`session.js`](./src/storyboard/core/session.js.md)) provides low-level hash param read/write utilities.

- [`src/storyboard/components/Checkbox.jsx`](./src/storyboard/components/Checkbox.jsx.md) — Primer Checkbox wrapper with session-aware form binding
- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component showing useSceneData and useOverride usage
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug panel rendering resolved scene data as formatted JSON
- [`src/storyboard/components/Select.jsx`](./src/storyboard/components/Select.jsx.md) — Primer Select wrapper with session-aware form binding
- [`src/storyboard/components/StoryboardForm.jsx`](./src/storyboard/components/StoryboardForm.jsx.md) — Form wrapper that buffers values locally and flushes to URL hash on submit
- [`src/storyboard/components/Textarea.jsx`](./src/storyboard/components/Textarea.jsx.md) — Primer Textarea wrapper with session-aware form binding
- [`src/storyboard/components/TextInput.jsx`](./src/storyboard/components/TextInput.jsx.md) — Primer TextInput wrapper with session-aware form binding
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — StoryboardProvider: loads scenes into React context with page-scene matching
- [`src/storyboard/context/FormContext.js`](./src/storyboard/context/FormContext.js.md) — React context for StoryboardForm state management
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — Dot-notation path accessor utility (getByPath)
- [`src/storyboard/core/hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md) — Preserves URL hash across all navigations (links + programmatic navigate)
- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene loader: resolves $ref/$global directives, JSONC support
- [`src/storyboard/core/session.js`](./src/storyboard/core/session.js.md) — Low-level URL hash param read/write utilities
- [`src/storyboard/hooks/useOverride.js`](./src/storyboard/hooks/useOverride.js.md) — Read/write hook for hash-based overrides on scene data
- [`src/storyboard/hooks/useScene.js`](./src/storyboard/hooks/useScene.js.md) — Scene name and switchScene() accessor
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — Read-only hook for scene data with transparent override merging
- [`src/storyboard/hooks/useSession.js`](./src/storyboard/hooks/useSession.js.md) — Deprecated alias for useOverride (backwards compatibility)
- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Barrel file re-exporting all storyboard APIs
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context definition for scene data

## Data Files

Scene files define the data contexts for prototype flows. Each scene composes reusable objects from `src/data/objects/` via `$ref` (inline replacement) and `$global` (root-level merge) directives, resolved at load time by the [`loader`](./src/storyboard/core/loader.js.md). Scenes can be loaded explicitly via `?scene=` URL param or auto-matched to pages by file name (e.g., `scenes/Repositories.json` loads automatically for `/Repositories`).

The [`default.json`](./src/data/scenes/default.json.md) scene includes a `signup` data shape that provides empty defaults for the cloud signup flow — these values are overridden at runtime by the Signup page and read by the Dashboard page, demonstrating the full override lifecycle.

- [`src/data/scenes/default.json`](./src/data/scenes/default.json.md) — Default scene with user, navigation, projects, settings, and signup data
- [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) — Alternative scene for testing scene switching
- [`src/data/scenes/Repositories.json`](./src/data/scenes/Repositories.json.md) — Repositories page scene (auto-matched)
- [`src/data/scenes/SecurityAdvisory.json`](./src/data/scenes/SecurityAdvisory.json.md) — Security Advisory page scene (auto-matched)

## Entry Points

The app entry point creates the React Router instance with lazy-loaded routes for code splitting, installs the global hash preserver, and wraps the render tree in Primer's theme provider. Only Primer is loaded globally — other design systems (e.g., Reshaped) are imported per-page.

- [`src/index.jsx`](./src/index.jsx.md) — App entry: router setup, hash preserver, Primer theme, lazy routes

## Routing

The root layout wraps all pages in the StoryboardProvider, which loads the appropriate scene data into React context.

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout: StoryboardProvider wrapper for all routes

## Configuration

- [`package.json`](./package.json.md) — Project manifest: scripts, Primer + Reshaped + Generouted dependencies
- [`vite.config.js`](./vite.config.js.md) — Vite config: React plugin, generouted, dev server port 1234

## Pages

Pages are route components in `src/pages/`. Routes are auto-generated by Generouted and lazy-loaded for code splitting. Pages using non-Primer design systems (Signup, Dashboard use Reshaped) wrap themselves in the appropriate provider locally.

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Homepage: Primer Playground with color mode switcher

