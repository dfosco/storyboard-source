# `src/storyboard/index.js`

<!--
source: src/storyboard/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The public barrel file for the storyboard system. It re-exports the five public APIs that consumers should use: `StoryboardProvider`, `useSceneData`, `useSceneLoading`, `getByPath`, and `loadScene`. All external imports of storyboard functionality should go through this module.

<details>
<summary>Technical details</summary>

### Composition

Re-exports from internal modules:
- `StoryboardProvider` from `./context.jsx`
- `useSceneData`, `useSceneLoading` from `./hooks/useSceneData.js`
- `getByPath` from `./core/dotPath.js`
- `loadScene` from `./core/loader.js`

### Dependencies

- `./context.jsx`
- `./hooks/useSceneData.js`
- `./core/dotPath.js`
- `./core/loader.js`

### Dependents

This is the intended public import path for external consumers. Currently, internal files import from specific sub-modules directly (e.g., `_app.jsx` imports from `./storyboard/context.jsx`).

</details>
