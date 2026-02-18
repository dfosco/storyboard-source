# `packages/core/src/localStorage.js`

<!--
source: packages/core/src/localStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides localStorage utilities for persistent storyboard overrides. Mirrors the [`packages/core/src/session.js`](./session.js.md) (URL hash) API but persists values in localStorage. All keys are prefixed with `"storyboard:"` to avoid collisions. Supports both cross-tab reactivity (native `storage` event) and intra-tab reactivity (custom `storyboard-storage` event), since the native `storage` event does not fire in the tab that made the change.

## Composition

```js
export function getLocal(key)          // Read a value (prefixed automatically)
export function setLocal(key, value)   // Write + notify listeners
export function removeLocal(key)       // Remove + notify listeners
export function getAllLocal()           // All storyboard entries (prefix stripped)
export function subscribeToStorage(cb) // Subscribe to both cross-tab and intra-tab changes
export function getStorageSnapshot()   // Serialized snapshot for useSyncExternalStore
export function notifyChange()         // Fire custom intra-tab event
```

The snapshot is cached and invalidated on writes/events for performance. `subscribeToStorage` is compatible with React's `useSyncExternalStore`.

## Dependencies

None — pure browser API usage (localStorage, window events).

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — Imports `getLocal`, `setLocal`, `removeLocal`, `notifyChange` for history state
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Imports `subscribeToStorage`, `getStorageSnapshot`
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Imports `subscribeToStorage`, `getStorageSnapshot`
- [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) — Imports `subscribeToStorage`, `getStorageSnapshot`
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — Imports all CRUD + subscription functions
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — Imports `subscribeToStorage`, `getStorageSnapshot`
