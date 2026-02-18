# `packages/react/src/hooks/useHideMode.test.js`

<!--
source: packages/react/src/hooks/useHideMode.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useHideMode.js`](./useHideMode.js.md). Validates the hook's return shape, initial `isHidden` state, and toggling via `hide()`/`show()` using `renderHook` and `act`.

## Composition

Uses `seedTestData()` from test utilities for setup. Tests manipulate localStorage directly to set known hide mode state and verify the hook's reactive response.

## Dependencies

- [`packages/react/src/hooks/useHideMode.js`](./useHideMode.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`

## Dependents

None — test file.
