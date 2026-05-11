# `packages/storyboard/src/core/stores/canvasConfig.js`

<!--

source: packages/storyboard/src/core/stores/canvasConfig.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`canvasConfig.js` is a thin runtime cache for the `canvas` section of Storyboard config. It exposes convenience getters for paste rules, terminal defaults, agent overrides, and zoom bounds so UI and handler code do not need to repeatedly traverse the unified config object.

## Composition

```js
let _pasteRules = []
let _terminal = {}
let _agents = {}
let _zoom = { min: 10, max: 250, step: 10 }

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Initialize canvas config from storyboard.config.json's "canvas" key.
 * Called by mountStoryboardCore.
 *
 * @param {{ pasteRules?: object[], terminal?: object, agents?: object, zoom?: object }} [config]
 */
export function initCanvasConfig(config = {}) {
  _pasteRules = Array.isArray(config.pasteRules) ? config.pasteRules : []
  _terminal = config.terminal && typeof config.terminal === 'object' ? config.terminal : {}
  _agents = config.agents && typeof config.agents === 'object' ? config.agents : {}
  _zoom = config.zoom && typeof config.zoom === 'object'
    ? { min: config.zoom.min ?? 10, max: config.zoom.max ?? 250, step: config.zoom.step ?? 10 }
    : { min: 10, max: 250, step: 10 }
}
```

The store keeps normalized module variables for `pasteRules`, `terminal`, `agents`, and `zoom`, then exposes focused getters like `getPasteRules()`, `isTerminalResizable()`, and `getTerminalDimensions()`.

```js
/**
 * Get the configured paste rules (raw config objects).
 *
 * @returns {object[]}
 */
export function getPasteRules() {
  return _pasteRules
}

/**
 * Get terminal widget configuration.
 *
 * @returns {{ theme?: object, fontSize?: number, fontFamily?: string, prompt?: string }}
 */
export function getTerminalConfig() {
  return _terminal
}

/**
 * Get agent configurations.
 *
 * @returns {object}
 */
export function getAgentsConfig() {
  return _agents
}

/**
 * Get canvas zoom configuration (min, max, step).
 *
 * @returns {{ min: number, max: number, step: number }}
 */
export function getCanvasZoom() {
  return _zoom
}

/**
 * Check if a terminal/agent widget should be resizable based on config.
 * Agent-level `resizable` overrides the base `terminal.resizable`.
 *
 * @param {string|null} [agentId] — agent ID to check for overrides
 * @returns {boolean}
 */
export function isTerminalResizable(agentId = null) {
  if (agentId) {
    const agentCfg = _agents[agentId]
    if (agentCfg && agentCfg.resizable !== undefined) return agentCfg.resizable
  }
  return _terminal.resizable ?? false
}

/**
 * Get effective default dimensions for a terminal/agent widget.
 * Cascade: agent config > terminal config > provided fallbacks.
 *
 * @param {string|null} [agentId] — agent ID to check for overrides
 * @param {{ width: number, height: number }} [fallback] — schema-level fallbacks
 * @returns {{ width: number, height: number }}
 */
export function getTerminalDimensions(agentId = null, fallback = { width: 800, height: 450 }) {
  const base = {
    width: _terminal.defaultWidth ?? fallback.width,
    height: _terminal.defaultHeight ?? fallback.height,
  }
  if (agentId) {
    const agentCfg = _agents[agentId]
    if (agentCfg) {
      return {
        width: agentCfg.defaultWidth ?? base.width,
        height: agentCfg.defaultHeight ?? base.height,
      }
    }
  }
  return base
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Reset all internal state. Only for use in tests.
 */
export function _resetCanvasConfig() {
  _pasteRules = []
  _terminal = {}
  _agents = {}
  _zoom = { min: 10, max: 250, step: 10 }
}
```

There is no subscribe API here; consumers treat it as read-mostly config seeded during core mount or tests.

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/stores/canvasConfig.test.js`](canvasConfig.test.js.md)

- [`packages/storyboard/src/core/stores/configStore.js`](configStore.js.md)

- [`packages/storyboard/src/core/tools/handlers/canvasAgents.js`](../tools/handlers/canvasAgents.js.md)

- [`packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx`](../ui/CanvasAgentsMenu.jsx.md)

- [`packages/storyboard/src/core/ui/CanvasCreateMenu.jsx`](../ui/CanvasCreateMenu.jsx.md)

- [`packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`](../../internals/CommandPalette/CommandPalette.jsx.md)

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../internals/canvas/CanvasPage.jsx.md)

## Notes

- Agent-level terminal settings override base terminal settings for both `resizable` and default dimensions.

- Unlike [`packages/storyboard/src/core/stores/configStore.js`](configStore.js.md), this file is not reactive; callers read values on demand after initialization.
