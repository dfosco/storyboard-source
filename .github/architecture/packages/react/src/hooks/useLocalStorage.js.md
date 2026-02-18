# `packages/react/src/hooks/useLocalStorage.js`

<!--
source: packages/react/src/hooks/useLocalStorage.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides persistent localStorage-based overrides on top of scene data. Unlike `useOverride` (which writes to the URL hash for ephemeral state), `useLocalStorage` persists values across page refreshes. Read priority is: URL hash param → localStorage → scene JSON default. Use for values that should survive refreshes (e.g., theme preference).

## Composition

```js
export function useLocalStorage(path) {
  // Requires StoryboardProvider context
  // Subscribe to both hash and localStorage for reactivity
  // Read priority: hash → localStorage → scene default
  const value = hashValue ?? localValue ?? sceneDefault
  const setValue = (newValue) => setLocal(path, newValue)
  const clearValue = () => removeLocal(path)
  return [value, setValue, clearValue]
}
```

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Reads scene data
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath`
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `getLocal`, `setLocal`, `removeLocal`, `subscribeToStorage`, `getStorageSnapshot`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useLocalStorage`
