# `packages/react/src/hooks/useHideMode.js`

<!--
source: packages/react/src/hooks/useHideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

React hook that exposes hide mode — a feature that moves all URL hash overrides into `localStorage` so the URL stays clean. This is useful when sharing storyboard prototypes with stakeholders who shouldn't see raw hash-encoded state in their address bar.

## Composition

### `useHideMode()`

Returns an object with three properties:

```js
const { isHidden, hide, show } = useHideMode()
```

| Property | Type | Description |
|----------|------|-------------|
| `isHidden` | `boolean` | `true` when hide mode is currently active |
| `hide` | `() => void` | Activates hide mode — copies hash overrides to localStorage and cleans the URL |
| `show` | `() => void` | Deactivates hide mode — restores overrides from localStorage back to the URL hash |

### Reactivity

The hook subscribes to localStorage changes via `useSyncExternalStore`:

```js
useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
```

This ensures the component re-renders whenever any other code (including other tabs or the hide-mode toggle itself) modifies the storage-backed hide flag.

### Implementation

```js
export function useHideMode() {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  const isHidden = isHideMode()

  const hide = useCallback(() => { activateHideMode() }, [])
  const show = useCallback(() => { deactivateHideMode() }, [])

  return { isHidden, hide, show }
}
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `react` | `useCallback`, `useSyncExternalStore` |
| `@dfosco/storyboard-core` | `isHideMode`, `activateHideMode`, `deactivateHideMode` — hide mode state management |
| `@dfosco/storyboard-core` | `subscribeToStorage`, `getStorageSnapshot` — external store for localStorage reactivity |

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports `useHideMode` as part of the public API

## Notes

- `useSyncExternalStore` is used instead of `useEffect` + `useState` to avoid tearing — the hook reads the current hide-mode state synchronously during render, which is important for concurrent React features.
- The `hide` and `show` callbacks are memoized with `useCallback` and stable (empty dependency arrays), so they're safe to pass to child components without causing unnecessary re-renders.
