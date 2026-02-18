# `packages/react/src/hooks/useRecordOverride.js`

<!--
source: packages/react/src/hooks/useRecordOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Thin convenience wrapper around [`useOverride`](./useOverride.js.md) that constructs the full dot-notation path for a specific record entry field. This hook simplifies the common pattern of overriding a single field on a known record entry, encoding the `record.{name}.{id}.{field}` convention so callers don't have to build it manually.

## Composition

### Export: `useRecordOverride(recordName, entryId, field)`

Returns the same `[value, setValue, clearValue]` tuple as `useOverride`.

```js
export function useRecordOverride(recordName, entryId, field) {
  return useOverride(`record.${recordName}.${entryId}.${field}`)
}
```

The constructed path (e.g. `record.posts.welcome-to-storyboard.title`) is passed directly to `useOverride`, which handles read/write, hide mode, and shadow localStorage.

## Dependencies

| Import | Source |
|--------|--------|
| `useOverride` | [`./useOverride.js`](./useOverride.js.md) |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useRecordOverride` as public API |
| `src/pages/issues/[id].jsx` | Overrides fields on individual issue entries |

## Notes

- The `field` parameter supports dot-notation for nested fields (e.g. `"author.name"`), which becomes `record.posts.my-id.author.name` in the hash.
