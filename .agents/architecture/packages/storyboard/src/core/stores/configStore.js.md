# `packages/storyboard/src/core/stores/configStore.js`

<!--

source: packages/storyboard/src/core/stores/configStore.js

category: storyboard

importance: high

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`configStore.js` centralizes Storyboard runtime configuration so the rest of the core can read one merged object instead of juggling per-domain init flows. It is the reactive bridge between the fully-defaulted config produced by [`packages/storyboard/src/core/stores/configSchema.js`](configSchema.js.md) and late prototype-local overrides applied as the user navigates through the app.

At startup, the base config has already absorbed the precedence described in AGENTS: config-schema defaults → core config files → user config files → `storyboard.config.json`. This store then adds one more runtime layer on top: per-prototype overrides, applied domain-by-domain with `deepMerge`, so consumers like [`packages/storyboard/src/core/stores/toolbarConfigStore.js`](toolbarConfigStore.js.md), [`packages/storyboard/src/core/stores/commandPaletteConfig.js`](commandPaletteConfig.js.md), and [`packages/storyboard/src/core/stores/canvasConfig.js`](canvasConfig.js.md) can stay synchronized without knowing where each override came from.

## Composition

The store keeps three pieces of mutable state: `_baseConfig`, `_prototypeOverrides`, and `_mergedConfig`. `initConfig()` seeds `_baseConfig`, clears any prototype state, and immediately recomputes the merged view.

```js
/** @type {object} Full merged config (set once at startup) */
let _baseConfig = {}

/** @type {Record<string, object>} Domain → prototype-level overrides */
let _prototypeOverrides = {}

/** @type {object} Final merged config (base + prototype overrides) */
let _mergedConfig = {}

/** @type {Set<Function>} */
const _listeners = new Set()

let _snapshotVersion = 0

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Seed the unified config with the pre-merged config object.
 * Called once at app startup (from the virtual module or mountStoryboardCore).
 *
 * @param {object} config - The unified config with all domains
 */
export function initConfig(config) {
  _baseConfig = config || {}
  _prototypeOverrides = {}
  _recompute()
}
```

`getConfig()` is the read API. With no argument it returns the whole merged tree; with a domain like `toolbar` or `canvas` it returns just that slice. `setOverrides()` and `clearOverrides()` mutate one domain at a time, while `clearAllOverrides()` resets the prototype layer when leaving a scoped route.

```js
/**
 * Get the full merged config or a specific domain slice.
 *
 * @param {string} [domain] - Optional domain key (e.g. 'toolbar', 'canvas')
 * @returns {object}
 */
export function getConfig(domain) {
  if (!domain) return _mergedConfig
  return _mergedConfig[domain] || {}
}

// ---------------------------------------------------------------------------
// Prototype overrides
// ---------------------------------------------------------------------------

/**
 * Set overrides for a specific domain from a prototype-local config file.
 * Called on route change when entering a prototype with local config.
 *
 * @param {string} domain - Config domain (e.g. 'toolbar', 'widgets')
 * @param {object} overrides - Prototype-level overrides to deep-merge
 */
export function setOverrides(domain, overrides) {
  if (!overrides) return
  _prototypeOverrides[domain] = overrides
  _recompute()
}

/**
 * Clear overrides for a specific domain.
 *
 * @param {string} domain
 */
export function clearOverrides(domain) {
  if (!_prototypeOverrides[domain]) return
  delete _prototypeOverrides[domain]
  _recompute()
}

/**
 * Clear all prototype overrides (e.g. when leaving a prototype).
 */
export function clearAllOverrides() {
  if (Object.keys(_prototypeOverrides).length === 0) return
  _prototypeOverrides = {}
  _recompute()
```

Reactivity is external-store friendly. Subscribers receive the full merged config immediately, while `getConfigSnapshot()` exposes a version string for `useSyncExternalStore` consumers.

```js
/**
 * Subscribe to config changes. Compatible with external stores.
 *
 * @param {Function} callback - Called with the full merged config
 * @returns {Function} Unsubscribe
 */
export function subscribeToConfig(callback) {
  _listeners.add(callback)
  callback(_mergedConfig)
  return () => _listeners.delete(callback)
}

/**
 * Snapshot version for useSyncExternalStore.
 *
 * @returns {string}
 */
export function getConfigSnapshot() {
  return String(_snapshotVersion)
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function _recompute() {
  if (Object.keys(_prototypeOverrides).length === 0) {
    _mergedConfig = _baseConfig
  } else {
    const result = { ..._baseConfig }
    for (const [domain, overrides] of Object.entries(_prototypeOverrides)) {
      result[domain] = result[domain]
        ? deepMerge(result[domain], overrides)
        : overrides
    }
    _mergedConfig = result
  }
  _snapshotVersion++
  for (const cb of _listeners) {
    try { cb(_mergedConfig) } catch (err) {
      console.error('[storyboard] Error in config subscriber:', err)
    }
  }
}
```

Sample subscription pattern:

```js
const unsubscribe = subscribeToConfig((config) => {
  const toolbar = config.toolbar || {}
  console.log(toolbar)
})

// later
unsubscribe()
```

Merge behavior is intentionally shallow at the top level and deep per overridden domain. `_recompute()` copies `_baseConfig`, then replaces only the domains present in `_prototypeOverrides` via `deepMerge()`. That lets a prototype override `toolbar.tools.comments` without disturbing unrelated config domains.

## Dependencies

- [`packages/storyboard/src/core/data/loader.js`](../data/loader.js.md) — imported via `../data/loader.js`.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/stores/commandPaletteConfig.js`](commandPaletteConfig.js.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

- [`packages/storyboard/src/internals/canvas/widgets/StoryWidget.jsx`](../../internals/canvas/widgets/StoryWidget.jsx.md)

## Notes

- `initConfig()` expects its `config` argument to already be normalized. The schema/default merge lives in [`packages/storyboard/src/core/stores/configSchema.js`](configSchema.js.md); this file does not validate or backfill missing keys on its own.

- `subscribeToConfig()` invokes the callback immediately, unlike several other stores in this folder. Consumers can render synchronously from the first subscription tick.

- Prototype overrides are keyed by domain, so route changes can surgically clear only `toolbar`, `canvas`, or `commandPalette` state instead of rebuilding everything.
