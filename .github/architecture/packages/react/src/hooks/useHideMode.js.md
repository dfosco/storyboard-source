# `packages/react/src/hooks/useHideMode.js`

<!--
source: packages/react/src/hooks/useHideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook for reading and controlling hide mode. Hide mode moves all URL hash overrides into localStorage so the URL stays clean — useful when sharing storyboards with customers. The hook re-renders automatically when hide mode changes via `useSyncExternalStore` on localStorage.

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

## Dependencies

- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `activateHideMode`, `deactivateHideMode`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useHideMode`
