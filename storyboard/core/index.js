/**
 * storyboard-core — framework-agnostic data layer.
 *
 * This barrel exports all core utilities that have zero framework dependencies.
 * Any frontend (React, Vue, Svelte, Alpine, vanilla JS) can use these directly.
 */

// Data index initialization
export { init } from './loader.js'

// Scene & record loading
export { loadScene, sceneExists, loadRecord, findRecord, deepMerge } from './loader.js'

// Dot-notation path utilities
export { getByPath, setByPath, deepClone } from './dotPath.js'

// URL hash session state (read/write)
export { getParam, setParam, getAllParams, removeParam } from './session.js'

// Hash change subscription (for reactive frameworks)
export { subscribeToHash, getHashSnapshot } from './hashSubscribe.js'
