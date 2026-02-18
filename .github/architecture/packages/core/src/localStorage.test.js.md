# `packages/core/src/localStorage.test.js`

<!--
source: packages/core/src/localStorage.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/localStorage.js`](./localStorage.js.md). Validates CRUD operations (`getLocal`, `setLocal`, `removeLocal`, `getAllLocal`), the `storyboard:` prefix convention, string conversion, event dispatch (`storyboard-storage`), subscription/unsubscription, snapshot serialization (sorted, cached, cache invalidation), and error resilience when localStorage throws.

## Composition

Five `describe` blocks. Tests directly interact with `localStorage` and `window` events. Key patterns: verifying prefix stripping in `getAllLocal`, testing cache invalidation via event dispatch, and checking that non-storyboard keys are ignored.

## Dependencies

- [`packages/core/src/localStorage.js`](./localStorage.js.md) — Module under test

## Dependents

None — test file.
