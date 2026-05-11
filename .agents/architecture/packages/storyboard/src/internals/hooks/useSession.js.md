# `packages/storyboard/src/internals/hooks/useSession.js`

<!--
source: packages/storyboard/src/internals/hooks/useSession.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useSession` exists solely as a backwards-compatible export name for `useOverride`. It keeps older consumers working while the project standardizes on the override terminology used by the rest of the data system.

Architecturally, the file matters because it fixes the public API surface in one place rather than scattering alias logic across the real implementation.

## Composition

```js
export { useOverride as useSession } from './useOverride.js'
```

- Signature: identical to `useOverride(path)`.
- Returns the same `[value, setValue, clearValue]` tuple as the underlying hook.
- It has no subscriptions of its own; all reactivity comes from `useOverride`.
- Re-render behavior is therefore exactly the same as the underlying override hook.

## Dependencies

- Delegates entirely to [`packages/storyboard/src/internals/hooks/useOverride.js`](useOverride.js.md).

## Dependents

- `packages/storyboard/src/internals/hooks/useSession.test.js` asserts the alias identity contract.

## Notes

- Consumers using this alias still participate in provider reads via [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) and hash preservation via [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md) because `useOverride` does.
