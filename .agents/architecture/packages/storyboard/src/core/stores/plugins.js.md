# `packages/storyboard/src/core/stores/plugins.js`

<!--

source: packages/storyboard/src/core/stores/plugins.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`plugins.js` is the enable/disable switchboard for optional Storyboard plugin features. It keeps plugin lookup cheap and defaults unknown plugins to enabled so shipping a new plugin does not require a config change in existing repos.

## Composition

```js
let _plugins = {}

/**
 * Initialize plugin configuration.
 * Called by the Vite data plugin's generated virtual module.
 * @param {Record<string, boolean>} config
 */
export function initPlugins(config) {
  _plugins = { ...config }
}

/**
 * Check whether a plugin is enabled.
 * Returns true by default if the plugin is not explicitly configured.
 * @param {string} name - Plugin name (e.g. "devtools", "comments")
 * @returns {boolean}
 */
export function isPluginEnabled(name) {
  if (name in _plugins) return Boolean(_plugins[name])
  return true
}

/**
 * Get the full plugins config (for diagnostics / testing).
 * @returns {Record<string, boolean>}
 */
export function getPluginsConfig() {
  return { ..._plugins }
}
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/mountStoryboardCore.js`](../mountStoryboardCore.js.md)

- [`packages/storyboard/src/core/stores/configSchema.js`](configSchema.js.md)

- [`packages/storyboard/src/core/stores/plugins.test.js`](plugins.test.js.md)

- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md)

- [`packages/storyboard/src/internals/vite/data-plugin.js`](../../internals/vite/data-plugin.js.md)

- [`packages/storyboard/src/runtime/vite-plugin/wrapper.ts`](../../runtime/vite-plugin/wrapper.ts.md)

## Notes

- Returning `true` for unknown plugin keys makes plugin opt-out explicit rather than opt-in.
