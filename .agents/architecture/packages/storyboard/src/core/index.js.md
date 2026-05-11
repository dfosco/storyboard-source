# `packages/storyboard/src/core/index.js`
<!--
source: packages/storyboard/src/core/index.js
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This is the barrel module for `@dfosco/storyboard-core` — the framework-agnostic data and runtime layer. It re-exports every public API from the core subsystems so consumers (both the React `internals/` layer and external consumers) have a single stable import path: `import { loadFlow, getParam, setTheme } from '../../core/index.js'` or `import { ... } from '@dfosco/storyboard/core'`.

The file documents the full surface area of the core layer at a glance and enforces the architectural boundary: anything exported here is pure JavaScript with zero framework dependencies. The React layer (`internals/`) imports from this file; core never imports from internals.

## Composition

Major export groups:

```js
// Data index initialization + loading
export { init } from './data/loader.js'
export { loadFlow, flowExists, loadRecord, findRecord, loadObject, deepMerge, resolveFlowName, ... } from './data/loader.js'
export { listPrototypes, getPrototypeMetadata, listFolders, listCanvases, listStories, getStoryData } from './data/loader.js'

// Dot-notation path utilities
export { getByPath, setByPath, deepClone } from './data/dotPath.js'

// URL hash session state
export { getParam, setParam, getAllParams, removeParam } from './session/session.js'

// localStorage persistence
export { getLocal, setLocal, removeLocal, subscribeToStorage, ... } from './session/localStorage.js'

// Hide mode (clean URLs — hides #hash params from URL bar)
export { isHideMode, activateHideMode, deactivateHideMode, undo, redo, ... } from './session/hideMode.js'
export { interceptHideParams, installHideParamListener } from './session/interceptHideParams.js'

// Hash subscription (framework-agnostic reactivity)
export { subscribeToHash, getHashSnapshot } from './session/hashSubscribe.js'

// Body class sync (overrides + flow → <body> CSS classes)
export { installBodyClassSync, setFlowClass, syncOverrideClasses } from './session/bodyClasses.js'

// Design modes (mode registry, switching, event bus)
export { registerMode, getCurrentMode, activateMode, subscribeToMode, on, off, emit, isModesEnabled } from './modes/modes.js'

// Tool registry (toolbar tool system)
export { initTools, setToolAction, setToolState, getToolsForMode } from './modes/modes.js'
export { initToolRegistry, registerToolModule, getToolConfig, subscribeToToolRegistry } from './stores/toolRegistry.js'

// Toolbar config store (layered overrides)
export { initToolbarConfig, getToolbarConfig, subscribeToToolbarConfig } from './stores/toolbarConfigStore.js'

// Toolbar tool state management
export { TOOL_STATES, initToolbarToolStates, setToolbarToolState, getToolbarToolState } from './stores/toolStateStore.js'

// Comments system
export { initCommentsConfig, isCommentsEnabled } from './comments/config.js'

// Config stores (unified, canvas, command palette, feature flags, plugins, UI, theme)
export { initConfig, getConfig, subscribeToConfig } from './stores/configStore.js'
export { initFeatureFlags, getFlag, setFlag } from './stores/featureFlags.js'
export { setTheme, getTheme, themeState, THEMES, getThemeSyncTargets, setThemeSyncTarget } from './stores/themeStore.js'

// Viewfinder utilities (workspace homescreen data)
export { hash, resolveFlowRoute, getFlowMeta, buildPrototypeIndex, appendTokens } from './data/viewfinder.js'

// Command actions (command palette config-driven entries)
export { initCommandActions, registerCommandAction, executeAction, subscribeToCommandActions } from './stores/commandActions.js'

// Fuzzy search
export { scoreMatch } from './utils/fuzzySearch.js'

// Shared UI components (framework-agnostic)
export { default as Icon } from './ui/Icon.jsx'
export { default as BranchSelect } from './ui/BranchSelect.jsx'

// Single entry point for consumer apps
export { mountStoryboardCore } from './mountStoryboardCore.js'
```

## Dependencies

All of the below are in `packages/storyboard/src/core/`:
- [`./data/loader.js`](./data/loader.js.md) — data loading
- [`./data/dotPath.js`](./data/dotPath.js.md) — path utilities
- [`./data/viewfinder.js`](./data/viewfinder.js.md) — viewfinder utilities
- `./session/session.js`, `./session/localStorage.js`, `./session/hideMode.js`, `./session/interceptHideParams.js`, `./session/hashSubscribe.js`, `./session/bodyClasses.js` — URL/storage state
- `./modes/modes.js` — design modes
- `./stores/*` — all config/feature stores
- `./utils/fuzzySearch.js` — search scoring
- `./ui/Icon.jsx`, `./ui/BranchSelect.jsx` — shared UI
- `./mountStoryboardCore.js` — mount entry point

## Dependents

- [`packages/storyboard/src/internals/context.jsx`](../internals/context.jsx.md) — imports flow loading, body class sync, etc.
- [`packages/storyboard/src/internals/Viewfinder.jsx`](../internals/Viewfinder.jsx.md) — imports `buildPrototypeIndex`, `listStories`
- [`packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`](../internals/CommandPalette/CommandPalette.jsx.md) — imports command actions, config, fuzzy search
- [`packages/storyboard/src/internals/hashPreserver.js`](../internals/hashPreserver.js.md) — imports `interceptHideParams`
- `packages/storyboard/src/index.js` — re-exports core API to npm consumers
- All hooks in `packages/storyboard/src/internals/hooks/` — import session/hash state utilities

## Notes

- The `Icon` and `BranchSelect` exports are intentionally included in core despite being JSX — they're used in both the React layer and the standalone Svelte CoreUIBar bridge, so they live here rather than in `internals/`.
- Deprecated aliases (`loadScene`, `listScenes`, `sceneExists`, `resolveSceneRoute`, `getSceneMeta`, `mountSceneDebug`, `setSceneClass`) are preserved here for backwards compat with consumer apps.
- The `devtools-consumer.js` and `sceneDebug.js` exports mount the dev toolbar and flow debugger UI — these are the entry points for the CoreUIBar.
