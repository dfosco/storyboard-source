# `packages/core/src/hashSubscribe.test.js`

<!--
source: packages/core/src/hashSubscribe.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/hashSubscribe.js`](./hashSubscribe.js.md). Validates `subscribeToHash` (unsubscribe function, callback firing on hashchange, cleanup, multiple subscribers) and `getHashSnapshot` (reflects current hash, empty string when no hash, immediate reflection of changes).

## Composition

Two `describe` blocks. Tests dispatch `hashchange` events manually and verify callback behavior. Snapshot tests use direct `window.location.hash` manipulation.

## Dependencies

- [`packages/core/src/hashSubscribe.js`](./hashSubscribe.js.md) — Module under test

## Dependents

None — test file.
