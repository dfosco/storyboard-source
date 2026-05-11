# `packages/storyboard/src/internals/hooks/useLocalStorage.js`

<!--
source: packages/storyboard/src/internals/hooks/useLocalStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useLocalStorage` adds persistent, storage-backed overrides on top of flow data from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md). It is the durable counterpart to `useOverride`: URL hash values still win, but when the hash is absent the hook falls back to localStorage before returning the flow default.

That precedence makes the hook useful for preferences such as theme or panel state. The page can keep a stable default in the data file while still allowing per-browser persistence without mutating source JSON.

## Composition

```js
export function useLocalStorage(path) {
  const { data } = useContext(StoryboardContext)
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  useSyncExternalStore(subscribeToHash, getHashSnapshot)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  const hashValue = getParam(path)
  const localValue = getLocal(path)
  const value = hashValue !== null ? hashValue : (localValue !== null ? localValue : sceneDefault)

  return [value, setValue, clearValue]
}
```

- Signature: `useLocalStorage(path: string): [value, setValue, clearValue]`.
- Returns the resolved value, a setter that writes localStorage, and a clearer that removes the persistent override.
- Subscribes to both hash and storage snapshots.
- Re-renders when either source changes or when provider data changes; the resolved precedence is `hash → localStorage → flow default`.

## Dependencies

- Reads default flow data from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Uses dot-path helpers from [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) via the shared core index (`getByPath`).
- Reacts to hash changes coordinated by [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md) through `subscribeToHash`.

## Dependents

- `packages/storyboard/src/internals/hooks/useLocalStorage.test.js` verifies precedence, writes, clears, and provider requirements.

## Notes

- Unlike `useOverride`, writes never touch the URL.
