# `packages/react/src/hooks/useLocalStorage.js`

<!--
source: packages/react/src/hooks/useLocalStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides a React hook for persistent localStorage-backed overrides on top of scene data. Unlike [`useOverride`](./useOverride.js.md) which writes to the ephemeral URL hash, `useLocalStorage` writes to `localStorage` so values survive page refreshes — ideal for preferences like theme selection.

The read priority chain is **URL hash param → localStorage → scene JSON default → `undefined`**, giving the URL hash the final say for shareability while still persisting user choices locally.

## Composition

### Export: `useLocalStorage(path)`

Returns a tuple `[value, setValue, clearValue]`.

```js
export function useLocalStorage(path) {
  // Reads StoryboardContext for scene data
  const { data } = useContext(StoryboardContext)
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  // Subscribes to both hash and localStorage for reactivity
  useSyncExternalStore(subscribeToHash, getHashSnapshot)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  // Read priority: hash → localStorage → scene default
  const hashValue = getParam(path)
  const localValue = getLocal(path)
  const value = hashValue !== null ? hashValue : (localValue !== null ? localValue : sceneDefault)

  const setValue = useCallback((newValue) => setLocal(path, newValue), [path])
  const clearValue = useCallback(() => removeLocal(path), [path])

  return [value, setValue, clearValue]
}
```

- **`setValue(newValue)`** — writes to localStorage only (not the URL hash).
- **`clearValue()`** — removes the localStorage key, reverting to scene default.

## Dependencies

| Import | Source |
|--------|--------|
| `useCallback`, `useContext`, `useSyncExternalStore` | `react` |
| `StoryboardContext` | [`../StoryboardContext.js`](../StoryboardContext.js.md) |
| `getByPath` | `@dfosco/storyboard-core` |
| `getParam` | `@dfosco/storyboard-core` |
| `getLocal`, `setLocal`, `removeLocal`, `subscribeToStorage`, `getStorageSnapshot` | `@dfosco/storyboard-core` |
| `subscribeToHash`, `getHashSnapshot` | `@dfosco/storyboard-core` |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useLocalStorage` as public API |

## Notes

- The hook throws if used outside a `<StoryboardProvider>`.
- Unlike [`useOverride`](./useOverride.js.md), this hook does **not** participate in hide mode or shadow localStorage — it reads/writes plain localStorage keys directly.
