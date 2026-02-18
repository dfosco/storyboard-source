# `packages/react/src/hooks/useSceneData.js`

<!--
source: packages/react/src/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides read-only access to scene data by dot-notation path, with hash/shadow overrides transparently merged. This is the primary hook for reading scene data in components. Supports exact path matches, child override merging (e.g., `#projects.0.name=Foo` overrides a nested field), and full-scene reads with all overrides applied. Also exports `useSceneLoading()`.

## Composition

**`useSceneData(path?)`** — Returns the resolved value at the given path, or the entire scene object if no path is given.

Override resolution:
1. Exact match: hash/shadow param directly for this path → return as-is
2. Child overrides: params that start with `path.` → deep clone scene value and merge overrides
3. No override: return scene value

In hide mode, reads from shadow localStorage instead of URL hash.

**`useSceneLoading()`** — Returns `context.loading` (always `false` in current sync implementation).

Both hooks throw if used outside `<StoryboardProvider>`.

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — React context
- [`packages/core/src/dotPath.js`](../../../core/src/dotPath.js.md) — `getByPath`, `deepClone`, `setByPath`
- [`packages/core/src/session.js`](../../../core/src/session.js.md) — `getParam`, `getAllParams`
- [`packages/core/src/hashSubscribe.js`](../../../core/src/hashSubscribe.js.md) — `subscribeToHash`, `getHashSnapshot`
- [`packages/core/src/hideMode.js`](../../../core/src/hideMode.js.md) — `isHideMode`, `getShadow`, `getAllShadows`
- [`packages/core/src/localStorage.js`](../../../core/src/localStorage.js.md) — `subscribeToStorage`, `getStorageSnapshot`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useSceneData` and `useSceneLoading`
