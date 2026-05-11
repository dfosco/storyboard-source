# `packages/storyboard/src/internals/hooks/useConfig.js`

<!--
source: packages/storyboard/src/internals/hooks/useConfig.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useConfig` is the React face of the unified configuration store. It lets components read either the full config tree or a single domain slice without knowing how the core store is implemented.

The hook stays intentionally thin: subscription happens through `useSyncExternalStore`, while actual reads defer to the core helpers. That keeps React-specific reactivity in this file and leaves config shape, persistence, and merging inside the core package.

## Composition

```js
export function useConfig(domain) {
  const snapshot = useSyncExternalStore(subscribeToConfig, getConfigSnapshot)
  return useCallback(() => getConfig(domain), [snapshot, domain])()
}
```

- Signature: `useConfig(domain?: string): object`.
- Returns the full config object when `domain` is omitted, or `getConfig(domain)` when a domain key is provided.
- Subscribes to the core config store with `useSyncExternalStore(subscribeToConfig, getConfigSnapshot)`.
- Re-renders whenever the config snapshot changes; the returned slice is recomputed when either the snapshot or `domain` changes.

## Dependencies

- [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) is part of the broader data system reference this hook lives alongside, though this hook talks directly to the config store via `../../core/index.js`.

## Dependents

- No direct internal consumers were found in this worktree; the hook is primarily a public React export.

## Notes

- Unlike data hooks, `useConfig` does not read [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) or the URL/hash helpers from [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).
