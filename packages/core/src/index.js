/**
 * storyboard-core — framework-agnostic data layer.
 *
 * This barrel exports all core utilities that have zero framework dependencies.
 * Any frontend (React, Vue, Svelte, Alpine, vanilla JS) can use these directly.
 */

// Data index initialization
export { init } from './loader.js'

// Scene & record loading
export { loadScene, listScenes, sceneExists, loadRecord, findRecord, deepMerge } from './loader.js'

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

// Viewfinder utilities
export { hash, resolveSceneRoute, getSceneMeta } from './viewfinder.js'

// Comments system
export { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './comments/config.js'
