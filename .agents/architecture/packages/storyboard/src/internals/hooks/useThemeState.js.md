# `packages/storyboard/src/internals/hooks/useThemeState.js`

<!--
source: packages/storyboard/src/internals/hooks/useThemeState.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useThemeState` and `useThemeSyncTargets` are React subscriptions over the global storyboard theme stores. They expose theme selection and theme-follow settings to components without requiring those components to understand the store implementation.

The file uses `useSyncExternalStore` directly against the store subscribe methods, which makes it a clean boundary between the core theme state and React rendering behavior.

## Composition

```js
export function useThemeState() {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeSnapshot)
}

export function useThemeSyncTargets() {
  return useSyncExternalStore(subscribeSyncTargets, getSyncSnapshot, getSyncSnapshot)
}
```

- Signatures: `useThemeState()` and `useThemeSyncTargets()`.
- `useThemeState` returns `{ theme, resolved }`; `useThemeSyncTargets` returns `{ prototype, toolbar, codeBoxes, canvas }`.
- Each hook subscribes to its respective core store.
- Re-renders happen whenever the subscribed store publishes a new snapshot.

## Dependencies

- Uses `themeState` and `themeSyncState` from `../../core/index.js`.

## Dependents

- `packages/storyboard/src/internals/hooks/useThemeState.test.js` checks default state and reactive updates for both hooks.

## Notes

- The module caches the latest store snapshot outside React so `useSyncExternalStore` can synchronously read it on render.
