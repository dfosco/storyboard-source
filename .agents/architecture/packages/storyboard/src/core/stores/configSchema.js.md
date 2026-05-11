# `packages/storyboard/src/core/stores/configSchema.js`

<!--

source: packages/storyboard/src/core/stores/configSchema.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`configSchema.js` defines the canonical shape of `storyboard.config.json`. It is the source of truth for built-in defaults, paste-rule bootstrapping, and the deep-merge semantics that turn partial user config into a fully safe runtime object.

## Composition

The file starts with typedefs that describe the major config domains, then exports `builtinPasteRules` and `configDefaults` as the baseline config surface used across the core.

```js
/** Built-in paste rules shipped with storyboard. */
export const builtinPasteRules = [
  {
    id: 'figma',
    match: 'https?://(?:www\\.)?figma\\.com/',
    widget: 'figma-embed',
    propsMap: { width: 800, height: 450 },
  },
]

/** Default config values. Every key here is safe to access without null checks. */
export const configDefaults = {
  customDomain: '',
  prodDomain: '',
  devDomain: '',
  devDomainColor: '',
  repository: { owner: '', name: '' },
  modes: { enabled: false },
  comments: { discussions: { category: 'Comments' } },
  plugins: {},
  workshop: {
    enabled: false,
    features: { createPrototype: true, createFlow: true, createCanvas: true },
  },
  featureFlags: {},
  ui: {},
  toolbar: {},
  canvas: {
    pasteRules: builtinPasteRules,
    github: {
      embedBehavior: 'link-preview', // "link-preview" | "rich-embed"
      ghGuard: 'copy',               // "copy" | "link" | "off"
    },
    zoom: {
      min: 10,
      max: 250,
      step: 10,
    },
    terminal: {
      resizable: false,
      defaultWidth: 800,
      defaultHeight: 450,
    },
    messaging: {
      conversationTimeoutMinutes: 30,
      messageTokenTimeoutSeconds: 120,
      pollIntervalMs: 2000,
      maxMessagesPerHub: 200,
    },
    inlineStories: false,
  },
  commandPalette: {
    providers: ['prototypes', 'flows', 'canvases', 'pages'],
    ranking: 'frecency',
    sections: [],
  },
  customerMode: {
    enabled: false,
    hideChrome: false,
    hideHomepage: false,
    protoHomepage: '',
  },
}
```

`mergeConfig()` recursively merges objects while replacing arrays wholesale. `getConfig()` applies that merge to produce a fully defaulted config, and `getConfigDefaults()` returns a cloned baseline for diagnostics or tests.

```js
/**
 * Deep-merge helper that replaces arrays instead of concatenating.
 * Objects are recursively merged; all other values are overwritten.
 */
function mergeConfig(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return overrides ?? defaults
  }
  const result = { ...defaults }
  for (const key of Object.keys(overrides)) {
    const val = overrides[key]
    if (val === undefined) continue
    if (Array.isArray(val)) {
      // Arrays replace (e.g. pasteRules, providers) — no concat
      result[key] = val
    } else if (val && typeof val === 'object' && !Array.isArray(val) && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = mergeConfig(defaults[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

/**
 * Return a fully defaulted config by merging user-provided values over defaults.
 * Safe to call with an empty object or undefined — returns full defaults.
 *
 * @param {Partial<StoryboardConfig>} [raw={}]
 * @returns {StoryboardConfig}
 */
export function getConfig(raw = {}) {
  return mergeConfig(configDefaults, raw)
}

/**
 * Return a copy of the bare defaults (no user overrides).
 * @returns {StoryboardConfig}
 */
export function getConfigDefaults() {
  return JSON.parse(JSON.stringify(configDefaults))
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/stores/configSchema.test.js`](configSchema.test.js.md)

- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md)

- [`packages/storyboard/src/internals/canvas/widgets/widgetProps.js`](../../internals/canvas/widgets/widgetProps.js.md)

- [`packages/storyboard/src/internals/vite/data-plugin.js`](../../internals/vite/data-plugin.js.md)

## Notes

- Array replacement is deliberate for lists like `pasteRules` and palette `providers`; Storyboard does not concatenate defaults with user arrays.
