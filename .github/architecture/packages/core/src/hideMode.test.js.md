# `packages/core/src/hideMode.test.js`

<!--
source: packages/core/src/hideMode.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/hideMode.js`](./hideMode.js.md). Comprehensive coverage of the hide mode system: toggle behavior (activate/deactivate round-trips), history stack (push, dedup, max 200 cap), undo/redo (navigation, timeline forking), shadow read/write, and `syncHashToHistory` (skip in hide mode, push new, no-op on match).

## Composition

Five `describe` blocks: Hide mode toggle, History stack, Undo/redo, Shadow read/write, syncHashToHistory. Tests manipulate `window.location.hash` and localStorage directly. Key patterns: verifying history trimming at 200 entries with re-indexed positions, timeline forking after undo+push.

## Dependencies

- [`packages/core/src/hideMode.js`](./hideMode.js.md) — Module under test

## Dependents

None — test file.
