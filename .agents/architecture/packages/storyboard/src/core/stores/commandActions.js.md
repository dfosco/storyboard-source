# `packages/storyboard/src/core/stores/commandActions.js`

<!--

source: packages/storyboard/src/core/stores/commandActions.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`commandActions.js` is the runtime registry behind the command menu and command palette command provider. It combines declarative action metadata from toolbar config with imperative handlers registered by the core, tools, or plugin features.

## Composition

```js
let _config = { actions: {}, footer: '' }

/** @type {Map<string, any>} id → handler (function or object) */
const _handlers = new Map()

/** @type {Set<Function>} */
const _listeners = new Set()

let _snapshotVersion = 0

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Seed the registry from a menu config object.
 * Called once at app startup.
 *
 * @param {{ actions: Array, footer?: string }} config
 */
export function initCommandActions(config) {
  _config = { ...config }
  _notify()
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

/**
 * Register a handler for a declared action.
 *
 * @param {string} id     Action id (e.g. "core/viewfinder")
 * @param {Function|object} handler
 *   - default type: () => void
 *   - toggle type:  { execute(), getState() }
 *   - submenu type: { getChildren() }
 */
export function registerCommandAction(id, handler) {
  _handlers.set(id, handler)
  _notify()
```

Alongside static config, the store supports dynamic groups via `setDynamicActions()` so features like comments can inject and later remove batches of actions without rewriting the base config.

```js
/** @type {Array} */
let _dynamicActions = []

/**
 * Add dynamic actions (e.g. comments menu items).
 * These are appended after config-declared actions.
 *
 * @param {string} group  Group key for bulk replacement (e.g. "comments")
 * @param {Array<{ id: string, label: string, type?: string, separatorBefore?: boolean }>} actions
 * @param {Record<string, Function|object>} [handlers]  id → handler map
 */
export function setDynamicActions(group, actions, handlers = {}) {
  // Remove previous entries for this group
  _dynamicActions = _dynamicActions.filter(a => a._group !== group)

  for (const action of actions) {
    _dynamicActions.push({ ...action, type: action.type || 'default', _group: group })
  }

  // Register handlers
  for (const [id, handler] of Object.entries(handlers)) {
    _handlers.set(id, handler)
  }

  _notify()
}

/**
 * Remove all dynamic actions for a group.
 * @param {string} group
 */
export function clearDynamicActions(group) {
  const removed = _dynamicActions.filter(a => a._group === group)
  _dynamicActions = _dynamicActions.filter(a => a._group !== group)
  for (const a of removed) {
    _handlers.delete(a.id)
  }
  _notify()
```

Resolution is mode-aware and route-aware. `getActionsForMode()` filters by `modes`, strips actions hidden on the current route, flattens handler state into menu-friendly records, and keeps dynamic items ahead of a footer if one exists.

```js
// Base path for route matching — set by CoreUIBar or app layer
let _basePath = '/'

/**
 * Set the base path used by isExcludedByRoute for portable pattern matching.
 * @param {string} basePath
 */
export function setRoutingBasePath(basePath) {
  _basePath = basePath || '/'
}

/**
 * Check if an item is excluded from the current route.
 * Strips the base path so patterns match against app-relative paths
 * (e.g. "/" for the root, "/Signup" for a prototype page).
 * @param {object} item  Action or menu with optional excludeRoutes array
 * @returns {boolean} true if the item should be hidden
 */
export function isExcludedByRoute(item) {
  const patterns = item.excludeRoutes
  if (!patterns || !Array.isArray(patterns) || patterns.length === 0) return false
  if (typeof window === 'undefined') return false
  let pathname = window.location.pathname
  const base = _basePath.replace(/\/+$/, '')
  if (base && pathname.startsWith(base)) {
    pathname = pathname.slice(base.length) || '/'
  }
  return patterns.some(pattern => new RegExp(pattern).test(pathname))
}

/**
 * Check if an action is visible in a given mode.
 * @param {object} action
 * @param {string} mode
 * @returns {boolean}
 */
function actionVisibleInMode(action, mode) {
  if (isExcludedByRoute(action)) return false
  const modes = action.modes
  if (!modes) return true
  return modes.includes('*') || modes.includes(mode)
}

/**
 * Get resolved actions for a given mode.
 * Filters by each action's modes array, appends dynamic actions.
 *
 * @param {string} mode  Current mode name
 * @returns {Array<{ id, label, type, separatorBefore?, handler?, active? }>}
 */
export function getActionsForMode(mode) {
  const configActions = Array.isArray(_config.actions) ? _config.actions : []
  const filtered = configActions.filter(a => actionVisibleInMode(a, mode))
  const dynamic = _dynamicActions.filter(a => actionVisibleInMode(a, mode))

  // Insert dynamic actions before the footer (if present)
  const footerIndex = filtered.findIndex(a => a.type === 'footer')
  let all
  if (footerIndex >= 0 && dynamic.length > 0) {
    all = [
      ...filtered.slice(0, footerIndex),
      ...dynamic,
      ...filtered.slice(footerIndex),
    ]
  } else {
    all = [...filtered, ...dynamic]
  }

  return all.map(a => {
    const handler = _handlers.get(a.id)
    const isToggle = a.type === 'toggle'
    const active = isToggle && handler?.getState ? handler.getState() : false

    return {
      id: a.id,
      label: a.label,
      type: a.type || 'default',
      url: a.url || null,
      toolKey: a.toolKey || null,
      localOnly: a.localOnly || false,
      hideFromCommandPaletteSearch: a.hideFromCommandPaletteSearch || false,
      handler,
      active,
    }
  })
}

/**
 * Execute an action by id.
 * @param {string} id
 */
export function executeAction(id) {
  const handler = _handlers.get(id)
  if (!handler) return
  if (typeof handler === 'function') {
    handler()
  } else if (handler.execute) {
    handler.execute()
  }
  _notify()
}
```

Subscription follows the external-store pattern:

```js
const unsubscribe = subscribeToCommandActions(() => {
  const actions = getActionsForMode('default')
  console.log(actions)
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

- [`packages/storyboard/src/core/ui/CommandMenu.jsx`](../ui/CommandMenu.jsx.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

## Notes

- `isExcludedByRoute()` strips the configured base path before applying regexes, which is important for branch-prefixed deploy URLs.

- Toggle actions read `handler.getState()` during resolution, so their active state is recomputed every time callers ask for the menu model.
