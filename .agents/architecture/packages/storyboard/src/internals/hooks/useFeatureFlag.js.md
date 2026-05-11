# `packages/storyboard/src/internals/hooks/useFeatureFlag.js`

<!--
source: packages/storyboard/src/internals/hooks/useFeatureFlag.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useFeatureFlag` exposes storage-backed feature flags to React components. It is intentionally tiny so flag evaluation logic stays centralized in the core layer while React components only deal with a boolean result.

This hook is used for capabilities that can change at runtime, such as opting in or out of behavior without rebuilding the app. Because the flags live in storage, the hook can react to changes made by UI controls, devtools, or other tabs.

## Composition

```js
export function useFeatureFlag(key) {
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  return getFlag(key)
}
```

- Signature: `useFeatureFlag(key: string): boolean`.
- Returns the resolved flag value for `key` without the `flag.` prefix.
- Subscribes to the storage snapshot only; there is no context dependency.
- Re-renders when storage changes, then re-evaluates `getFlag(key)` for the latest value.

## Dependencies

- Uses `getFlag`, `subscribeToStorage`, and `getStorageSnapshot` from `../../core/index.js` to bridge core feature flags into React.

## Dependents

- Exported for React consumers; no direct in-repo dependents were found in this worktree.

## Notes

- This hook is storage-driven, not flow-driven, so it does not depend on [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) or hash preservation in [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).
