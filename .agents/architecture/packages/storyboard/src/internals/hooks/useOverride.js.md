# `packages/storyboard/src/internals/hooks/useOverride.js`

<!--
source: packages/storyboard/src/internals/hooks/useOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useOverride` is the central React API for writable storyboard state. It reads a value from the URL hash or hide-mode shadow storage, falls back to provider data from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) when available, and returns setters that update the correct backing store.

Because overrides are the main way Storyboard keeps state in sharable URLs, this hook is a key boundary between the React layer and the hash/storage system. Other hooks build on the same conventions, but `useOverride` is the direct read/write primitive.

## Composition

```js
export function useOverride(path) {
  const data = useContext(StoryboardContext)?.data
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  const getHashSnap = useCallback(() => getParam(path), [path])
  const hashValue = useSyncExternalStore(subscribeToHash, getHashSnap)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  const value = isHideMode()
    ? (getShadow(path) ?? sceneDefault)
    : (hashValue ?? sceneDefault)

  return [value, setValue, clearValue]
}
```

- Signature: `useOverride(path: string): [value, setValue, clearValue]`.
- Returns the resolved value, a setter, and a clearer.
- Subscribes to both hash and storage snapshots so normal mode and hide mode stay reactive.
- Re-renders when `path`, hash state, storage state, or provider data changes.

## Dependencies

- Optionally reads flow defaults from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Uses path helpers from [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) through the shared core index (`getByPath`).
- Depends on the hash/shadow system preserved across navigation by [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/canvas/widgets/PrototypeEmbed.jsx` reads writable embed state through this hook.
- `packages/storyboard/src/internals/canvas/widgets/TerminalWidget.jsx` uses it for widget-level overrides.
- `packages/storyboard/src/internals/hooks/useOverride.test.js` verifies tuple shape, fallback behavior, writes, clears, and provider-free usage.

## Notes

- In normal mode every write mirrors into shadow storage so hide mode can be toggled without losing edits.
