# `packages/storyboard/src/core/stores/uiConfig.js`

<!--

source: packages/storyboard/src/core/stores/uiConfig.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`uiConfig.js` is the simplest chrome-visibility store in the core. It turns the `ui.hide` array from config into a set-based lookup so toolbar code can cheaply decide whether docs, inspector, create, comments, or command UI should render.

## Composition

```js
let _hiddenItems = new Set()

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Initialize UI config from storyboard.config.json's "ui" key.
 * Called by the Vite data plugin's generated virtual module.
 *
 * @param {{ hide?: string[] }} [config]
 */
export function initUIConfig(config = {}) {
  _hiddenItems = new Set(Array.isArray(config.hide) ? config.hide : [])
}

/**
 * Check whether a specific menu is hidden by project config.
 *
 * @param {string} key  Menu key (e.g. 'docs', 'inspector', 'create', 'comments', 'command')
 * @returns {boolean}
 */
export function isMenuHidden(key) {
  return _hiddenItems.has(key)
}

/**
 * Get the full set of hidden item keys.
 *
 * @returns {string[]}
 */
export function getHiddenItems() {
  return Array.from(_hiddenItems)
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset all internal state. Only for use in tests.
 */
export function _resetUIConfig() {
  _hiddenItems = new Set()
}
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/stores/uiConfig.test.js`](uiConfig.test.js.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

## Notes

- The internal `Set` keeps lookups constant-time and naturally removes duplicates in the input array.
