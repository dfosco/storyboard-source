# `packages/storyboard/src/core/session/hashSubscribe.js`

<!--
source: packages/storyboard/src/core/session/hashSubscribe.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tiny subscription bridge for reactive consumers that need to observe URL-hash changes. It isolates the browser event wiring used by `useSyncExternalStore`-style integrations.

## Composition

The file exports one subscribe function and one snapshot function:

```js
export function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function getHashSnapshot() {
  return window.location.hash
}
```

Together they provide the minimal external-store contract: subscribe for invalidation, then read the latest hash string.

## Dependencies

- Native `hashchange` events on `window`.
- `window.location.hash` as the snapshot source.

## Dependents

- [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md) listens for override changes.
- ``packages/storyboard/src/core/index.js`` re-exports both helpers.
- [`packages/storyboard/src/core/session/hashSubscribe.test.js`](./hashSubscribe.test.js.md) verifies event semantics.

## Notes

This module stays intentionally dumb: it does not parse params, debounce events, or inspect hide mode. That separation keeps it reusable across framework adapters.
