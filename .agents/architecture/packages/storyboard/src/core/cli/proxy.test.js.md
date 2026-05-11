# `packages/storyboard/src/core/cli/proxy.test.js`

<!--
source: packages/storyboard/src/core/cli/proxy.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vitest unit tests for `findStaleRouteIndices` exported from [`proxy.js`](./proxy.js.md) (actually delegated to [`proxy.legacy.js`](./proxy.legacy.js.md)). Tests the stale-route cleanup logic that prevents leftover un-`@id`-ed Caddyfile routes from shadowing admin-API routes.

## Composition

Seven test cases for `findStaleRouteIndices`:

1. Identifies stale non-`@id` routes matching the same host
2. Preserves routes with a different `@id` for the same host
3. Returns multiple stale indices in **descending order** (safe deletion order)
4. Ignores routes for a different host
5. Handles routes with no `match` field
6. Returns empty array when no stale routes exist
7. Handles empty routes array

## Dependencies

- `vitest`
- [`proxy.js`](./proxy.js.md) — `findStaleRouteIndices`

## Dependents

None — test file only.
