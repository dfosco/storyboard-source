# `packages/storyboard/src/core/stores/featureFlags.js`

<!--

source: packages/storyboard/src/core/stores/featureFlags.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`featureFlags.js` provides persistent, browser-local feature toggles for Storyboard. It merges built-in defaults with config-provided defaults, stores user overrides under a `flag.` prefix in local storage, and mirrors active flags onto the document body for CSS-driven behavior.

## Composition

```js
import { getLocal, setLocal, removeLocal, getAllLocal } from '../session/localStorage.js'

const FLAG_PREFIX = 'flag.'
const BODY_CLASS_PREFIX = 'sb-ff-'

/** Built-in feature flag defaults — always available even if initFeatureFlags is never called. */
const BUILTIN_DEFAULTS = {
  'canvas-auto-reload': false,
  'prototype-auto-reload': true,
}

/** Module-level storage for config defaults */
let _defaults = {}

/**
 * Sync body classes for active feature flags.
 * Adds `sb-ff-{name}` for every flag that resolves to true,
 * removes it for every flag that resolves to false.
 */
export function syncFlagBodyClasses() {
  if (typeof document === 'undefined') return
  for (const key of Object.keys(_defaults)) {
    const cls = BODY_CLASS_PREFIX + key
    if (getFlag(key)) {
      document.body.classList.add(cls)
    } else {
      document.body.classList.remove(cls)
    }
  }
}

/**
 * Initialize the feature flag system with config defaults.
 * Only writes a default to localStorage when no user override exists yet,
 * so toggled values survive across reloads.
 * @param {Record<string, boolean>} defaults - Flag key → default value
 */
export function initFeatureFlags(defaults = {}) {
  _defaults = { ...BUILTIN_DEFAULTS, ...defaults }
  for (const [key, value] of Object.entries(_defaults)) {
    if (getLocal(FLAG_PREFIX + key) === null) {
      setLocal(FLAG_PREFIX + key, String(value))
    }
  }
  syncFlagBodyClasses()
}
```

Runtime reads and writes stay simple: `getFlag()` resolves `localStorage → configured defaults → built-in defaults`, while `setFlag()`, `toggleFlag()`, `getAllFlags()`, and `resetFlags()` manage the persistent override layer.

```js
/**
 * Read a flag value. Priority: localStorage → config default.
 * @param {string} key - Flag key (without prefix)
 * @returns {boolean}
 */
export function getFlag(key) {
  const localVal = getLocal(FLAG_PREFIX + key)
  if (localVal !== null) return localVal === 'true'

  return _defaults[key] ?? BUILTIN_DEFAULTS[key] ?? false
}

/**
 * Set a flag value. Writes to localStorage for persistence.
 * @param {string} key - Flag key (without prefix)
 * @param {boolean} value
 */
export function setFlag(key, value) {
  setLocal(FLAG_PREFIX + key, String(value))
  syncFlagBodyClasses()
}

/**
 * Toggle a flag. Reads current value, writes opposite to localStorage.
 * @param {string} key - Flag key (without prefix)
 */
export function toggleFlag(key) {
  setFlag(key, !getFlag(key))
}

/**
 * Get all flags with their default and current (resolved) values.
 * @returns {Record<string, { default: boolean, current: boolean }>}
 */
export function getAllFlags() {
  const allKeys = new Set([...Object.keys(BUILTIN_DEFAULTS), ...Object.keys(_defaults)])
  const result = {}
  for (const key of allKeys) {
    result[key] = {
      default: _defaults[key] ?? BUILTIN_DEFAULTS[key] ?? false,
      current: getFlag(key),
    }
  }
  return result
}

/**
 * Reset all flags — removes localStorage overrides.
 * Flags revert to config defaults.
 */
export function resetFlags() {
  const allLocal = getAllLocal()
  for (const localKey of Object.keys(allLocal)) {
    if (localKey.startsWith(FLAG_PREFIX)) {
      removeLocal(localKey)
    }
  }
  syncFlagBodyClasses()
}

/**
 * Get all registered flag keys.
 * @returns {string[]}
 */
export function getFlagKeys() {
  return [...new Set([...Object.keys(BUILTIN_DEFAULTS), ...Object.keys(_defaults)])]
}
```

## Dependencies

- [`packages/storyboard/src/core/session/localStorage.js`](../session/localStorage.js.md) — imported via `../session/localStorage.js`.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/mountStoryboardCore.js`](../mountStoryboardCore.js.md)

- [`packages/storyboard/src/core/session/bodyClasses.js`](../session/bodyClasses.js.md)

- [`packages/storyboard/src/core/stores/configSchema.js`](configSchema.js.md)

- [`packages/storyboard/src/core/stores/configSchema.test.js`](configSchema.test.js.md)

- [`packages/storyboard/src/core/tools/registry.js`](../tools/registry.js.md)

- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md)

- [`packages/storyboard/src/internals/vite/data-plugin.js`](../../internals/vite/data-plugin.js.md)

## Notes

- `initFeatureFlags()` writes missing defaults into storage only once, so a user toggle survives reloads and future default changes.

- `syncFlagBodyClasses()` only iterates configured/defaulted keys; ad-hoc localStorage values outside the defaults set do not produce body classes.
