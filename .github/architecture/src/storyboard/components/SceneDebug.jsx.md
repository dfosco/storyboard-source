# `src/storyboard/components/SceneDebug.jsx`

<!--
source: src/storyboard/components/SceneDebug.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A debug/development component that loads a scene and renders its fully resolved data as formatted JSON. It's used to verify the loader pipeline is working correctly — confirming that `$ref` and `$global` directives resolve as expected. It loads scene data independently via `loadScene()` rather than through the provider context.

Scene selection follows the same priority as the provider: `sceneName` prop first, then `?scene=` URL param, then `"default"`.

<details>
<summary>Technical details</summary>

### Composition

- **Default export**: `SceneDebug({ sceneName })` — React component with optional `sceneName` prop
- Manages its own `data`, `error`, and `loading` state via `useState`
- Calls `loadScene(activeSceneName)` in a `useEffect` keyed on the active scene name
- Renders loading spinner, error message, or `JSON.stringify(data, null, 2)` in a `<pre>` block
- Uses `PropTypes` for prop validation
- Uses CSS Modules from `SceneDebug.module.css`

### Dependencies

- `react` — `useState`, `useEffect`
- `react-router-dom` — `useSearchParams`
- `@primer/react` — `Text`
- `prop-types` — PropTypes validation
- `../core/loader.js` — `loadScene`
- `./SceneDebug.module.css` — CSS Modules

### Dependents

Currently not imported by any page. Available as a standalone debug tool.

### Notes

- Unlike the `StoryboardProvider`, this component checks `sceneName` prop before the URL param (provider checks URL first). This is a minor inconsistency but allows explicit prop control to take priority in debug scenarios.

</details>
