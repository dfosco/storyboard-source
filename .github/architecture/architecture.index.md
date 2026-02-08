# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is the data architecture of this prototype app. It provides two layers of state management: **scene data** (read-only JSON loaded from files) and **session state** (read-write URL hash-based overrides).

Scene data lives in [`src/data/scenes/`](./src/data/scenes/default.json.md) as JSON/JSONC files. Each scene is a standalone data context for a flow or variant in the prototype. The [`loader`](./src/storyboard/core/loader.js.md) module resolves `$global` and `$ref` directives to merge reusable objects from `src/data/objects/` into the scene root. At runtime, [`StoryboardProvider`](./src/storyboard/context.jsx.md) loads the active scene (determined by `?scene=` URL param) and provides it to the component tree via [`StoryboardContext`](./src/storyboard/StoryboardContext.js.md). Components access scene data using the [`useSceneData`](./src/storyboard/hooks/useSceneData.js.md) hook with dot-notation paths.

Session state uses URL hash params (`#key=value`) to store transient UI state that shouldn't trigger React Router re-renders. React Router (via `generouted`) patches `history.replaceState/pushState`, so any search param change causes a full route tree re-render. The hash is invisible to the router. The [`session.js`](./src/storyboard/core/session.js.md) module provides low-level utilities (`getParam`, `setParam`, `removeParam`) for reading and writing hash params. The [`useSession`](./src/storyboard/hooks/useSession.js.md) hook wraps these utilities with `useSyncExternalStore` to reactively subscribe to `hashchange` events. Values from hash params override scene defaults, enabling URL-based state that persists across refreshes without mutating scene JSON.

**Form components** ([`StoryboardForm`](./src/storyboard/components/StoryboardForm.jsx.md), [`TextInput`](./src/storyboard/components/TextInput.jsx.md), `Textarea`, `Select`, `Checkbox`) provide a designer-friendly API for forms. They wrap Primer React components and integrate with the session system via [`FormContext`](./src/storyboard/context/FormContext.js.md). Values are buffered locally while typing and only flushed to URL hash on form submit.

**Hash preservation** is handled by [`hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md), a document-level click interceptor installed in [`src/index.jsx`](./src/index.jsx.md). It converts plain `<a>` clicks into client-side React Router navigations, carrying the current hash forward. This ensures session state is never lost during page navigation.

All public exports are re-exported through the barrel file [`src/storyboard/index.js`](./src/storyboard/index.js.md). This separation of scene data (immutable, file-backed) and session state (ephemeral, URL-backed) lets prototypes use JSON for fixture data while keeping transient UI state (filters, form inputs, selected tabs, etc.) out of the data layer.

- [`src/storyboard/components/SceneDataDemo.jsx`](./src/storyboard/components/SceneDataDemo.jsx.md) — Demo component showcasing `useSession`, `useScene`, and `StoryboardForm`
- [`src/storyboard/components/SceneDebug.jsx`](./src/storyboard/components/SceneDebug.jsx.md) — Debug component that renders raw resolved scene JSON
- [`src/storyboard/components/StoryboardForm.jsx`](./src/storyboard/components/StoryboardForm.jsx.md) — Form wrapper that buffers values locally, flushes to URL hash on submit
- [`src/storyboard/components/TextInput.jsx`](./src/storyboard/components/TextInput.jsx.md) — Wrapped Primer TextInput with form context integration (Textarea, Select, Checkbox follow the same pattern)
- [`src/storyboard/context.jsx`](./src/storyboard/context.jsx.md) — Provider component that loads scene data and exposes it via React context
- [`src/storyboard/context/FormContext.js`](./src/storyboard/context/FormContext.js.md) — React context connecting StoryboardForm to wrapped input components
- [`src/storyboard/core/dotPath.js`](./src/storyboard/core/dotPath.js.md) — Utility for reading nested values with dot-notation paths
- [`src/storyboard/core/hashPreserver.js`](./src/storyboard/core/hashPreserver.js.md) — Document-level interceptor for client-side navigation with hash preservation
- [`src/storyboard/core/loader.js`](./src/storyboard/core/loader.js.md) — Scene loader that resolves `$global` and `$ref` directives
- [`src/storyboard/core/session.js`](./src/storyboard/core/session.js.md) — Low-level URL hash utilities for session state
- [`src/storyboard/hooks/useSceneData.js`](./src/storyboard/hooks/useSceneData.js.md) — Hook for accessing read-only scene data
- [`src/storyboard/hooks/useSession.js`](./src/storyboard/hooks/useSession.js.md) — Hook for read/write session state with hash-based storage
- [`src/storyboard/index.js`](./src/storyboard/index.js.md) — Public barrel file exporting all storyboard APIs
- [`src/storyboard/StoryboardContext.js`](./src/storyboard/StoryboardContext.js.md) — React context object shared by provider and hooks

## Data Files

Scene data files define the fixture data for different prototype flows. Each scene is a complete data context loaded by the storyboard system. Scenes use `$global` arrays to merge shared objects from `src/data/objects/` and `$ref` objects for inline references.

- [`src/data/scenes/default.json`](./src/data/scenes/default.json.md) — Default scene loaded when no `?scene=` param is present
- [`src/data/scenes/other-scene.json`](./src/data/scenes/other-scene.json.md) — Example alternative scene

## Entry Points

- [`src/index.jsx`](./src/index.jsx.md) — Application entry point that mounts React, creates the router, and installs the hash-preserving navigation interceptor

## Routing

- [`src/pages/_app.jsx`](./src/pages/_app.jsx.md) — Root layout wrapping all routes with `StoryboardProvider`

## Configuration

- [`package.json`](./package.json.md) — Project dependencies and scripts
- [`vite.config.js`](./vite.config.js.md) — Vite build config with React, Generouted routing, and Primer CSS pipeline

## Pages

- [`src/pages/index.jsx`](./src/pages/index.jsx.md) — Home page route
- `src/pages/Forms.jsx` — Form components demo page using `StoryboardForm`, `TextInput`, `Textarea`, `Select`, `Checkbox`

