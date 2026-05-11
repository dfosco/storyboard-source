# `packages/storyboard/src/core/data/viewfinder.test.js`
<!--
source: packages/storyboard/src/core/data/viewfinder.test.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Unit tests for `viewfinder.js`. Covers `resolveFlowRoute` (known-route match, `meta.route`, `_route` fallback, default flow, token appending), `getFlowMeta`, `buildPrototypeIndex` (folders, prototype grouping, canvas grouping, sort orders), `appendTokens`, and `hash`.

## Composition

Standard Vitest test file. Seeds `loader.js` via `init()` with fixture flows/prototypes/canvases in each test suite.

## Dependencies

- `vitest`
- [`./viewfinder.js`](./viewfinder.js.md)
- [`./loader.js`](./loader.js.md) — via `init()` for fixture seeding

## Dependents

None (test file).

## Notes

- Tests verify that canvas multi-page grouping (shared `_group` key) collapses entries correctly.
- Sort order tests confirm `sorted.updated` puts the most recently modified prototype first.
