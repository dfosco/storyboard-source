# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## Storyboard System

The storyboard system is a monorepo with seven npm packages, each with a distinct responsibility. [`@dfosco/storyboard`](./packages/storyboard/src/core/cli/index.js.md) (`packages/storyboard`) is the CLI and canvas runtime package — it ships the `storyboard` / `sb` binary, the canvas server, the messaging bus, the terminal system, and all agent integration. [`@dfosco/storyboard-core`](./packages/core/package.json.md) (`packages/core`) is the framework-agnostic foundation — zero npm UI dependencies, pure JavaScript. It owns data loading ([`loader.js`](./packages/core/src/loader.js.md)), URL hash session state ([`session.js`](./packages/core/src/session.js.md)), design modes ([`modes.js`](./packages/core/src/modes.js.md)), the config schema ([`configSchema.js`](./packages/core/src/configSchema.js.md)), feature flags ([`featureFlags.js`](./packages/core/src/featureFlags.js.md)), the toolbar tool registry ([`toolRegistry.js`](./packages/core/src/toolRegistry.js.md)), and the CoreUIBar toolbar ([`devtools.js`](./packages/core/src/devtools.js.md)). [`@dfosco/storyboard-react`](./packages/react/package.json.md) (`packages/react`) provides React bindings — the [`StoryboardProvider`](./packages/react/src/context.jsx.md), all data hooks (`useFlowData`, `useOverride`, `useObject`, `useRecord`), the Workspace dashboard, command palette, canvas page, and the Vite [`data-plugin`](./packages/react/src/vite/data-plugin.js.md) that discovers data files at build time. [`@dfosco/storyboard-react-primer`](./packages/react-primer/package.json.md) and [`@dfosco/storyboard-react-reshaped`](./packages/react-reshaped/package.json.md) are design-system-specific component wrappers (form inputs, debug panels, theme sync). [`@dfosco/tiny-canvas`](./packages/tiny-canvas/package.json.md) is a standalone drag-and-drop canvas library used by canvas pages. The root [`package.json`](./package.json.md) is the host app that consumes all packages.

Data flows through three stages: **build-time discovery** → **runtime loading** → **React rendering**. The [`data-plugin`](./packages/react/src/vite/data-plugin.js.md) scans the filesystem for `.flow.json`, `.object.json`, `.record.json`, `.prototype.json`, `.canvas.jsonl`, and `.story.jsx` files and generates a virtual module (`virtual:storyboard-data-index`) that seeds the core [`loader`](./packages/core/src/loader.js.md) at startup. The loader resolves `$ref` and `$global` references in flows, scopes names within prototypes, and provides synchronous access to all data. React hooks read from the loader via [`StoryboardContext`](./packages/react/src/StoryboardContext.js.md), merging URL hash overrides or localStorage shadow overrides (in hide mode) on top of the base data.

The toolbar system is fully config-driven and has completed its migration from Svelte to React. Tools are declared in `toolbar.config.json` and registered at runtime via [`toolRegistry.js`](./packages/core/src/toolRegistry.js.md). The [`toolbarConfigStore`](./packages/core/src/toolbarConfigStore.js.md) supports layered overrides (core → client → prototype). [`devtools.js`](./packages/core/src/devtools.js.md) now mounts the CoreUIBar as a React component using `createRoot()`. The command palette uses [`paletteProviders`](./packages/core/src/paletteProviders.js.md) and [`fuzzySearch`](./packages/core/src/fuzzySearch.js.md) for fast, tiered search across commands, prototypes, canvases, and stories.

App initialization is orchestrated by [`mountStoryboardCore`](./packages/core/src/mountStoryboardCore.js.md), which runs early DOM setup (theme, chrome-hidden state, localStorage key migrations), installs URL state listeners, initializes all config subsystems, and mounts the toolbar. Canvas-specific configuration (paste rules, terminal settings, agent overrides) lives in [`canvasConfig.js`](./packages/core/src/canvasConfig.js.md) and supports per-agent dimension and resizability overrides.

### `@dfosco/storyboard-core` — Core Package

- [`packages/core/src/index.js`](./packages/core/src/index.js.md) — Barrel module re-exporting all public core APIs
- [`packages/core/src/loader.js`](./packages/core/src/loader.js.md) — Data loading engine with `$ref`/`$global` resolution
- [`packages/core/src/loader.test.js`](./packages/core/src/loader.test.js.md) — Tests for the data loader
- [`packages/core/src/bodyClasses.js`](./packages/core/src/bodyClasses.js.md) — Syncs `<body>` CSS classes with storyboard override state
- [`packages/core/src/bodyClasses.test.js`](./packages/core/src/bodyClasses.test.js.md) — Tests for body class synchronization
- [`packages/core/src/canvasConfig.js`](./packages/core/src/canvasConfig.js.md) — Runtime store for canvas paste rules, terminal config, and agent overrides
- [`packages/core/src/canvasConfig.test.js`](./packages/core/src/canvasConfig.test.js.md) — Tests for canvas config including agent override cascading
- [`packages/core/src/commandActions.js`](./packages/core/src/commandActions.js.md) — Config-driven command menu action registry
- [`packages/core/src/commandPaletteConfig.js`](./packages/core/src/commandPaletteConfig.js.md) — Runtime store for command palette section configuration
- [`packages/core/src/configSchema.js`](./packages/core/src/configSchema.js.md) — Canonical shape, typedefs, and defaults for `storyboard.config.json`
- [`packages/core/src/configSchema.test.js`](./packages/core/src/configSchema.test.js.md) — Tests for config schema validation
- [`packages/core/src/configStore.js`](./packages/core/src/configStore.js.md) — Unified reactive config store with prototype-level overrides
- [`packages/core/src/customerModeConfig.js`](./packages/core/src/customerModeConfig.js.md) — Customer mode config for hiding chrome and replacing homepage
- [`packages/core/src/devtools.js`](./packages/core/src/devtools.js.md) — Mounts the CoreUIBar React toolbar into the DOM
- [`packages/core/src/devtools.test.js`](./packages/core/src/devtools.test.js.md) — Tests for devtools mount/unmount lifecycle
- [`packages/core/src/devtools-consumer.js`](./packages/core/src/devtools-consumer.js.md) — Consumer-safe proxy that delegates to compiled UI bundle
- [`packages/core/src/dotPath.js`](./packages/core/src/dotPath.js.md) — Dot-notation path utilities for nested data access
- [`packages/core/src/dotPath.test.js`](./packages/core/src/dotPath.test.js.md) — Tests for dot-path read/write/clone operations
- [`packages/core/src/featureFlags.js`](./packages/core/src/featureFlags.js.md) — Feature flag system with localStorage persistence and built-in defaults
- [`packages/core/src/fuzzySearch.js`](./packages/core/src/fuzzySearch.js.md) — Tiered substring + fuzzy scoring engine for the command palette
- [`packages/core/src/fuzzySearch.test.js`](./packages/core/src/fuzzySearch.test.js.md) — Tests for fuzzy search scoring and ranking
- [`packages/core/src/hashSubscribe.js`](./packages/core/src/hashSubscribe.js.md) — URL hash change subscription compatible with `useSyncExternalStore`
- [`packages/core/src/hashSubscribe.test.js`](./packages/core/src/hashSubscribe.test.js.md) — Tests for hash subscription
- [`packages/core/src/hideMode.js`](./packages/core/src/hideMode.js.md) — Moves override state from URL hash to localStorage for clean URLs
- [`packages/core/src/hideMode.test.js`](./packages/core/src/hideMode.test.js.md) — Tests for hide mode transitions
- [`packages/core/src/interceptHideParams.js`](./packages/core/src/interceptHideParams.js.md) — Intercepts `?hide`/`?show` URL params to trigger hide mode
- [`packages/core/src/interceptHideParams.test.js`](./packages/core/src/interceptHideParams.test.js.md) — Tests for hide param interception
- [`packages/core/src/localStorage.js`](./packages/core/src/localStorage.js.md) — Namespaced localStorage API with cross-tab and intra-tab reactivity
- [`packages/core/src/localStorage.test.js`](./packages/core/src/localStorage.test.js.md) — Tests for localStorage operations and reactivity
- [`packages/core/src/mobileViewport.js`](./packages/core/src/mobileViewport.js.md) — Reactive mobile/compact viewport detection at 500px breakpoint
- [`packages/core/src/mobileViewport.test.js`](./packages/core/src/mobileViewport.test.js.md) — Tests for viewport detection
- [`packages/core/src/modes.js`](./packages/core/src/modes.js.md) — Design mode registry, switching engine, and cross-plugin event bus
- [`packages/core/src/modes.test.js`](./packages/core/src/modes.test.js.md) — Tests for mode switching, locked mode, and tool registry
- [`packages/core/src/mountStoryboardCore.js`](./packages/core/src/mountStoryboardCore.js.md) — Single entry point orchestrating all startup initialization
- [`packages/core/src/paletteProviders.js`](./packages/core/src/paletteProviders.js.md) — Adapters producing searchable item datasets for the command palette
- [`packages/core/src/paletteProviders.test.js`](./packages/core/src/paletteProviders.test.js.md) — Tests for palette provider data generation
- [`packages/core/src/plugins.js`](./packages/core/src/plugins.js.md) — Simple plugin enable/disable configuration
- [`packages/core/src/plugins.test.js`](./packages/core/src/plugins.test.js.md) — Tests for plugin configuration
- [`packages/core/src/prodMode.js`](./packages/core/src/prodMode.js.md) — Production mode simulation via `?prodMode` URL param
- [`packages/core/src/recentArtifacts.js`](./packages/core/src/recentArtifacts.js.md) — localStorage-backed recent artifacts tracker for command palette
- [`packages/core/src/recentArtifacts.test.js`](./packages/core/src/recentArtifacts.test.js.md) — Tests for recent artifacts tracking
- [`packages/core/src/scaffold.js`](./packages/core/src/scaffold.js.md) — CLI script syncing scaffold files to consumer repos
- [`packages/core/src/sceneDebug.js`](./packages/core/src/sceneDebug.js.md) — Vanilla JS debug panel rendering flow data as JSON
- [`packages/core/src/sceneDebug.test.js`](./packages/core/src/sceneDebug.test.js.md) — Tests for scene debug panel
- [`packages/core/src/session.js`](./packages/core/src/session.js.md) — URL hash-based session state for overrides (avoids router re-renders)
- [`packages/core/src/session.test.js`](./packages/core/src/session.test.js.md) — Tests for session state operations
- [`packages/core/src/smoothCorners.js`](./packages/core/src/smoothCorners.js.md) — CSS Houdini paint worklet for superellipse shapes
- [`packages/core/src/toolbarConfigStore.js`](./packages/core/src/toolbarConfigStore.js.md) — Reactive toolbar config store with layered overrides
- [`packages/core/src/toolRegistry.js`](./packages/core/src/toolRegistry.js.md) — Config-driven tool declaration and runtime module registration
- [`packages/core/src/toolStateStore.js`](./packages/core/src/toolStateStore.js.md) — Runtime state management for toolbar tool visibility/activity
- [`packages/core/src/toolStateStore.test.js`](./packages/core/src/toolStateStore.test.js.md) — Tests for tool state management
- [`packages/core/src/ui-entry.js`](./packages/core/src/ui-entry.js.md) — Compiled UI bundle entry point for consumer repos
- [`packages/core/src/uiConfig.js`](./packages/core/src/uiConfig.js.md) — Project-level config for hiding specific chrome elements
- [`packages/core/src/uiConfig.test.js`](./packages/core/src/uiConfig.test.js.md) — Tests for UI config
- [`packages/core/src/viewfinder.js`](./packages/core/src/viewfinder.js.md) — Builds structured prototype index for workspace dashboard and command palette
- [`packages/core/src/viewfinder.test.js`](./packages/core/src/viewfinder.test.js.md) — Tests for prototype index building

### `@dfosco/storyboard-react` — React Bindings

- [`packages/react/src/index.js`](./packages/react/src/index.js.md) — Public entry point re-exporting all hooks, providers, and UI components
- [`packages/react/src/context.jsx`](./packages/react/src/context.jsx.md) — StoryboardProvider — top-level context for flow data, routing, and HMR guard
- [`packages/react/src/StoryboardContext.js`](./packages/react/src/StoryboardContext.js.md) — React context object carrying flow data and state
- [`packages/react/src/hashPreserver.js`](./packages/react/src/hashPreserver.js.md) — Preserves URL hash overrides across client-side navigations
- [`packages/react/src/context/FormContext.js`](./packages/react/src/context/FormContext.js.md) — Form context for buffered draft state in StoryboardForm
- [`packages/react/src/hooks/useConfig.js`](./packages/react/src/hooks/useConfig.js.md) — Hook for reading unified config store with optional domain scoping
- [`packages/react/src/hooks/useFeatureFlag.js`](./packages/react/src/hooks/useFeatureFlag.js.md) — Hook for reading feature flag values from localStorage
- [`packages/react/src/hooks/useFlows.js`](./packages/react/src/hooks/useFlows.js.md) — Lists prototype-scoped flows and provides flow switching
- [`packages/react/src/hooks/useFlows.test.js`](./packages/react/src/hooks/useFlows.test.js.md) — Tests for flow listing and switching
- [`packages/react/src/hooks/useHideMode.js`](./packages/react/src/hooks/useHideMode.js.md) — Read and control hide mode (clean URLs via localStorage shadow)
- [`packages/react/src/hooks/useHideMode.test.js`](./packages/react/src/hooks/useHideMode.test.js.md) — Tests for hide mode hook
- [`packages/react/src/hooks/useLocalStorage.js`](./packages/react/src/hooks/useLocalStorage.js.md) — Persistent localStorage override on top of flow data
- [`packages/react/src/hooks/useLocalStorage.test.js`](./packages/react/src/hooks/useLocalStorage.test.js.md) — Tests for localStorage override hook
- [`packages/react/src/hooks/useMode.js`](./packages/react/src/hooks/useMode.js.md) — Hook for design mode state and switching
- [`packages/react/src/hooks/useObject.js`](./packages/react/src/hooks/useObject.js.md) — Loads object data directly by name with dot-notation and hash overrides
- [`packages/react/src/hooks/useObject.test.js`](./packages/react/src/hooks/useObject.test.js.md) — Tests for object loading and overrides
- [`packages/react/src/hooks/useOverride.js`](./packages/react/src/hooks/useOverride.js.md) — Primary hook for reading/writing overrides on flow/object data
- [`packages/react/src/hooks/useOverride.test.js`](./packages/react/src/hooks/useOverride.test.js.md) — Tests for override read/write/clear
- [`packages/react/src/hooks/usePrototypeReloadGuard.js`](./packages/react/src/hooks/usePrototypeReloadGuard.js.md) — Suppresses Vite HMR full-reloads via heartbeat when auto-reload is off
- [`packages/react/src/hooks/useRecord.js`](./packages/react/src/hooks/useRecord.js.md) — Loads record collections and entries matched by URL route params
- [`packages/react/src/hooks/useRecord.test.js`](./packages/react/src/hooks/useRecord.test.js.md) — Tests for record loading and URL param matching
- [`packages/react/src/hooks/useScene.js`](./packages/react/src/hooks/useScene.js.md) — Read current flow name and switch flows (deprecated alias for useFlow)
- [`packages/react/src/hooks/useScene.test.js`](./packages/react/src/hooks/useScene.test.js.md) — Tests for flow/scene hook
- [`packages/react/src/hooks/useSceneData.js`](./packages/react/src/hooks/useSceneData.js.md) — Primary hook for accessing flow data by dot-notation path with overrides
- [`packages/react/src/hooks/useSceneData.test.js`](./packages/react/src/hooks/useSceneData.test.js.md) — Tests for flow data access and overrides
- [`packages/react/src/hooks/useSession.js`](./packages/react/src/hooks/useSession.js.md) — Deprecated re-export of useOverride
- [`packages/react/src/hooks/useSession.test.js`](./packages/react/src/hooks/useSession.test.js.md) — Tests confirming useSession aliases useOverride
- [`packages/react/src/hooks/useThemeState.js`](./packages/react/src/hooks/useThemeState.js.md) — Hooks for global theme state and sync target configuration
- [`packages/react/src/hooks/useThemeState.test.js`](./packages/react/src/hooks/useThemeState.test.js.md) — Tests for theme state hooks
- [`packages/react/src/hooks/useUndoRedo.js`](./packages/react/src/hooks/useUndoRedo.js.md) — Undo/redo controls for override history stack
- [`packages/react/src/hooks/useUndoRedo.test.js`](./packages/react/src/hooks/useUndoRedo.test.js.md) — Tests for undo/redo navigation
- [`packages/react/src/vite/data-plugin.js`](./packages/react/src/vite/data-plugin.js.md) — Vite plugin discovering data files and generating the virtual data index

### `@dfosco/storyboard-react-primer` — Primer Design System Components

- [`packages/react-primer/src/index.js`](./packages/react-primer/src/index.js.md) — Barrel re-exporting all Primer-flavored storyboard components
- [`packages/react-primer/src/Checkbox.jsx`](./packages/react-primer/src/Checkbox.jsx.md) — Primer Checkbox with StoryboardForm integration
- [`packages/react-primer/src/Select.jsx`](./packages/react-primer/src/Select.jsx.md) — Primer Select with StoryboardForm integration
- [`packages/react-primer/src/StoryboardForm.jsx`](./packages/react-primer/src/StoryboardForm.jsx.md) — Form wrapper buffering inputs and flushing to URL hash on submit
- [`packages/react-primer/src/Textarea.jsx`](./packages/react-primer/src/Textarea.jsx.md) — Primer Textarea with StoryboardForm integration
- [`packages/react-primer/src/TextInput.jsx`](./packages/react-primer/src/TextInput.jsx.md) — Primer TextInput with StoryboardForm integration
- [`packages/react-primer/src/ThemeSync.jsx`](./packages/react-primer/src/ThemeSync.jsx.md) — Bridges storyboard-core theme store with Primer ThemeProvider
- [`packages/react-primer/src/SceneDataDemo.jsx`](./packages/react-primer/src/SceneDataDemo.jsx.md) — Demo component showcasing override and form workflows
- [`packages/react-primer/src/SceneDebug.jsx`](./packages/react-primer/src/SceneDebug.jsx.md) — Debug component displaying flow data as formatted JSON
- [`packages/react-primer/src/DevTools/DevTools.jsx`](./packages/react-primer/src/DevTools/DevTools.jsx.md) — Floating dev toolbar with data inspect, flag toggles, and quick actions

### `@dfosco/storyboard-react-reshaped` — Reshaped Design System Components

- [`packages/react-reshaped/src/index.js`](./packages/react-reshaped/src/index.js.md) — Barrel re-exporting Reshaped-flavored storyboard form components

### `@dfosco/tiny-canvas` — Drag-and-Drop Canvas Library

- [`packages/tiny-canvas/src/index.js`](./packages/tiny-canvas/src/index.js.md) — Public entry point for the tiny-canvas package
- [`packages/tiny-canvas/src/Canvas.jsx`](./packages/tiny-canvas/src/Canvas.jsx.md) — Canvas container wrapping children in Draggable components
- [`packages/tiny-canvas/src/Draggable.jsx`](./packages/tiny-canvas/src/Draggable.jsx.md) — Drag wrapper with persistent positions, boundary clamping, and CSS transforms
- [`packages/tiny-canvas/src/useResetCanvas.js`](./packages/tiny-canvas/src/useResetCanvas.js.md) — Hook to clear all saved canvas positions from localStorage
- [`packages/tiny-canvas/src/utils.js`](./packages/tiny-canvas/src/utils.js.md) — Drag ID generation and localStorage position persistence utilities

### `@dfosco/storyboard` — CLI & Runtime

The `packages/storyboard` package ships the `storyboard` / `sb` CLI binary and the canvas/messaging runtime. The CLI follows a strict **1:1 CLI↔server endpoint convention**: every server API endpoint has a corresponding CLI command with flag-to-field parity. Agents use CLI commands exclusively — never raw `curl`. The entry point ([`index.js`](./packages/storyboard/src/core/cli/index.js.md)) dispatches to per-command modules via lazy dynamic imports, keeping startup fast. Shared infrastructure lives in [`cliHelpers.js`](./packages/storyboard/src/core/cli/cliHelpers.js.md) (HTTP wrappers), [`flags.js`](./packages/storyboard/src/core/cli/flags.js.md) (arg parsing), [`serverUrl.js`](./packages/storyboard/src/core/cli/serverUrl.js.md) (URL resolution), [`intro.js`](./packages/storyboard/src/core/cli/intro.js.md) (ANSI helpers), and [`schemas.js`](./packages/storyboard/src/core/cli/schemas.js.md) (flag schemas).

The proxy subsystem is in transition: [`proxy.js`](./packages/storyboard/src/core/cli/proxy.js.md) is the active implementation routing through the Runtime daemon (sole writer to Caddy), while [`proxy.legacy.js`](./packages/storyboard/src/core/cli/proxy.legacy.js.md) retains the older direct-Caddyfile path for reference. Similarly, [`dev.js`](./packages/storyboard/src/core/cli/dev.js.md) is the active thin-client dev command, with [`dev.legacy.js`](./packages/storyboard/src/core/cli/dev.legacy.js.md) as reference.

- [`packages/storyboard/src/core/cli/index.js`](./packages/storyboard/src/core/cli/index.js.md) — CLI entry point: dispatches all commands via lazy dynamic imports
- [`packages/storyboard/src/core/cli/cliHelpers.js`](./packages/storyboard/src/core/cli/cliHelpers.js.md) — Shared HTTP helpers (get/post/patch/del) + parseSimpleArgs/die/jsonOut
- [`packages/storyboard/src/core/cli/flags.js`](./packages/storyboard/src/core/cli/flags.js.md) — Schema-validated CLI flag parser with aliases, types, and negation
- [`packages/storyboard/src/core/cli/flags.test.js`](./packages/storyboard/src/core/cli/flags.test.js.md) — Tests for flag parser
- [`packages/storyboard/src/core/cli/serverUrl.js`](./packages/storyboard/src/core/cli/serverUrl.js.md) — Resolves dev server URL via env → Caddy admin API → ports.json
- [`packages/storyboard/src/core/cli/schemas.js`](./packages/storyboard/src/core/cli/schemas.js.md) — FlagSchema definitions for all create subcommands and canvas widget add
- [`packages/storyboard/src/core/cli/intro.js`](./packages/storyboard/src/core/cli/intro.js.md) — ANSI color helpers and getting-started copy shared across CLI modules
- [`packages/storyboard/src/core/cli/dev.js`](./packages/storyboard/src/core/cli/dev.js.md) — `storyboard dev`: thin client to the Runtime daemon for dev server acquisition
- [`packages/storyboard/src/core/cli/dev.legacy.js`](./packages/storyboard/src/core/cli/dev.legacy.js.md) — Legacy per-repo dev server (reference only, superseded by dev.js)
- [`packages/storyboard/src/core/cli/dev-helpers.js`](./packages/storyboard/src/core/cli/dev-helpers.js.md) — Pure git utilities: hasUncommittedChanges, localBranchExists, resolveDefaultBranch
- [`packages/storyboard/src/core/cli/dev-helpers.test.js`](./packages/storyboard/src/core/cli/dev-helpers.test.js.md) — Integration tests for git helpers against the real repo
- [`packages/storyboard/src/core/cli/proxy.js`](./packages/storyboard/src/core/cli/proxy.js.md) — Caddy proxy management via Runtime daemon; exports isCaddyRunning/startCaddy/stopCaddy
- [`packages/storyboard/src/core/cli/proxy.legacy.js`](./packages/storyboard/src/core/cli/proxy.legacy.js.md) — Legacy direct-Caddyfile proxy management (reference only)
- [`packages/storyboard/src/core/cli/proxy.test.js`](./packages/storyboard/src/core/cli/proxy.test.js.md) — Tests for findStaleRouteIndices
- [`packages/storyboard/src/core/cli/run.js`](./packages/storyboard/src/core/cli/run.js.md) — `storyboard run`: start proxy + dev server in one command
- [`packages/storyboard/src/core/cli/setup.js`](./packages/storyboard/src/core/cli/setup.js.md) — `storyboard setup`: one-time environment setup (deps, Caddy, gh, proxy)
- [`packages/storyboard/src/core/cli/exit.js`](./packages/storyboard/src/core/cli/exit.js.md) — `storyboard exit`: stop all dev servers and proxy
- [`packages/storyboard/src/core/cli/branch.js`](./packages/storyboard/src/core/cli/branch.js.md) — `storyboard branch`: interactive git worktree switcher with stash/apply
- [`packages/storyboard/src/core/cli/pull.js`](./packages/storyboard/src/core/cli/pull.js.md) — `storyboard pull`: stash-safe pull --rebase from remote
- [`packages/storyboard/src/core/cli/publish.js`](./packages/storyboard/src/core/cli/publish.js.md) — `storyboard publish`: stash-safe push after pull --rebase
- [`packages/storyboard/src/core/cli/code.js`](./packages/storyboard/src/core/cli/code.js.md) — `storyboard code`: open a worktree in VS Code
- [`packages/storyboard/src/core/cli/server.js`](./packages/storyboard/src/core/cli/server.js.md) — `storyboard server`: dev server lifecycle (list/start/stop)
- [`packages/storyboard/src/core/cli/create.js`](./packages/storyboard/src/core/cli/create.js.md) — `storyboard create`: interactive/non-interactive wizard for prototypes, canvases, flows, pages
- [`packages/storyboard/src/core/cli/artifact.js`](./packages/storyboard/src/core/cli/artifact.js.md) — `storyboard artifact`: CRUD for all artifact types via REST endpoints
- [`packages/storyboard/src/core/cli/compact.js`](./packages/storyboard/src/core/cli/compact.js.md) — `storyboard compact`: compacts canvas JSONL files to prevent HMR bloat
- [`packages/storyboard/src/core/cli/canvasAdd.js`](./packages/storyboard/src/core/cli/canvasAdd.js.md) — `storyboard canvas add`: adds a widget with auto-positioning priority chain
- [`packages/storyboard/src/core/cli/canvasUpdate.js`](./packages/storyboard/src/core/cli/canvasUpdate.js.md) — `storyboard canvas update`: patches widget props or position
- [`packages/storyboard/src/core/cli/canvasRead.js`](./packages/storyboard/src/core/cli/canvasRead.js.md) — `storyboard canvas read`: lists widgets with IDs, types, content, and bounds
- [`packages/storyboard/src/core/cli/canvasBounds.js`](./packages/storyboard/src/core/cli/canvasBounds.js.md) — `storyboard canvas bounds`: spatial bounds for widgets (size + position)
- [`packages/storyboard/src/core/cli/canvasBatch.js`](./packages/storyboard/src/core/cli/canvasBatch.js.md) — `storyboard canvas batch`: atomic multi-operation canvas mutations with `$ref` support
- [`packages/storyboard/src/core/cli/canvasDelete.js`](./packages/storyboard/src/core/cli/canvasDelete.js.md) — `storyboard canvas delete`: removes a widget from a canvas
- [`packages/storyboard/src/core/cli/canvasDeleteCanvas.js`](./packages/storyboard/src/core/cli/canvasDeleteCanvas.js.md) — `storyboard canvas delete-canvas`: deletes a canvas and its directory
- [`packages/storyboard/src/core/cli/canvasDuplicate.js`](./packages/storyboard/src/core/cli/canvasDuplicate.js.md) — `storyboard canvas duplicate`: copies a canvas with a new title
- [`packages/storyboard/src/core/cli/canvasConnector.js`](./packages/storyboard/src/core/cli/canvasConnector.js.md) — `storyboard canvas connector`: create/update/delete connectors and waypoints
- [`packages/storyboard/src/core/cli/canvasBroadcast.js`](./packages/storyboard/src/core/cli/canvasBroadcast.js.md) — `storyboard canvas broadcast`: toggle broadcast messaging mode for a widget
- [`packages/storyboard/src/core/cli/canvasAlias.js`](./packages/storyboard/src/core/cli/canvasAlias.js.md) — `storyboard canvas alias`: get/set/clear human-readable widget aliases
- [`packages/storyboard/src/core/cli/canvasRoles.js`](./packages/storyboard/src/core/cli/canvasRoles.js.md) — `storyboard canvas roles`: list available hub roles
- [`packages/storyboard/src/core/cli/agent.js`](./packages/storyboard/src/core/cli/agent.js.md) — `storyboard agent`: signal status, spawn, poll status, peek, and list agents
- [`packages/storyboard/src/core/cli/hubCommands.js`](./packages/storyboard/src/core/cli/hubCommands.js.md) — `storyboard hub`: full hub lifecycle (state, goal, send, token, conversation, presence)
- [`packages/storyboard/src/core/cli/messagesCommands.js`](./packages/storyboard/src/core/cli/messagesCommands.js.md) — `storyboard messages`: low-level pub/sub bus (publish, send, read, batch)
- [`packages/storyboard/src/core/cli/promptSpawn.js`](./packages/storyboard/src/core/cli/promptSpawn.js.md) — `storyboard prompt spawn`: acquire a pre-warmed prompt agent from the hot pool
- [`packages/storyboard/src/core/cli/sessions.js`](./packages/storyboard/src/core/cli/sessions.js.md) — `storyboard terminal` (no subcommand): interactive tmux session browser
- [`packages/storyboard/src/core/cli/terminal-commands.js`](./packages/storyboard/src/core/cli/terminal-commands.js.md) — `storyboard terminal close/open/remove`: session lifecycle by name or widget ID
- [`packages/storyboard/src/core/cli/terminal-messaging.js`](./packages/storyboard/src/core/cli/terminal-messaging.js.md) — `storyboard terminal send/output/status/read/kill`: inter-session messaging
- [`packages/storyboard/src/core/cli/terminal-welcome.js`](./packages/storyboard/src/core/cli/terminal-welcome.js.md) — Interactive welcome supervisor for tmux terminal widget sessions
- [`packages/storyboard/src/core/cli/updateVersion.js`](./packages/storyboard/src/core/cli/updateVersion.js.md) — `storyboard update[:<tag>]`: updates all @dfosco/storyboard-* packages

## Entry Points

The host application entry point bootstraps React, routing, theming, and the storyboard core systems. It uses file-based routing via `@generouted/react-router` where pages inside `src/pages/` automatically become routes. The entry point also initializes the storyboard toolbar, workspace dashboard, and hash preserver that maintains URL override state across navigations.

- [`src/index.jsx`](./src/index.jsx.md) — Application root — React setup, routing, Primer theming, and storyboard core initialization

## Configuration

Configuration spans the root workspace manifest and per-package `package.json` files. The root defines shared dependencies, workspace structure, and build/test scripts. Each package declares its own version, exports map, and peer dependencies. The Vite config wires together React, Tailwind CSS, generouted file-based routing, and the storyboard data plugin. All packages are currently at version `4.2.0-beta.17`.

- [`package.json`](./package.json.md) — Root workspace manifest with shared deps, scripts, and workspace config
- [`packages/core/package.json`](./packages/core/package.json.md) — Core package manifest with CLI bin, exports map, and dependencies
- [`packages/react/package.json`](./packages/react/package.json.md) — React bindings package with core/tiny-canvas internal deps
- [`packages/react-primer/package.json`](./packages/react-primer/package.json.md) — Primer design system component package
- [`packages/react-reshaped/package.json`](./packages/react-reshaped/package.json.md) — Reshaped design system component package
- [`packages/tiny-canvas/package.json`](./packages/tiny-canvas/package.json.md) — Lightweight drag-and-drop canvas package
- [`vite.config.js`](./vite.config.js.md) — Vite build config with React, Tailwind, generouted, and storyboard plugins

