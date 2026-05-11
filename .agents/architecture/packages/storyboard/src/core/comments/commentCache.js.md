# `packages/storyboard/src/core/comments/commentCache.js`

<!--
source: packages/storyboard/src/core/comments/commentCache.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module provides lightweight localStorage caching around route comment summaries and failed submissions. It lets comment pins render quickly on repeat visits and preserves comments that failed to submit so the UI can retry or dismiss them.

## Composition

The first half manages a short-lived per-route cache with a two-minute TTL. The second half maintains an append-or-replace queue of pending comments keyed by route.

```js
export function getCachedComments(route) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + route)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + route)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}
```

## Dependencies

This file has no significant module imports beyond platform globals such as `fetch`, `localStorage`, or the test runner.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports cache helpers.
- `packages/storyboard/src/core/comments/ui/mount.js` — Bootstraps cached pins and pending comments.
- [`packages/storyboard/src/core/comments/commentCache.test.js`](./commentCache.test.js.md) — Verifies TTL and route isolation.

## Notes

Both caches fail open: malformed JSON, unavailable storage, or quota issues collapse to empty results instead of breaking the UI.
