# `packages/core/src/hashSubscribe.js`

<!--
source: packages/core/src/hashSubscribe.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides shared helpers for subscribing to URL hash changes. These functions are designed to be compatible with React's `useSyncExternalStore`, enabling hooks to re-render when the URL hash updates. This is the reactivity bridge between the hash-based session state in [`packages/core/src/session.js`](./session.js.md) and React components.

## Composition

```js
export function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function getHashSnapshot() {
  return window.location.hash
}
```

## Dependencies

None — pure browser API usage.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports both functions
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Uses `subscribeToHash` for reactive hash reads
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Uses both for `useSyncExternalStore`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Uses both for reactive record override detection
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — Uses both for hash priority reads
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — Uses both for re-render on hash changes
