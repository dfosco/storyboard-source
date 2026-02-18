# `packages/core/src/viewfinder.test.js`

<!--
source: packages/core/src/viewfinder.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/viewfinder.js`](./viewfinder.js.md). Validates `hash` (returns number, deterministic, different for different strings, non-negative) and `resolveSceneRoute` (exact case match, case-insensitive, explicit `route` key, absolute route, fallback to root, empty/missing routes, URL encoding of special characters).

## Composition

Two `describe` blocks. Seeds the data index via `init()` in `beforeEach` with a test index containing scenes with various route configurations.

## Dependencies

- [`packages/core/src/viewfinder.js`](./viewfinder.js.md) — Module under test
- [`packages/core/src/loader.js`](./loader.js.md) — `init` for seeding test data

## Dependents

None — test file.
