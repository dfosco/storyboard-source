# `packages/storyboard/src/core/stores/customerModeConfig.js`

<!--

source: packages/storyboard/src/core/stores/customerModeConfig.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`customerModeConfig.js` is the minimal runtime holder for the `customerMode` domain. It lets the app query whether customer mode is enabled and which chrome-hiding rules should apply without touching the larger config tree.

## Composition

```js
let _config = { enabled: false, hideChrome: false, hideHomepage: false, protoHomepage: '' }

/**
 * Initialize customer mode config.
 * @param {object} config - The customerMode object from storyboard.config.json
 */
export function initCustomerModeConfig(config) {
  _config = { enabled: false, hideChrome: false, hideHomepage: false, protoHomepage: '', ...config }
}

/**
 * Get the current customer mode config.
 * @returns {{ enabled: boolean, hideChrome: boolean, hideHomepage: boolean, protoHomepage: string }}
 */
export function getCustomerModeConfig() {
  return _config
}

/**
 * Check if customer mode is enabled.
 * @returns {boolean}
 */
export function isCustomerMode() {
  return _config.enabled
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

## Notes

- The store normalizes every init through the same default object, so omitted booleans always resolve to `false`.
