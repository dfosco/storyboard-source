# `packages/core/src/devtools.test.js`

<!--
source: packages/core/src/devtools.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/devtools.js`](./devtools.js.md). Validates the DevTools DOM mounting behavior — idempotency, container targeting, style injection, menu structure, and accessibility attributes.

## Composition

Mocks [`packages/core/src/loader.js`](./loader.js.md) to avoid real scene loading. Tests cover: wrapper element creation, default and custom container mounting, double-mount idempotency, style injection, trigger button `aria-label`, menu item count, and menu hidden-by-default state.

## Dependencies

- [`packages/core/src/devtools.js`](./devtools.js.md) — Module under test
- `vitest` — Test framework

## Dependents

None — test file.
