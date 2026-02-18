# `packages/react/src/hooks/useUndoRedo.test.js`

<!--
source: packages/react/src/hooks/useUndoRedo.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useUndoRedo.js`](./useUndoRedo.js.md). Validates return shape, initial `canUndo`/`canRedo` state, and full undo/redo cycle — pushes 3 snapshots, then navigates back and forward verifying `canUndo`/`canRedo` at each position.

## Composition

Uses `pushSnapshot` from core to pre-populate history. Uses `renderHook` with `rerender()` to force re-reads after `act()` undo/redo calls. No StoryboardProvider wrapper needed — hook reads directly from localStorage/hash.

## Dependencies

- [`packages/react/src/hooks/useUndoRedo.js`](./useUndoRedo.js.md) — Module under test
- `@dfosco/storyboard-core` — `pushSnapshot` for test setup
- `@testing-library/react` — `renderHook`, `act`

## Dependents

None — test file.
