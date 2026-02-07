# `src/storyboard/context.jsx`

<!--
source: src/storyboard/context.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The `StoryboardProvider` component that loads scene data and provides it to the component tree via React context. It determines which scene to load from three sources (in priority order): the `?scene=` URL parameter, the `sceneName` prop, or the default `"default"`. It blocks rendering children until the scene is fully loaded, showing a loading fallback or error message as needed.

This is the runtime core of the storyboard system — it calls [`loadScene()`](./core/loader.js.md) on mount, stores the result in state, and exposes it through [`StoryboardContext`](./StoryboardContext.js.md) so any descendant can call [`useSceneData()`](./hooks/useSceneData.js.md).

## Composition

The component accepts three props:

```jsx
export default function StoryboardProvider({ sceneName, fallback, children })
```

Scene name resolution uses URL param first, then prop, then default:

```js
const sceneFromUrl = searchParams.get('scene')
const activeSceneName = sceneFromUrl || sceneName || 'default'
```

The context value shape provided to descendants:

```js
const value = {
  data,        // resolved scene object (or null)
  error,       // error message string (or null)
  loading,     // boolean
  sceneName: activeSceneName,
}
```

The component blocks rendering until loading completes:

```jsx
if (loading) {
  return fallback ?? <Text>Loading scene…</Text>
}
if (error) {
  return <Text color="danger.fg">Error loading scene: {error}</Text>
}
return (
  <StoryboardContext.Provider value={value}>
    {children}
  </StoryboardContext.Provider>
)
```

Also re-exports [`StoryboardContext`](./StoryboardContext.js.md) as a named export.

## Dependencies

- `react` — `useState`, `useEffect`
- `react-router-dom` — `useSearchParams`
- `@primer/react` — `Text`
- [`src/storyboard/core/loader.js`](./core/loader.js.md) — `loadScene`
- [`src/storyboard/StoryboardContext.js`](./StoryboardContext.js.md) — `StoryboardContext`

## Dependents

- [`src/pages/_app.jsx`](../pages/_app.jsx.md) — wraps the entire route tree
- [`src/storyboard/index.js`](./index.js.md) — re-exported as the public `StoryboardProvider`
