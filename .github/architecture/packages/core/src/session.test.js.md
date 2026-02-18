# `packages/core/src/session.test.js`

<!--
source: packages/core/src/session.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/session.js`](./session.js.md). Validates all four hash session functions: `getParam` (empty hash, existing/missing keys, URL encoding), `setParam` (create, update, preserve others, string conversion), `getAllParams` (empty, multiple), and `removeParam` (existing, preserve others, missing key no-op).

## Composition

Four `describe` blocks. Tests manipulate `window.location.hash` directly and verify state through the module's read functions.

## Dependencies

- [`packages/core/src/session.js`](./session.js.md) — Module under test

## Dependents

None — test file.
