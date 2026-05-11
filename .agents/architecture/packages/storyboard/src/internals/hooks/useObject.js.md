# `packages/storyboard/src/internals/hooks/useObject.js`

<!--
source: packages/storyboard/src/internals/hooks/useObject.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useObject` loads an object data file directly, then layers runtime overrides on top. It is the object-oriented companion to flow reading: instead of consuming the already-loaded provider data from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md), it resolves an object name against prototype scope and asks the data loader for the source object.

This hook is where object override semantics are defined for React consumers. It supports full-object reads, dot-path reads, scoped and unscoped override prefixes, and hide-mode shadow reads without exposing those low-level details to components.

## Composition

```js
export function useObject(objectName, path) {
  const prototypeName = useContext(StoryboardContext)?.prototypeName ?? null
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    const resolvedName = resolveObjectName(prototypeName, objectName)
    let data = loadObject(resolvedName)
    // merge object.{name}.* overrides, then optional sub-path reads
    return path ? getByPath(data, path) : data
  }, [objectName, prototypeName, path, hashString, storageString])
}
```

- Signature: `useObject(objectName: string, path?: string): any`.
- Returns the full object, a path value, or `undefined` when the object/path cannot be resolved.
- Subscribes to both hash and storage snapshots because overrides can come from the URL or hide-mode shadow storage.
- Re-renders when object name, prototype scope, path, hash snapshot, or storage snapshot changes.

## Dependencies

- Reads `prototypeName` from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) to resolve scoped object names.
- Loads source objects through [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) (`loadObject`, `resolveObjectName`, `getByPath`).
- Reads URL and shadow overrides through the hash/storage plumbing related to [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/hooks/useObject.test.js` exercises object loading, path reads, override merging, cloning, and hide mode.

## Notes

- Full-object reads deep-clone only when overrides exist, which keeps the no-override path cheap while protecting source data from accidental mutation after merges.
