# `packages/storyboard/src/internals/hooks/useSceneData.test.js`

<!--
source: packages/storyboard/src/internals/hooks/useSceneData.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This test file locks down the public behavior of `useSceneData`. It documents the supported API in executable form and protects the hook from regressions as the underlying data, hash, storage, and routing layers evolve.

Architecturally, these tests matter because the hook layer is mostly thin wiring. The behavior that needs preserving is less about internal algorithms and more about precedence, aliasing, and reactivity contracts.

## Composition

```js
it('returns entire flow object when no path given', () => {
it('returns nested value by dot-notation path', () => {
it('returns deep nested value', () => {
it('returns array by path', () => {
```

- Focus: flow data reads, override merges, loading state, and deprecated aliases.
- The file uses Vitest and Testing Library hook rendering helpers to exercise the exported hook from React.
- Return values are asserted directly from `result.current`, and state changes are driven through URL/hash or storage helpers depending on the hook.
- Re-renders happen through the same subscriptions the production hook uses, so these tests primarily validate externally observable behavior.

## Dependencies

- Depends on the hook under test in the same directory.
- Most cases seed or rely on the data system described by [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md).
- Hooks that use provider data read through [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).

## Dependents

- No production files import this test module; it is executed by Vitest.

## Notes

- The scenarios here serve as the clearest executable summary of the contract for `packages/storyboard/src/internals/hooks/useSceneData.js`.
