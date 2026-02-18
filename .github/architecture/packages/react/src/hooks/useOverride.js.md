# `packages/react/src/hooks/useOverride.js`

<!--
source: packages/react/src/hooks/useOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

The primary hook for reading and writing overrides on top of scene data. In normal mode, overrides live in the URL hash. In hide mode, they live in localStorage "shadow" keys. Every write also mirrors to the shadow so hide mode can hot-swap without data loss. This is the most commonly used hook in storyboard pages for making scene data interactive.

## Composition

```js
export function useOverride(path) {
  // Read priority depends on mode:
  // Normal: URL hash param → scene default
  // Hidden: shadow localStorage → scene default

  // Returns [value, setValue, clearValue]
}
```

- Uses `useSyncExternalStore` for both hash and localStorage reactivity
- `setValue` writes to hash (normal) or shadow (hidden), always mirrors to shadow
- `clearValue` removes from hash and/or shadow

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Reads scene data from context
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath` for scene defaults
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`, `setParam`, `removeParam`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`
- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `getShadow`, `setShadow`, `removeShadow`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports as `useOverride` and deprecated `useSession`
- [`packages/react/src/hooks/useRecordOverride.js`](./useRecordOverride.js.md) — Delegates to `useOverride` with a constructed path
- [`packages/react/src/hooks/useSession.js`](./useSession.js.md) — Re-exports as deprecated alias
