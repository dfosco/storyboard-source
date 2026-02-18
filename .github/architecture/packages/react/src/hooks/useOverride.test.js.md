# `packages/react/src/hooks/useOverride.test.js`

<!--
source: packages/react/src/hooks/useOverride.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useOverride.js`](./useOverride.js.md). Validates return tuple shape, scene default fallback, hash override reads, `setValue` writes to hash, `clearValue` removes from hash, and context requirement enforcement.

## Composition

Uses `createWrapper(TEST_SCENES.default)` from test utilities. Tests manipulate `window.location.hash` directly and verify hash contents after `act()` calls.

## Dependencies

- [`packages/react/src/hooks/useOverride.js`](./useOverride.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`

## Dependents

None — test file.
