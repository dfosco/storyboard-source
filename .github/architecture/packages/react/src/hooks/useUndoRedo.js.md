# `packages/react/src/hooks/useUndoRedo.js`

<!--
source: packages/react/src/hooks/useUndoRedo.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Exposes undo/redo controls for the override history stack. Every override write (via [`useOverride`](./useOverride.js.md)) pushes a snapshot to a history stack managed by `@dfosco/storyboard-core`. This hook provides the navigation functions and availability flags for that stack.

## Composition

### Export: `useUndoRedo()`

Returns `{ undo, redo, canUndo, canRedo }`.

```js
export function useUndoRedo() {
  // Re-render on storage or hash changes
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  const handleUndo = useCallback(() => undo(), [])
  const handleRedo = useCallback(() => redo(), [])

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
```

- **`undo()`** / **`redo()`** — navigate the override history stack (delegated to core).
- **`canUndo`** / **`canRedo`** — boolean flags indicating whether navigation is possible. Evaluated at render time (not subscribed — they update when hash/storage changes trigger re-render).

## Dependencies

| Import | Source |
|--------|--------|
| `useCallback`, `useSyncExternalStore` | `react` |
| `undo`, `redo`, `canUndo`, `canRedo` | `@dfosco/storyboard-core` |
| `subscribeToStorage`, `getStorageSnapshot` | `@dfosco/storyboard-core` |
| `subscribeToHash`, `getHashSnapshot` | `@dfosco/storyboard-core` |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useUndoRedo` as public API |

## Notes

- `canUndo` and `canRedo` are computed during render, not via subscription. They become stale between re-renders but are recalculated whenever a hash or storage change triggers a re-render, which covers all cases where the history stack changes.
- This hook does **not** require `StoryboardContext` — it operates purely on the core module's history stack and external store subscriptions.
