# `src/storyboard/components/SceneDataDemo.jsx`

<!--
source: src/storyboard/components/SceneDataDemo.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A demo component that showcases the `useSceneData()` hook API. It reads the full scene object, destructures the `user` and `navigation` data, and renders them in a simple formatted layout. This serves as a living example of how to consume storyboard data in page components.

Unlike `SceneDebug` (which loads scene data independently via `loadScene()`), this component relies entirely on the `StoryboardProvider` context, demonstrating the recommended data access pattern.

<details>
<summary>Technical details</summary>

### Composition

- **Default export**: `SceneDataDemo` component (no props)
- Calls `useSceneData()` with no path to get the full scene object
- Renders user info (`name`, `username`, `bio`, `location`) and navigation labels
- Uses CSS Modules from `SceneDebug.module.css` for styling (shared styles)

### Dependencies

- `@primer/react` — `Text`
- `../hooks/useSceneData.js` — `useSceneData`
- `./SceneDebug.module.css` — CSS Modules (shared with `SceneDebug`)

### Dependents

Currently not imported by any page. Available as a reusable demo component.

</details>
