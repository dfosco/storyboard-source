# `packages/core/src/hashSubscribe.js`

<!--
source: packages/core/src/hashSubscribe.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides a minimal subscription API for URL hash changes, designed to integrate with React's `useSyncExternalStore`. When hash-based session params change (see [`session.js`](./session.js.md)), this module allows React hooks to subscribe and re-render reactively. The API is intentionally framework-agnostic — any reactive framework can use `subscribeToHash` with a callback pattern.

## Composition

### Exports

| Function | Signature | Purpose |
|----------|-----------|---------|
| `subscribeToHash` | `(callback: () → void) → () → void` | Adds a `hashchange` event listener and returns a cleanup function that removes it. Matches the `subscribe` signature expected by `useSyncExternalStore`. |
| `getHashSnapshot` | `() → string` | Returns `window.location.hash`. Serves as the `getSnapshot` function for `useSyncExternalStore`. |

### Implementation

```js
export function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function getHashSnapshot() {
  return window.location.hash
}
```

The pattern is intentionally simple: one event listener, one snapshot. React hooks combine these with `useSyncExternalStore` to get tear-free reads of hash-based session state.

## Dependencies

None — uses only browser globals (`window.addEventListener`, `window.location.hash`).

## Dependents

**Direct (internal) import:**

- [`packages/core/src/index.js`](./index.js.md) — re-exports `subscribeToHash`, `getHashSnapshot`

**Indirect consumers** (via `@dfosco/storyboard-core` barrel):

- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — `subscribeToHash`, `getHashSnapshot` (used with `useSyncExternalStore` to reactively apply hash overrides to scene data)
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — `subscribeToHash` (re-renders when override params change)
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — `subscribeToHash`, `getHashSnapshot` (re-renders when record overrides change)
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — `subscribeToHash`, `getHashSnapshot` (re-renders when hash-based param keys change)
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — `subscribeToHash`, `getHashSnapshot` (re-renders undo/redo state on hash changes)

## Notes

- This module is the bridge between the imperative hash writes in [`session.js`](./session.js.md) and React's declarative rendering model. Without it, React components would not know when hash params change.
- The `subscribe` / `getSnapshot` pair follows the exact contract of `React.useSyncExternalStore`, making integration trivial and tear-free.
