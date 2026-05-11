# `packages/storyboard/src/internals/hooks/useRecord.js`

<!--
source: packages/storyboard/src/internals/hooks/useRecord.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useRecord` and `useRecords` bring record collections into React from the data system. They resolve prototype-scoped record names, read route params with React Router, and merge runtime overrides before matching or returning entries.

This file is the record-specific counterpart to [`packages/storyboard/src/internals/hooks/useSceneData.js`](useSceneData.js.md): it preserves the same hash/shadow override model, but applies it to arrays of objects keyed by record ids.

## Composition

```js
export function useRecord(recordName, paramName = 'id') {
  const params = useParams()
  const prototypeName = useContext(StoryboardContext)?.prototypeName ?? null
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  return useMemo(() => {
    const resolvedName = resolveRecordName(prototypeName, recordName)
    const merged = applyRecordOverrides(loadRecord(resolvedName), resolvedName, recordName)
    return merged.find(e => e[paramName] === params[paramName]) ?? null
  }, [recordName, paramName, params[paramName], prototypeName, hashString, storageString])
}

export function useRecords(recordName) { /* returns full merged collection */ }
```

- Signatures: `useRecord(recordName: string, paramName = 'id')` and `useRecords(recordName: string)`.
- `useRecord` returns one matching entry or `null`; `useRecords` returns the full merged array or `[]` on failure.
- Both subscribe to hash and storage snapshots; `useRecord` also depends on route params from `useParams()`.
- Re-renders happen on param changes, prototype-scope changes, hash/storage changes, or provider changes that alter scope.

## Dependencies

- Reads `prototypeName` from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Loads and resolves record data through [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) (`loadRecord`, `resolveRecordName`).
- Consumes hash/shadow overrides coordinated with [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/hooks/useRecord.test.js` covers matching, missing data, override merges, hide mode, and scoped record prefixes.

## Notes

- Override merging can synthesize entirely new record entries by id, not just patch existing ones.
