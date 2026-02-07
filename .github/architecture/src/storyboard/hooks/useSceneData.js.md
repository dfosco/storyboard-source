# `src/storyboard/hooks/useSceneData.js`

<!--
source: src/storyboard/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

The primary consumer-facing hooks for the storyboard system. `useSceneData(path?)` lets any component access scene data by dot-notation path, while `useSceneLoading()` exposes the loading state. These hooks are the recommended way for page and component code to read storyboard data.

Both hooks enforce that they are used within a [`StoryboardProvider`](../context.jsx.md) by checking for a `null` context and throwing a descriptive error if missing.

## Composition

**`useSceneData(path?)`** — returns scene data, optionally resolved to a dot-notation path:

```js
export function useSceneData(path) {
  const context = useContext(StoryboardContext)

  if (context === null) {
    throw new Error('useSceneData must be used within a <StoryboardProvider>')
  }

  const { data, loading, error } = context

  if (loading || error || data == null) {
    return undefined
  }

  if (!path) {
    return data   // return entire scene object
  }

  const value = getByPath(data, path)

  if (value === undefined) {
    console.warn(`[useSceneData] Path "${path}" not found in scene data.`)
    return {}     // empty object to prevent destructuring errors
  }

  return value
}
```

Usage examples:

```jsx
const scene = useSceneData()                // entire scene
const user = useSceneData('user')           // top-level key
const name = useSceneData('user.profile.name') // nested path
const first = useSceneData('projects.0')    // array index
```

**`useSceneLoading()`** — returns `context.loading` boolean:

```js
export function useSceneLoading() {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useSceneLoading must be used within a <StoryboardProvider>')
  }
  return context.loading
}
```

## Dependencies

- `react` — `useContext`
- [`src/storyboard/StoryboardContext.js`](../StoryboardContext.js.md) — `StoryboardContext`
- [`src/storyboard/core/dotPath.js`](../core/dotPath.js.md) — `getByPath`

## Dependents

- [`src/storyboard/components/SceneDataDemo.jsx`](../components/SceneDataDemo.jsx.md) — uses `useSceneData()` to display user and navigation data
- [`src/storyboard/index.js`](../index.js.md) — re-exports both hooks

## Notes

When a path is provided but not found, the hook returns an empty object `{}` (not `undefined`) and logs a warning. This prevents downstream destructuring errors while still surfacing the issue during development.
