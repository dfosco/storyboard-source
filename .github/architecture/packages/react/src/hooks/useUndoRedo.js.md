# `packages/react/src/hooks/useUndoRedo.js`

<!--
source: packages/react/src/hooks/useUndoRedo.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Exposes undo/redo controls for the override history stack. Every override write (via `useOverride`) pushes a snapshot to the history managed by [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md). This hook lets components navigate through that history.

## Composition

```js
export function useUndoRedo() {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  return {
    undo: useCallback(() => undo(), []),
    redo: useCallback(() => redo(), []),
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
```

## Dependencies

- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `undo`, `redo`, `canUndo`, `canRedo`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useUndoRedo`
