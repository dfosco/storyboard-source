# `packages/storyboard/src/core/stores/toolbarConfigStore.js`

<!--

source: packages/storyboard/src/core/stores/toolbarConfigStore.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`toolbarConfigStore.js` maintains the merged toolbar configuration that drives CoreUIBar and tool registration. It layers startup-time client overrides onto the base toolbar config, then applies prototype-scoped overrides reactively as navigation changes.

## Composition

```js
/** @type {object} Merged core + custom config (set once at startup) */
let _baseConfig = {}

/** @type {object|null} Active prototype toolbar overrides */
let _prototypeConfig = null

/** @type {object} Final merged config (base + prototype) */
let _mergedConfig = {}

/** @type {Set<Function>} */
const _listeners = new Set()

/** @type {object|null} Client-repo toolbar overrides (set by virtual module before mount) */
let _clientOverrides = null

let _snapshotVersion = 0

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Set the base toolbar config (core defaults merged with client overrides).
 * Called once at app startup by mountStoryboardCore.
 *
 * @param {object} config - Already-merged core + custom toolbar config
 */
export function initToolbarConfig(config) {
  _baseConfig = config
  _prototypeConfig = null
  _recompute()
}
```

Prototype overrides are optional and deep-merged over the base config. Subscribers receive the merged config immediately, and `getToolbarConfigSnapshot()` exposes an external-store version token.

```js
/**
 * Set toolbar overrides for the active prototype.
 * Called on route change when entering a prototype that has a toolbar.config.json.
 *
 * @param {object|null} config - Prototype-level overrides, or null to clear
 */
export function setPrototypeToolbarConfig(config) {
  _prototypeConfig = config || null
  _recompute()
}

/**
 * Clear prototype overrides (e.g. when navigating to viewfinder or a
 * prototype without its own toolbar.config.json).
 */
export function clearPrototypeToolbarConfig() {
  if (_prototypeConfig === null) return
  _prototypeConfig = null
  _recompute()
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/**
 * Get the current merged toolbar config.
 *
 * @returns {object}
 */
export function getToolbarConfig() {
  return _mergedConfig
}

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

/**
 * Subscribe to toolbar config changes. Compatible with external stores.
 *
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function subscribeToToolbarConfig(callback) {
  _listeners.add(callback)
  callback(_mergedConfig)
  return () => _listeners.delete(callback)
}

/**
 * Snapshot for useSyncExternalStore.
 *
 * @returns {string}
 */
export function getToolbarConfigSnapshot() {
  return String(_snapshotVersion)
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function _recompute() {
  _mergedConfig = _prototypeConfig
    ? deepMerge(_baseConfig, _prototypeConfig)
    : _baseConfig
  _snapshotVersion++
  for (const cb of _listeners) {
    try { cb(_mergedConfig) } catch (err) {
      console.error('[storyboard] Error in toolbar config subscriber:', err)
    }
  }
```

Client overrides are staged separately so the generated Vite virtual module can publish them before `mountStoryboardCore` consumes them.

```js
// ---------------------------------------------------------------------------
// Client overrides (set by Vite data plugin before mountStoryboardCore runs)
// ---------------------------------------------------------------------------

/**
 * Store client-repo toolbar overrides from a root toolbar.config.json.
 * Called from the generated virtual module at import time.
 *
 * @param {object} config - Client toolbar config (tools, surfaces, etc.)
 */
export function setClientToolbarOverrides(config) {
  _clientOverrides = config
}

/**
 * Consume and clear pending client overrides.
 * Called once by mountStoryboardCore during toolbar config init.
 *
 * @returns {object|null}
 */
export function consumeClientToolbarOverrides() {
  const overrides = _clientOverrides
  _clientOverrides = null
  return overrides
}
```

Sample subscription pattern:

```js
const unsubscribe = subscribeToToolbarConfig((config) => {
  console.log(config.tools)
})

// later
unsubscribe()
```

## Dependencies

- [`packages/storyboard/src/core/data/loader.js`](../data/loader.js.md) — imported via `../data/loader.js`.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/inspector/highlighter.js`](../inspector/highlighter.js.md)

- [`packages/storyboard/src/core/stores/configStore.js`](configStore.js.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

## Notes

- `consumeClientToolbarOverrides()` is intentionally destructive; it hands one startup payload to the mount path and then clears it.
