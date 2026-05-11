# `packages/storyboard/src/internals/hooks/useUndoRedo.js`

<!--
source: packages/storyboard/src/internals/hooks/useUndoRedo.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useUndoRedo` exposes history navigation for override state. It is the React wrapper around the core undo stack that override writers populate when values change.

The hook is intentionally command-focused: it returns stable callbacks for undo and redo plus booleans that tell UI surfaces when those actions are currently valid.

## Composition

```js
export function useUndoRedo() {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  const handleUndo = useCallback(() => undo(), [])
  const handleRedo = useCallback(() => redo(), [])

  return { undo: handleUndo, redo: handleRedo, canUndo: canUndo(), canRedo: canRedo() }
}
```

- Signature: `useUndoRedo(): { undo, redo, canUndo, canRedo }`.
- Returns stable action callbacks and current history availability flags.
- Subscribes to both storage and hash snapshots because history state can be affected by either source.
- Re-renders when those snapshots change, then recomputes `canUndo()` and `canRedo()`.

## Dependencies

- Depends on the same hash lifecycle coordinated by [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/canvas/CanvasPage.jsx` uses the hook to surface undo/redo controls in canvas UI.
- `packages/storyboard/src/internals/hooks/useUndoRedo.test.js` verifies initial state and history transitions.

## Notes

- The hook does not own history snapshots; it only reflects and drives the core stack.
