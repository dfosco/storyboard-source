# `packages/storyboard/src/core/comments/commentCache.test.js`

<!--
source: packages/storyboard/src/core/comments/commentCache.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This test suite verifies the route cache behavior used by comment pins. It focuses on expiry, clearing, per-route isolation, and corrupted localStorage handling.

## Composition

Each test manipulates localStorage directly or through the exported helpers from [`packages/storyboard/src/core/comments/commentCache.js`](./commentCache.js.md).

```js
it('returns null for expired cache', () => {
  const data = { id: 'D_1', comments: [] }
  localStorage.setItem('sb-comments:/Overview', JSON.stringify({
    ts: Date.now() - 3 * 60 * 1000,
    data,
  }))
  expect(getCachedComments('/Overview')).toBeNull()
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/commentCache.js`](./commentCache.js.md) — Provides the cache functions under test.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; Vitest uses this file to guard [`packages/storyboard/src/core/comments/commentCache.js`](./commentCache.js.md).
