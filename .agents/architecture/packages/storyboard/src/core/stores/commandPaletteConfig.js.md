# `packages/storyboard/src/core/stores/commandPaletteConfig.js`

<!--

source: packages/storyboard/src/core/stores/commandPaletteConfig.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`commandPaletteConfig.js` preserves the legacy command-palette config surface while the runtime migrates toward [`packages/storyboard/src/core/stores/configStore.js`](configStore.js.md). It stores the `commandPalette` slice and lazily backfills from the unified store if the standalone initializer was never called.

## Composition

```js
import { getConfig } from './configStore.js'

let _config = { sections: [] }

/**
 * Initialize the command palette config.
 * @param {object} config - The commandPalette object from storyboard.config.json
 */
export function initCommandPaletteConfig(config) {
  _config = { sections: [], ...config }
}

/**
 * Get the current command palette config.
 * Falls back to the unified config store if the legacy store wasn't initialized.
 * @returns {{ sections: Array }}
 */
export function getCommandPaletteConfig() {
  if (_config.sections.length === 0) {
    const uc = getConfig('commandPalette')
    if (uc?.sections?.length > 0) {
      _config = { sections: [], ...uc }
    }
  }
  return _config
```

There is no subscription layer here; it is a compatibility accessor used by UI code and the Vite data plugin output.

## Dependencies

- [`packages/storyboard/src/core/stores/configStore.js`](configStore.js.md) — imported via `./configStore.js`.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

- [`packages/storyboard/src/internals/vite/data-plugin.js`](../../internals/vite/data-plugin.js.md)

## Notes

- The fallback in `getCommandPaletteConfig()` avoids breakage during the transition from dedicated stores to the unified config model.
