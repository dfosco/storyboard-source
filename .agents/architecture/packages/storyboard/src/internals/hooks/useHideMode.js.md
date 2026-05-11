# `packages/storyboard/src/internals/hooks/useHideMode.js`

<!--
source: packages/storyboard/src/internals/hooks/useHideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useHideMode` is the small React API for toggling hide mode. Hide mode keeps override state out of the visible URL by moving it into localStorage-backed shadow keys, which makes demos and shared links cleaner.

The hook does not own the migration logic itself. Instead, it subscribes to the storage snapshot and delegates all real work to core helpers so every other override hook can treat hide mode as infrastructure.

## Composition

```js
export function useHideMode() {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  const isHidden = isHideMode()
  const hide = useCallback(() => activateHideMode(), [])
  const show = useCallback(() => deactivateHideMode(), [])
  return { isHidden, hide, show }
}
```

- Signature: `useHideMode(): { isHidden: boolean, hide: () => void, show: () => void }`.
- Returns current hide state plus imperative `hide()` and `show()` callbacks.
- Subscribes to storage because the mode flag lives outside React state.
- Re-renders whenever the storage snapshot changes; the callbacks remain stable.

## Dependencies

- Uses core hide-mode helpers and storage subscriptions from `../../core/index.js`.

## Dependents

- `packages/storyboard/src/internals/hooks/useHideMode.test.js` covers the public contract and state transitions.

## Notes

- The shadow data read by other hooks is preserved across navigation by cooperating with the URL behavior documented in [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).
