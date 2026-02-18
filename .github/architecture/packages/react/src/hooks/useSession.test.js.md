# `packages/react/src/hooks/useSession.test.js`

<!--
source: packages/react/src/hooks/useSession.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useSession.js`](./useSession.js.md). Single test verifying that `useSession` is the same function reference as `useOverride` (confirming the deprecated alias).

## Composition

```js
it('is the same function as useOverride', () => {
  expect(useSession).toBe(useOverride)
})
```

## Dependencies

- [`packages/react/src/hooks/useSession.js`](./useSession.js.md) — Module under test
- [`packages/react/src/hooks/useOverride.js`](./useOverride.js.md) — Expected identity

## Dependents

None — test file.
