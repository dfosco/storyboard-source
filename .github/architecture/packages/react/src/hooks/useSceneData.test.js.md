# `packages/react/src/hooks/useSceneData.test.js`

<!--
source: packages/react/src/hooks/useSceneData.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useSceneData.js`](./useSceneData.js.md). Comprehensive coverage: full scene reads, dot-notation paths, deep nested values, array access, array element by index, missing path warning, context requirement, hash override (exact match), child overrides on arrays, and full scene with all overrides. Also tests `useSceneLoading`.

## Composition

Uses `createWrapper(TEST_SCENES.default)`. Tests manipulate `window.location.hash` to verify override merging at exact and child levels.

## Dependencies

- [`packages/react/src/hooks/useSceneData.js`](./useSceneData.js.md) — Module under test
- `@testing-library/react` — `renderHook`

## Dependents

None — test file.
