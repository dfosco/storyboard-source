# `src/storyboard/hooks/useRecord.js`

<!--
source: src/storyboard/hooks/useRecord.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Provides two React hooks for accessing record data from `*.record.json` files. Records are arrays of objects with an `id` field, designed to power dynamic routes (e.g., `/posts/[slug]`). The `useRecord()` hook matches a single entry by URL route param, while `useRecords()` returns the full collection for list pages.

These hooks are the primary consumer-facing API for the record system, wrapping the lower-level [`loadRecord()`](../core/loader.js.md) and [`findRecord()`](../core/loader.js.md) functions with React integration and memoization.

## Composition

**`useRecord(recordName, paramName)`** — loads a single record entry matched by a URL route parameter:

```js
export function useRecord(recordName, paramName) {
  const params = useParams()
  const paramValue = params[paramName]

  return useMemo(() => {
    if (!paramValue) return null
    try {
      return findRecord(recordName, paramValue)
    } catch (err) {
      console.error(`[useRecord] ${err.message}`)
      return null
    }
  }, [recordName, paramValue])
}
```

Usage in a dynamic route page:

```jsx
// In pages/posts/[slug].jsx:
const post = useRecord('posts', 'slug')
// URL /posts/welcome → finds entry with id "welcome" in posts.record.json
```

**`useRecords(recordName)`** — loads all entries from a record collection:

```js
export function useRecords(recordName) {
  return useMemo(() => {
    try {
      return loadRecord(recordName)
    } catch (err) {
      console.error(`[useRecords] ${err.message}`)
      return []
    }
  }, [recordName])
}
```

Both hooks are memoized via `useMemo` and fail gracefully — errors are logged to the console and the hooks return `null` or `[]` respectively.

## Dependencies

- `react` — `useMemo`
- `react-router-dom` — `useParams` for reading URL route parameters
- [`src/storyboard/core/loader.js`](../core/loader.js.md) — `findRecord`, `loadRecord`

## Dependents

- [`src/storyboard/index.js`](../index.js.md) — re-exports `useRecord` and `useRecords` as public API
- `src/pages/posts/[slug].jsx` — uses `useRecord('posts', 'slug')` for dynamic post pages
- `src/pages/posts/index.jsx` — uses `useRecords('posts')` for the post listing page

## Notes

- Both hooks are synchronous despite record data being bundled at build time through the [`storyboardData()`](../vite/data-plugin.js.md) Vite plugin. The underlying `loadRecord()` and `findRecord()` calls parse the pre-bundled raw strings synchronously.
- `useRecord()` returns `null` if the param is not present in the URL or if no matching entry is found — consumers should handle the null case.
- `useRecords()` returns an empty array on error, making it safe to use directly in `.map()` calls.
