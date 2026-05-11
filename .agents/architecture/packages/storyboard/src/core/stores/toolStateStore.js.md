# `packages/storyboard/src/core/stores/toolStateStore.js`

<!--

source: packages/storyboard/src/core/stores/toolStateStore.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`toolStateStore.js` tracks per-tool runtime visibility and interaction state for declarative tools. It lets toolbar config define initial state while still allowing application code to dim, hide, disable, or reactivate tools after startup.

## Composition

```js
/** All valid tool states. */
export const TOOL_STATES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  HIDDEN: 'hidden',
  DIMMED: 'dimmed',
  DISABLED: 'disabled',
})

const VALID_STATES = new Set(Object.values(TOOL_STATES))

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** @type {Map<string, string>} tool id → state */
let _states = new Map()

/** @type {Map<string, boolean>} tool id → dev-only flag (true when tool lacks `prod`) */
let _devOnlyFlags = new Map()

/** @type {Set<Function>} */
const _listeners = new Set()

let _snapshotVersion = 0

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Seed tool states from toolbar.config.json's `tools` object.
 * Called once at app startup.
 *
 * @param {object} toolsConfig - The `tools` object from toolbar.config.json
 *   (keys are tool IDs, values are tool config objects)
 * @param {{ isLocalDev?: boolean }} [options]
 */
export function initToolbarToolStates(toolsConfig, options = {}) {
  const { isLocalDev = false } = options

  _states = new Map()
  _devOnlyFlags = new Map()

  if (!toolsConfig || typeof toolsConfig !== 'object') {
    _notify()
    return
  }

  for (const [id, tool] of Object.entries(toolsConfig)) {
    // A tool is dev-only if it lacks `prod: true` (or has legacy `localOnly: true`)
    const isDevOnly = !tool.prod || tool.localOnly === true
    _devOnlyFlags.set(id, isDevOnly)

    if (isDevOnly && !isLocalDev) {
      _states.set(id, TOOL_STATES.DISABLED)
    } else if (tool.disabled === true) {
      _states.set(id, TOOL_STATES.DISABLED)
    } else {
      const state = tool.state || TOOL_STATES.ACTIVE
      _states.set(id, state)
    }
  }

  _notify()
}
```

The read and mutation APIs are intentionally small: `setToolbarToolState()`, `getToolbarToolState()`, and `isToolbarToolLocalOnly()`. Subscriptions follow the same external-store snapshot pattern used by the other reactive singletons in this folder.

```js
/**
 * Set state for a tool at runtime.
 * Validates that the state is one of the 5 valid values.
 *
 * @param {string} id    Tool id
 * @param {string} state One of: active, inactive, hidden, dimmed, disabled
 */
export function setToolbarToolState(id, state) {
  if (!VALID_STATES.has(state)) {
    console.warn(`[storyboard] Invalid tool state "${state}" for tool "${id}". Valid states: ${[...VALID_STATES].join(', ')}`)
    return
  }
  _states.set(id, state)
  _notify()
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/**
 * Get the current state for a tool.
 * Returns "active" for unknown tool IDs (safe default).
 *
 * @param {string} id Tool id
 * @returns {string}
 */
export function getToolbarToolState(id) {
  return _states.get(id) || TOOL_STATES.ACTIVE
}

/**
 * Returns whether the tool is dev-only (lacks `prod: true` in config).
 * Returns false for unknown IDs.
 *
 * @param {string} id Tool id
 * @returns {boolean}
 */
export function isToolbarToolLocalOnly(id) {
  return _devOnlyFlags.get(id) || false
}

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

/**
 * Subscribe to tool state changes. Compatible with useSyncExternalStore.
 *
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function subscribeToToolbarToolStates(callback) {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

/**
 * Snapshot for useSyncExternalStore.
 *
 * @returns {string}
 */
export function getToolbarToolStatesSnapshot() {
  return String(_snapshotVersion)
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function _notify() {
  _snapshotVersion++
  for (const cb of _listeners) {
    try { cb() } catch (err) {
      console.error('[storyboard] Error in tool state subscriber:', err)
    }
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Reset all state. Only for tests. */
export function _resetToolbarToolStates() {
  _states = new Map()
  _devOnlyFlags = new Map()
  _listeners.clear()
  _snapshotVersion = 0
}
```

Sample subscription pattern:

```js
const unsubscribe = subscribeToToolbarToolStates(() => {
  const state = getToolbarToolState('inspector')
  console.log(state)
})

// later
unsubscribe()
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/stores/paletteProviders.js`](paletteProviders.js.md)

- [`packages/storyboard/src/core/stores/paletteProviders.test.js`](paletteProviders.test.js.md)

- [`packages/storyboard/src/core/stores/toolStateStore.test.js`](toolStateStore.test.js.md)

- [`packages/storyboard/src/core/ui/CommandMenu.jsx`](../ui/CommandMenu.jsx.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

## Notes

- Dev-only tools are forced to `disabled` outside local development even if config requested another state.

- Unknown tools default to `active` so missing entries fail open instead of disappearing silently.
