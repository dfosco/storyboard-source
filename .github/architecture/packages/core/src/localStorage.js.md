# `packages/core/src/localStorage.js`

<!--
source: packages/core/src/localStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Provides a namespaced localStorage API for persistent storyboard overrides. All keys are automatically prefixed with `"storyboard:"` to avoid collisions with other application data. Mirrors the API shape of [`session.js`](./session.js.md) (URL hash) but persists values across page reloads and browser sessions.

Includes a reactivity layer with both cross-tab (native `storage` event) and intra-tab (custom `storyboard-storage` event) change notifications, plus a `useSyncExternalStore`-compatible snapshot function for React integration.

## Composition

### Exports — CRUD

| Export | Type | Description |
|--------|------|-------------|
| `getLocal(key)` | `(string) → string \| null` | Read a value (key is auto-prefixed) |
| `setLocal(key, value)` | `(string, string) → void` | Write a value and notify listeners |
| `removeLocal(key)` | `(string) → void` | Remove a key and notify listeners |
| `getAllLocal()` | `() → Record<string, string>` | All storyboard entries (keys returned without prefix) |

### Exports — Reactivity

| Export | Type | Description |
|--------|------|-------------|
| `subscribeToStorage(callback)` | `(fn) → unsubscribe` | Subscribe to changes (cross-tab + intra-tab) |
| `getStorageSnapshot()` | `() → string` | Serialized snapshot of all entries (for `useSyncExternalStore`) |
| `notifyChange()` | `() → void` | Fire intra-tab custom event and invalidate snapshot cache |

### Reactivity model

```
setLocal('foo', 'bar')
  └── localStorage.setItem('storyboard:foo', 'bar')
  └── notifyChange()
        └── invalidateSnapshotCache()  // next getStorageSnapshot() recomputes
        └── window.dispatchEvent('storyboard-storage')  // intra-tab listeners

Other tab writes to localStorage:
  └── native 'storage' event fires automatically
  └── subscribeToStorage callback runs
```

### Key prefix

```js
const PREFIX = 'storyboard:'
// getLocal('theme') → localStorage.getItem('storyboard:theme')
```

### Snapshot caching

`getStorageSnapshot()` caches a sorted, serialized string of all `storyboard:` entries. The cache is invalidated on every `notifyChange()` call and on every `storage`/`storyboard-storage` event received by subscribers.

## Dependencies

None (leaf module — uses only the browser `localStorage` and `window` APIs).

## Dependents

| File | How |
|------|-----|
| [`packages/core/src/index.js`](./index.js.md) | Re-exports `getLocal`, `setLocal`, `removeLocal`, `getAllLocal`, `subscribeToStorage`, `getStorageSnapshot` |
| [`packages/core/src/hideMode.js`](./hideMode.js.md) | Imports `getLocal`, `setLocal`, `removeLocal`, `notifyChange` — the primary consumer for history stack and hide flag storage |
| [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) | Imports `getLocal`, `setLocal`, `removeLocal`, `subscribeToStorage`, `getStorageSnapshot` |
| [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) | Imports `subscribeToStorage`, `getStorageSnapshot` for reactivity |
| [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) | Imports `subscribeToStorage`, `getStorageSnapshot` for reactivity |
| [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) | Imports `subscribeToStorage`, `getStorageSnapshot` for reactivity |
| [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) | Imports `subscribeToStorage`, `getStorageSnapshot` for reactivity |

## Notes

- All CRUD operations are wrapped in try/catch and silently degrade if `localStorage` is unavailable (e.g., in incognito mode with storage disabled, or when quota is exceeded).
- The native `storage` event does **not** fire in the tab that made the change — that's why `notifyChange()` dispatches a custom `storyboard-storage` event for intra-tab reactivity.
- `getStorageSnapshot()` produces a deterministic string by sorting entries, making it safe for `useSyncExternalStore`'s equality check.
