# `packages/react/src/hooks/useRecordOverride.js`

<!--
source: packages/react/src/hooks/useRecordOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Convenience hook for overriding individual fields within a specific record entry. Constructs the full override path (`record.{recordName}.{entryId}.{field}`) and delegates to [`useOverride`](./useOverride.js.md).

## Composition

```js
export function useRecordOverride(recordName, entryId, field) {
  return useOverride(`record.${recordName}.${entryId}.${field}`)
}
```

Returns `[value, setValue, clearValue]` — same tuple as `useOverride`.

## Dependencies

- [`packages/react/src/hooks/useOverride.js`](./useOverride.js.md) — Delegates all behavior

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useRecordOverride`
