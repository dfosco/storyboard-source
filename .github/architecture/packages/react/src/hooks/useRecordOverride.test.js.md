# `packages/react/src/hooks/useRecordOverride.test.js`

<!--
source: packages/react/src/hooks/useRecordOverride.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useRecordOverride.js`](./useRecordOverride.js.md). Validates return shape, correct override path construction (`record.posts.post-1.title`), missing path fallback, and `setValue` writing to hash at the correct compound path.

## Composition

Uses `createWrapper(TEST_SCENES.default)` for context. Tests verify the hash path convention by parsing `window.location.hash` after `act()` calls.

## Dependencies

- [`packages/react/src/hooks/useRecordOverride.js`](./useRecordOverride.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`

## Dependents

None — test file.
