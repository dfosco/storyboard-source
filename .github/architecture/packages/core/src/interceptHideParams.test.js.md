# `packages/core/src/interceptHideParams.test.js`

<!--
source: packages/core/src/interceptHideParams.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md). Validates URL param interception: no-op without params, `?hide` triggers activate, `?show` triggers deactivate, `?hide` takes priority over `?show`, idempotent calls, and `installHideParamListener` immediate execution + popstate listener registration.

## Composition

Mocks [`packages/core/src/hideMode.js`](./hideMode.js.md) to verify function calls without side effects. Uses `window.history.pushState` to set up URL state for each test.

## Dependencies

- [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md) — Module under test
- `vitest` — Test framework and mocking

## Dependents

None — test file.
