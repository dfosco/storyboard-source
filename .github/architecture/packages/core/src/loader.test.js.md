# `packages/core/src/loader.test.js`

<!--
source: packages/core/src/loader.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/loader.js`](./loader.js.md). Covers the complete data loading pipeline: `init` (validation, error on null/undefined/string), `loadScene` (basic load, `$ref` resolution, nested `$ref`, `$global` merge with conflict resolution, missing scene, case-insensitive lookup, deep clone isolation, default param, circular `$ref` detection), `sceneExists`, `listScenes`, `loadRecord` (array validation, clone), `findRecord`, and `deepMerge` (nested merge, source wins, array replacement, null handling).

## Composition

Six `describe` blocks. Uses a `makeIndex()` factory to create fresh test data for each test via `beforeEach`. Includes a dedicated circular reference test case with two objects that reference each other.

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — Module under test

## Dependents

None — test file.
