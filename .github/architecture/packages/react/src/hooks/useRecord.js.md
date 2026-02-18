# `packages/react/src/hooks/useRecord.js`

<!--
source: packages/react/src/hooks/useRecord.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides hooks for loading record collections (`.record.json` files) with URL-hash override support. Records power dynamic routes — a `posts.record.json` file paired with `pages/posts/[id].jsx` gives each entry its own URL. Hash overrides can modify fields on existing entries or create entirely new entries from the URL alone.

## Composition

### Internal: `applyRecordOverrides(baseRecords, recordName)`

Collects hash params matching `record.{recordName}.{entryId}.{field}` and merges them into a deep-cloned copy of the base records array. Unknown entry IDs create new entries appended to the array.

```js
function applyRecordOverrides(baseRecords, recordName) {
  const allParams = getAllParams()
  const prefix = `record.${recordName}.`
  const overrideKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))
  if (overrideKeys.length === 0) return baseRecords

  const records = deepClone(baseRecords)
  // Group overrides by entryId, merge into existing or create new entries
  return records
}
```

### Export: `useRecord(recordName, paramName = 'id')`

Loads a **single** record entry matched by URL route param. The `paramName` serves double duty: it's the route param name and the record field to match against.

```js
export function useRecord(recordName, paramName = 'id') {
  const params = useParams()
  const paramValue = params[paramName]
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)

  return useMemo(() => {
    const base = loadRecord(recordName)
    const merged = applyRecordOverrides(base, recordName)
    return merged.find(e => e[paramName] === paramValue) ?? null
  }, [recordName, paramName, paramValue, hashString])
}
```

### Export: `useRecords(recordName)`

Loads **all** entries from a record collection with overrides applied.

```js
export function useRecords(recordName) {
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  return useMemo(() => {
    const base = loadRecord(recordName)
    return applyRecordOverrides(base, recordName)
  }, [recordName, hashString])
}
```

## Dependencies

| Import | Source |
|--------|--------|
| `useMemo`, `useSyncExternalStore` | `react` |
| `useParams` | `react-router-dom` |
| `loadRecord` | `@dfosco/storyboard-core` |
| `deepClone`, `setByPath` | `@dfosco/storyboard-core` |
| `getAllParams` | `@dfosco/storyboard-core` |
| `subscribeToHash`, `getHashSnapshot` | `@dfosco/storyboard-core` |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useRecord` and `useRecords` as public API |
| `src/pages/issues/index.jsx` | `useRecords('issues')` for issue list |
| `src/pages/issues/[id].jsx` | `useRecord('issues')` for single issue |
| `src/pages/posts/index.jsx` | `useRecords('posts')` for post list |
| `src/pages/posts/[id].jsx` | `useRecord('posts')` for single post |

## Notes

- Override keys must follow the convention `record.{name}.{entryId}.{field}` — keys without a field path (no dot after the entry ID) are silently skipped.
- Errors in `loadRecord` are caught and logged; `useRecord` returns `null` and `useRecords` returns `[]` on failure.
- Both hooks re-render on every hash change via `useSyncExternalStore`, not just when relevant params change.
