# `packages/react/src/hooks/useRecord.js`

<!--
source: packages/react/src/hooks/useRecord.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides hooks for loading record collections with hash override support. `useRecord` loads a single entry matched by URL param (for dynamic routes like `[id].jsx`). `useRecords` loads all entries. Both apply hash overrides — existing entries can be modified and new entries created entirely from URL hash params using the convention `record.{name}.{entryId}.{field}=value`.

## Composition

**`useRecord(recordName, paramName = 'id')`** — Loads a single record entry matched by the URL param. The `paramName` is both the route param to read and the entry field to match against.

**`useRecords(recordName)`** — Loads all entries from a record collection with overrides applied.

Internal helper `applyRecordOverrides(baseRecords, recordName)`:
```js
// Hash convention: record.{recordName}.{entryId}.{field}=value
// Existing entries get fields merged; unknown ids create new entries
function applyRecordOverrides(baseRecords, recordName) {
  const allParams = getAllParams()
  const prefix = `record.${recordName}.`
  // ... groups by entryId, merges or creates entries
}
```

## Dependencies

- [`packages/core/src/loader.js`](../../../core/src/loader.js.md) — `loadRecord`
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `deepClone`, `setByPath`
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getAllParams`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot`
- `react-router-dom` — `useParams` for URL param reading

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useRecord` and `useRecords`
