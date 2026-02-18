# `packages/core/src/sceneDebug.test.js`

<!--
source: packages/core/src/sceneDebug.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/sceneDebug.js`](./sceneDebug.js.md). Validates style injection, element creation, container targeting, return value, scene name rendering (explicit and default), JSON output in `<pre>`, error display when `loadScene` throws, `?scene=` query param support, and multiple panel mounting.

## Composition

Mocks [`packages/core/src/loader.js`](./loader.js.md) via `vi.hoisted` for module-level mock setup. Uses `mockReset` and `mockReturnValue` in `afterEach` to control mock behavior per test. Uses `document.body.innerHTML = ''` for cleanup.

## Dependencies

- [`packages/core/src/sceneDebug.js`](./sceneDebug.js.md) — Module under test
- `vitest` — Test framework and mocking

## Dependents

None — test file.
