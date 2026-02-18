# `packages/core/src/index.js`

<!--
source: packages/core/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Barrel module for `@dfosco/storyboard-core` — the framework-agnostic data layer of the storyboard system. Every public API surface of the core package is re-exported from this single entry point so that consumers (React hooks, Vite plugin, page components) import from `@dfosco/storyboard-core` without needing to know the internal file layout.

The package has zero npm dependencies and can be consumed by any frontend framework (React, Vue, Svelte, vanilla JS).

## Composition

The file is a pure re-export barrel with no logic of its own. It groups exports by concern:

```js
// Data index initialization
export { init } from './loader.js'

// Scene & record loading
export { loadScene, sceneExists, loadRecord, findRecord, deepMerge } from './loader.js'

// Dot-notation path utilities
export { getByPath, setByPath, deepClone } from './dotPath.js'

// URL hash session state (read/write)
export { getParam, setParam, getAllParams, removeParam } from './session.js'

// localStorage persistence
export { getLocal, setLocal, removeLocal, getAllLocal, subscribeToStorage, getStorageSnapshot } from './localStorage.js'

// Hide mode (clean URLs)
export { isHideMode, activateHideMode, deactivateHideMode, getShadow, setShadow, removeShadow, getAllShadows, pushSnapshot, getOverrideHistory, getCurrentSnapshot, getCurrentRoute, getCurrentIndex, getNextIndex, canUndo, canRedo, undo, redo, syncHashToHistory, installHistorySync } from './hideMode.js'
export { interceptHideParams, installHideParamListener } from './interceptHideParams.js'

// Hash change subscription (for reactive frameworks)
export { subscribeToHash, getHashSnapshot } from './hashSubscribe.js'

// Dev tools (vanilla JS, framework-agnostic)
export { mountDevTools } from './devtools.js'
export { mountSceneDebug } from './sceneDebug.js'
```

## Dependencies

Internal modules (all under [`packages/core/src/`](./)):

| Module | Exports |
|--------|---------|
| [`loader.js`](./loader.js.md) | `init`, `loadScene`, `sceneExists`, `loadRecord`, `findRecord`, `deepMerge` |
| [`dotPath.js`](./dotPath.js.md) | `getByPath`, `setByPath`, `deepClone` |
| [`session.js`](./session.js.md) | `getParam`, `setParam`, `getAllParams`, `removeParam` |
| [`hashSubscribe.js`](./hashSubscribe.js.md) | `subscribeToHash`, `getHashSnapshot` |
| `localStorage.js` | `getLocal`, `setLocal`, `removeLocal`, `getAllLocal`, `subscribeToStorage`, `getStorageSnapshot` |
| `hideMode.js` | Hide-mode utilities (undo/redo, shadow params, history sync) |
| `interceptHideParams.js` | `interceptHideParams`, `installHideParamListener` |
| `devtools.js` | `mountDevTools` |
| `sceneDebug.js` | `mountSceneDebug` |

## Dependents

Almost every consumer in the monorepo imports from `@dfosco/storyboard-core`, which resolves to this barrel:

- [`packages/react/src/context.jsx`](../../react/src/context.jsx.md) — `loadScene`, `sceneExists`, `findRecord`, `deepMerge`
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — `getByPath`, `deepClone`, `setByPath`, `getParam`, `getAllParams`, `subscribeToHash`, `getHashSnapshot`, hide-mode and storage helpers
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — `getByPath`, `getParam`, `setParam`, `removeParam`, `subscribeToHash`, hide-mode and storage helpers
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — `loadRecord`, `deepClone`, `setByPath`, `getAllParams`, `subscribeToHash`, `getHashSnapshot`
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — `getByPath`, `getParam`, localStorage and storage helpers, `subscribeToHash`, `getHashSnapshot`
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — `undo`, `redo`, `canUndo`, `canRedo`, storage and hash helpers
- [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) — `isHideMode`, `activateHideMode`, `deactivateHideMode`, storage helpers
- [`packages/react/src/hashPreserver.js`](../../react/src/hashPreserver.js.md) — `interceptHideParams`
- [`packages/react/src/vite/data-plugin.js`](../../react/src/vite/data-plugin.js.md) — generates `import { init } from '@dfosco/storyboard-core'`
- [`packages/react-primer/src/StoryboardForm.jsx`](../../react-primer/src/StoryboardForm.jsx.md) — `setParam`
- [`packages/react-primer/src/SceneDebug.jsx`](../../react-primer/src/SceneDebug.jsx.md) — `loadScene`
- [`packages/react-primer/src/DevTools/DevTools.jsx`](../../react-primer/src/DevTools/DevTools.jsx.md) — `loadScene`
- [`packages/react-reshaped/src/StoryboardForm.jsx`](../../react-reshaped/src/StoryboardForm.jsx.md) — `setParam`
- [`src/index.jsx`](../../../src/index.jsx.md) — `installHideParamListener`, `installHistorySync`, `mountDevTools`
- [`src/pages/issues/index.jsx`](../../../src/pages/issues/index.jsx.md) — `setParam`, `removeParam`
- [`src/pages/issues/[id].jsx`](../../../src/pages/issues/[id].jsx.md) — `setParam`, `removeParam`

## Notes

The `package.json` for `@dfosco/storyboard-core` maps `"."` → `"./src/index.js"`, so all external imports resolve here. No build step is needed — the source is consumed directly by Vite.
