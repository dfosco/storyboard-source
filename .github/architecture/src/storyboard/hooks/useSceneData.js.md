# `src/storyboard/hooks/useSceneData.js`

<!--
source: src/storyboard/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

The primary consumer-facing hooks for the storyboard system. `useSceneData(path?)` lets any component access scene data by dot-notation path with URL hash parameter overrides, while `useSceneLoading()` exposes the loading state. These hooks are the recommended way for page and component code to read storyboard data.

Hash params override scene data — both exact matches and nested paths. For example, `useSceneData('user.name')` with `#user.name=Alice` returns `"Alice"`, and `useSceneData('repositories')` with `#repositories.0.name=Foo` returns a deep clone of the repositories array with `[0].name` overridden to `"Foo"`.

Both hooks enforce that they are used within a [`StoryboardProvider`](../context.jsx.md) by checking for a `null` context and throwing a descriptive error if missing.

## Composition

**`useSceneData(path?)`** — returns scene data, optionally resolved to a dot-notation path. Uses `useSyncExternalStore` to subscribe to hash changes so components re-render when hash params are updated:

```js
export function useSceneData(path) {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useSceneData must be used within a <StoryboardProvider>')
  }
  const { data, loading, error } = context

  // Re-render on any hash change
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)

  const result = useMemo(() => {
    if (loading || error || data == null) return undefined

    if (!path) {
      // No path → return full scene data with all hash overrides applied
      const allParams = getAllParams()
      const keys = Object.keys(allParams)
      if (keys.length === 0) return data
      const merged = deepClone(data)
      for (const key of keys) setByPath(merged, key, allParams[key])
      return merged
    }

    // Exact match: hash param directly for this path
    const exact = getParam(path)
    if (exact !== null) return exact

    // Child overrides: hash params nested under this path
    const prefix = path + '.'
    const allParams = getAllParams()
    const childKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))

    const sceneValue = getByPath(data, path)

    if (childKeys.length > 0 && sceneValue !== undefined) {
      const merged = deepClone(sceneValue)
      for (const key of childKeys) {
        const relativePath = key.slice(prefix.length)
        setByPath(merged, relativePath, allParams[key])
      }
      return merged
    }

    if (sceneValue === undefined) {
      console.warn(`[useSceneData] Path "${path}" not found in scene data.`)
      return {}
    }
    return sceneValue
  }, [data, loading, error, path, hashString])

  return result
}
```

The hook supports three override modes:
1. **Full scene** (no path) — merges all hash params into a deep clone of the full scene data
2. **Exact match** — if a hash param matches the exact path, returns the param value directly
3. **Child overrides** — if hash params exist under the path prefix, deep clones the scene value and overlays the child overrides

Helper utilities `deepClone(val)` and `setByPath(obj, path, value)` support the override merging.

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

- `react` — `useContext`, `useMemo`, `useSyncExternalStore`
- [`src/storyboard/StoryboardContext.js`](../StoryboardContext.js.md) — `StoryboardContext`
- [`src/storyboard/core/dotPath.js`](../core/dotPath.js.md) — `getByPath`
- [`src/storyboard/core/session.js`](../core/session.js.md) — `getParam`, `getAllParams`

## Dependents

- [`src/storyboard/components/SceneDataDemo.jsx`](../components/SceneDataDemo.jsx.md) — uses `useSceneData()` to display user and navigation data
- [`src/pages/Repositories.jsx`](../../pages/Repositories.jsx) — uses `useSceneData()` to read repository data
- [`src/pages/SecurityAdvisory.jsx`](../../pages/SecurityAdvisory.jsx) — uses `useSceneData()` to read advisory data
- [`src/storyboard/index.js`](../index.js.md) — re-exports both hooks

## Notes

When a path is provided but not found, the hook returns an empty object `{}` (not `undefined`) and logs a warning. This prevents downstream destructuring errors while still surfacing the issue during development.

The hook uses `useSyncExternalStore` to subscribe to `hashchange` events on the `window`, ensuring React re-renders whenever hash params change. The `hashString` snapshot (the raw `window.location.hash`) is included in the `useMemo` dependency array, so overrides are recalculated on every hash change.
