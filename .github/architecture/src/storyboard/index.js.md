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

- [`src/storyboard/context.jsx`](./context.jsx.md) — Provider component
- [`src/storyboard/hooks/useSceneData.js`](./hooks/useSceneData.js.md) — Data access hooks
- [`src/storyboard/core/dotPath.js`](./core/dotPath.js.md) — Path utility
- [`src/storyboard/core/loader.js`](./core/loader.js.md) — Scene loader

## Dependents

This is the intended public import path for external consumers. Currently, internal files import from specific sub-modules directly (e.g., [`src/pages/_app.jsx`](../pages/_app.jsx.md) imports from [`src/storyboard/context.jsx`](./context.jsx.md)).
