# `packages/react/src/hooks/useSceneData.js`

<!--
source: packages/react/src/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The primary data-access hook for storyboard pages. `useSceneData` resolves a dot-notation path against the current scene's JSON data, with hash-param overrides merged on top. It is the main way page components read prototype data and is used extensively throughout the app.

The hook also supports **hide mode**: when `?hide` is active, overrides are read from shadow localStorage instead of the URL hash, keeping the URL clean during presentations.

## Composition

### Export: `useSceneData(path?)`

Returns the resolved value at the given path, or the entire scene object if no path is provided.

```js
export function useSceneData(path) {
  const { data, loading, error } = useContext(StoryboardContext)

  // Subscribe to hash and localStorage changes for reactivity
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    if (loading || error || data == null) return undefined

    const hidden = isHideMode()
    const readParam = hidden ? getShadow : getParam
    const readAllParams = hidden ? getAllShadows : getAllParams

    if (!path) {
      // No path → full scene data with all overrides merged
      const allParams = readAllParams()
      if (Object.keys(allParams).length === 0) return data
      const merged = deepClone(data)
      for (const key of Object.keys(allParams)) setByPath(merged, key, allParams[key])
      return merged
    }

    // Exact match check
    const exact = readParam(path)
    if (exact !== null) return exact

    // Child overrides: params nested under this path
    const prefix = path + '.'
    const allParams = readAllParams()
    const childKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))

    const sceneValue = getByPath(data, path)

    if (childKeys.length > 0 && sceneValue !== undefined) {
      const merged = deepClone(sceneValue)
      for (const key of childKeys) setByPath(merged, key.slice(prefix.length), allParams[key])
      return merged
    }

    if (sceneValue === undefined) {
      console.warn(`[useSceneData] Path "${path}" not found in scene data.`)
      return {}
    }

    return sceneValue
  }, [data, loading, error, path, hashString, storageString])
}
```

**Override resolution:**
1. Exact hash param match for the path → return the override value directly.
2. Child hash params (e.g. `user.name` when path is `user`) → deep-clone scene value and merge overrides.
3. No overrides → return scene value as-is.
4. Path not found → warn and return `{}`.

### Export: `useSceneLoading()`

Returns `true` while scene data is still loading from the loader.

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

| Import | Source |
|--------|--------|
| `useContext`, `useMemo`, `useSyncExternalStore` | `react` |
| `StoryboardContext` | [`../StoryboardContext.js`](../StoryboardContext.js.md) |
| `getByPath`, `deepClone`, `setByPath` | `@dfosco/storyboard-core` |
| `getParam`, `getAllParams` | `@dfosco/storyboard-core` |
| `subscribeToHash`, `getHashSnapshot` | `@dfosco/storyboard-core` |
| `isHideMode`, `getShadow`, `getAllShadows` | `@dfosco/storyboard-core` |
| `subscribeToStorage`, `getStorageSnapshot` | `@dfosco/storyboard-core` |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useSceneData` and `useSceneLoading` as public API |
| `src/pages/issues/index.jsx` | Reads issue list scene data |
| `src/pages/issues/[id].jsx` | Reads individual issue scene data |
| `src/pages/SecurityAdvisory.jsx` | Reads advisory page data |
| `src/pages/Dashboard.jsx` | Reads dashboard page data |
| `src/pages/Repositories.jsx` | Reads repository list data |

## Notes

- When no path is provided and there are no overrides, the raw `data` object is returned directly (no clone), which is safe because scene data is treated as read-only by convention.
- When there **are** overrides but no path, the entire scene object is deep-cloned and all override params are merged — this can be expensive for large scenes.
- Returns `undefined` during loading, `{}` for missing paths (with a `console.warn`).
