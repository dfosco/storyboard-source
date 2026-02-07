# `src/storyboard/context.jsx`

<!--
source: src/storyboard/context.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The `StoryboardProvider` component that loads scene data and provides it to the component tree via React context. It determines which scene to load from three sources (in priority order): the `?scene=` URL parameter, the `sceneName` prop, or the default `"default"`. It blocks rendering children until the scene is fully loaded, showing a loading fallback or error message as needed.

This is the runtime core of the storyboard system — it calls `loadScene()` on mount, stores the result in state, and exposes it through `StoryboardContext` so any descendant can access scene data via `useSceneData()`.

<details>
<summary>Technical details</summary>

### Composition

- **Default export**: `StoryboardProvider({ sceneName, fallback, children })` — React component
- **Named re-export**: `StoryboardContext` (from `./StoryboardContext.js`)
- Uses `useSearchParams()` to read `?scene=` from the URL
- Uses `useEffect` to call `loadScene(activeSceneName)` when the scene name changes
- Context value shape: `{ data, error, loading, sceneName }`
- Renders `fallback` prop (or `<Text>Loading scene…</Text>`) while loading
- Renders error message with `danger.fg` color on failure
- Renders `children` wrapped in `StoryboardContext.Provider` on success

### Dependencies

- `react` — `useState`, `useEffect`
- `react-router-dom` — `useSearchParams`
- `@primer/react` — `Text`
- `./core/loader.js` — `loadScene`
- `./StoryboardContext.js` — `StoryboardContext`

### Dependents

- `src/pages/_app.jsx` — wraps the entire route tree
- `src/storyboard/index.js` — re-exported as the public `StoryboardProvider`

</details>
