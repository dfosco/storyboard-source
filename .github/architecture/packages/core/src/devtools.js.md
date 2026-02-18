# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Provides a framework-agnostic floating DevTools toolbar for Storyboard development. Mounts itself directly to the DOM (vanilla JS, no React/Vue dependency) and gives developers quick access to scene inspection and parameter reset without leaving the prototype.

The toolbar renders a beaker button (bottom-right) that opens a dropdown menu with "Show scene info" (overlay panel with resolved scene JSON) and "Reset all params" (clears the URL hash). Visibility can be toggled with `Cmd+.` / `Ctrl+.`.

## Composition

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `mountDevTools(options?)` | `function` | Mount the DevTools to the DOM. Safe to call multiple times (no-ops after first). |

### Key internals

- **`STYLES`** — Inline CSS string injected into `<head>` on first mount. All classes prefixed with `sb-devtools-` to avoid collisions.
- **`getSceneName()`** — Reads `?scene=` from the URL, defaults to `'default'`.
- **`openPanel()`** — Calls [`loadScene()`](./loader.js.md) synchronously to resolve scene data and renders it as formatted JSON in a floating overlay panel.
- **`closePanel()`** — Removes the overlay element from the DOM.

### Usage

```js
import { mountDevTools } from '@dfosco/storyboard-core'
mountDevTools() // call once at app startup
```

### DOM structure created

```
.sb-devtools-wrapper (fixed, bottom-right)
  ├── .sb-devtools-menu (dropdown)
  │   ├── .sb-devtools-menu-item (Show scene info)
  │   ├── .sb-devtools-menu-item (Reset all params)
  │   └── .sb-devtools-hint (keyboard shortcut hint)
  └── .sb-devtools-trigger (beaker button)

.sb-devtools-overlay (on-demand)
  ├── .sb-devtools-backdrop
  └── .sb-devtools-panel
      ├── .sb-devtools-panel-header
      └── .sb-devtools-panel-body > pre.sb-devtools-code
```

## Dependencies

| Module | Imports |
|--------|---------|
| [`packages/core/src/loader.js`](./loader.js.md) | `loadScene` |

## Dependents

| File | How |
|------|-----|
| [`packages/core/src/index.js`](./index.js.md) | Re-exports `mountDevTools` |
| [`src/index.jsx`](../../../src/index.jsx.md) | Calls `mountDevTools()` in DEV mode via `@dfosco/storyboard-core` |

## Notes

- The toolbar is only mounted in development (`if (import.meta.env.DEV) mountDevTools()` in the app entry point).
- Double-mount is prevented by checking for an existing `.sb-devtools-wrapper` element in the container.
- The "Reset all params" button clears the entire URL hash (`window.location.hash = ''`), which may trigger `hashchange` listeners in other modules like [`hideMode.js`](./hideMode.js.md).
- Scene data is loaded **synchronously** via `loadScene()` — this works because the data index is already initialized at startup.
