# `packages/core/src/sceneDebug.js`

<!--
source: packages/core/src/sceneDebug.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Provides a framework-agnostic debug panel that renders resolved scene data as formatted JSON. Unlike [`devtools.js`](./devtools.js.md) (which is a floating toolbar with multiple features), `sceneDebug` is a single-purpose component designed to be embedded into a container element — useful for dedicated debug views or pages.

## Composition

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `mountSceneDebug(container?, sceneName?)` | `function` | Mount a scene debug panel into the DOM. Returns the created element. |

### Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `container` | `document.body` | Target element to append the debug panel to |
| `sceneName` | `?scene=` param or `'default'` | Scene to load and display |

### Usage

```js
import { mountSceneDebug } from '@dfosco/storyboard-core'

mountSceneDebug(document.getElementById('debug'))
// or
mountSceneDebug() // appends to document.body
```

### DOM structure created

```
.sb-scene-debug
  ├── h2.sb-scene-debug-title ("Scene: {name}")
  └── pre.sb-scene-debug-code (formatted JSON)

// or on error:
.sb-scene-debug
  └── .sb-scene-debug-error
      ├── .sb-scene-debug-error-title
      └── p.sb-scene-debug-error-message
```

### Key internals

- **`STYLES`** — Inline CSS injected into `<head>` once (guarded by `stylesInjected` flag).
- Scene data is loaded synchronously via [`loadScene()`](./loader.js.md) and rendered with `JSON.stringify(data, null, 2)`.
- Errors during scene loading are caught and displayed in a styled error block.

## Dependencies

| Module | Imports |
|--------|---------|
| [`packages/core/src/loader.js`](./loader.js.md) | `loadScene` |

## Dependents

| File | How |
|------|-----|
| [`packages/core/src/index.js`](./index.js.md) | Re-exports `mountSceneDebug` |

No other files in the repository currently import or call `mountSceneDebug` directly — it is available as a public API for consumer use.

## Notes

- Unlike `mountDevTools()`, this function does **not** prevent double-mounting — calling it multiple times will append multiple debug panels to the container.
- Styles are injected only once across all calls (module-level `stylesInjected` boolean).
- The function returns the created `HTMLElement`, so callers can remove or replace it later.
