# `packages/storyboard/src/internals/hooks/useSceneData.js`

<!--
source: packages/storyboard/src/internals/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useFlowData` is the primary React read hook for storyboard flow data. It consumes provider state from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md), then overlays runtime overrides from the URL hash or hide-mode shadow storage.

This file is the main bridge between the data system and React rendering. Components can read the whole flow, a nested path, or a loading boolean, while the hook hides the complexity of deep override merging and the older scene-based API aliases.

## Composition

```js
export function useFlowData(path, opts) {
  const { data, loading, error } = useContext(StoryboardContext)
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    if (loading || error || data == null) return undefined
    // exact override, child override merge, or base flow value
    return path ? getByPath(data, path) : data
  }, [data, loading, error, path, hashString, storageString])
}

export function useFlowLoading() {
  return useContext(StoryboardContext).loading
}
```

- Signatures: `useFlowData(path?: string, opts?: { optional?: boolean })`, `useFlowLoading()`, plus deprecated aliases `useSceneData` and `useSceneLoading`.
- `useFlowData` returns a whole flow object, a path value, `{}` for missing paths after load, or `undefined` while loading/erroring. `useFlowLoading` returns `boolean`.
- Subscribes to hash and storage snapshots so overrides stay reactive.
- Re-renders when provider data/loading/error changes, when `path` changes, or when hash/storage snapshots change.

## Dependencies

- Reads provider data from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Uses shared data helpers from [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) (`getByPath`, deep path merging helpers).
- Integrates with the hash/shadow behavior preserved across navigation by [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/hooks/useSceneData.test.js` verifies whole-flow reads, path reads, warnings, override merges, loading state, and deprecated aliases.

## Notes

- When `opts?.optional` is set, missing-path warnings are suppressed so pages can probe partial data safely.
