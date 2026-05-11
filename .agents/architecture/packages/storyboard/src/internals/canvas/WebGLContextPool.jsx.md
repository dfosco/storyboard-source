# `packages/storyboard/src/internals/canvas/WebGLContextPool.jsx`

<!--
source: packages/storyboard/src/internals/canvas/WebGLContextPool.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/WebGLContextPool.jsx`](./WebGLContextPool.jsx.md) solves a browser resource problem: terminal-like widgets cannot all keep live WebGL contexts at once. The file implements a lease-based pool that decides which terminal, agent, and prompt widgets stay live and which should degrade to snapshots based on viewport visibility, selection, and expanded state.

## Composition

```jsx
export const Priority = {
  OFFSCREEN: 0,
  NEAR_VIEWPORT: 1,
  VISIBLE: 2,
  PINNED: 3,
}
```

```jsx
class ContextPool {
  register(widgetId, initialPriority = Priority.OFFSCREEN) { … }
  unregister(widgetId) { … }
  setPriority(widgetId, priority) { … }
  _recompute() {
    const entries = [...this._slots.entries()]
    entries.sort(([, a], [, b]) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return b.lastVisible - a.lastVisible
    })
    …
  }
}
```

```jsx
export function useWebGLSlot(widgetId, initialPriority) {
  const pool = useContext(WebGLPoolContext)
  useEffect(() => {
    if (!pool) return
    pool.register(widgetId, initialPriority)
    return () => pool.unregister(widgetId)
  }, [pool, widgetId])
  …
}
```

```jsx
export function usePoolVisibilityUpdater() {
  return useCallback((viewportRect, widgets, selectedIds, expandedId) => {
    …
    pool.setPriority(w.id, near ? Priority.NEAR_VIEWPORT : Priority.OFFSCREEN)
  }, [pool])
}
```

## Dependencies

- React context and `useSyncExternalStore`.
- Viewport/widget state supplied by [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md).

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) provides the pool and drives viewport updates.
- `packages/storyboard/src/internals/canvas/widgets/TerminalWidget.jsx` and `PromptWidget.jsx` lease slots from it.
- `WebGLContextPool.test.jsx` validates priority and eviction behavior.

## Notes

- Pinned widgets bypass the nominal cap, and generation tokens guard against stale async terminal opens after eviction.
