# `src/storyboard/index.js`

<!--
source: src/storyboard/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The public barrel file for the storyboard system. All external imports of storyboard functionality should go through this module.

## Composition

```js
export { default as StoryboardProvider } from './context.jsx'
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { getByPath } from './core/dotPath.js'
export { loadScene } from './core/loader.js'
```

## Dependencies

- `./context.jsx` — Provider component
- `./hooks/useSceneData.js` — Data access hooks
- `./core/dotPath.js` — Path utility
- `./core/loader.js` — Scene loader

## Dependents

This is the intended public import path for external consumers. Currently, internal files import from specific sub-modules directly (e.g., `_app.jsx` imports from `./storyboard/context.jsx`).
