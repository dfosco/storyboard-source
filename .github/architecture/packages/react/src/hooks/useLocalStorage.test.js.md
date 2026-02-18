# `packages/react/src/hooks/useLocalStorage.test.js`

<!--
source: packages/react/src/hooks/useLocalStorage.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useLocalStorage.js`](./useLocalStorage.js.md). Validates return shape, scene default fallback, localStorage reads, hash priority over localStorage, `setValue` writes to localStorage, `clearValue` removes from localStorage, and context requirement enforcement.

## Composition

Uses `createWrapper(TEST_SCENES.default)` for StoryboardProvider context. Tests interact with `localStorage` directly and manipulate `window.location.hash` for priority testing.

## Dependencies

- [`packages/react/src/hooks/useLocalStorage.js`](./useLocalStorage.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`

## Dependents

None — test file.
