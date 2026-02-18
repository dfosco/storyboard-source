# `packages/core/src/sceneDebug.js`

<!--
source: packages/core/src/sceneDebug.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides a vanilla JS debug panel that displays resolved scene data as formatted JSON. Framework-agnostic — creates DOM elements directly, no React/Vue needed. Unlike the DevTools overlay, this mounts inline (appended to a container) and is useful for embedding a scene inspector directly in a page.

## Composition

**`mountSceneDebug(container?, sceneName?)`** — Creates and appends a debug panel. Returns the created `HTMLElement`.

```js
export function mountSceneDebug(container, sceneName) {
  // Defaults: container = document.body, sceneName = ?scene= param or "default"
  // Injects styles once, creates title + JSON pre element
  // Shows error UI if loadScene throws
  return el
}
```

- Styles are injected once via a module-level `stylesInjected` flag
- Scene name falls back to `?scene=` query param, then `"default"`
- Error state renders a styled error panel instead of JSON

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadScene` for loading and resolving scene data

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountSceneDebug`
