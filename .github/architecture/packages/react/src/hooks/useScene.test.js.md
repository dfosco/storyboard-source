# `packages/react/src/hooks/useScene.test.js`

<!--
source: packages/react/src/hooks/useScene.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useScene.js`](./useScene.js.md). Validates return shape (`{ sceneName, switchScene }`), scene name from context, `switchScene` type check, and context requirement enforcement.

## Composition

Uses `createWrapper` with different scene names to verify context reading.

## Dependencies

- [`packages/react/src/hooks/useScene.js`](./useScene.js.md) — Module under test
- `@testing-library/react` — `renderHook`

## Dependents

None — test file.
