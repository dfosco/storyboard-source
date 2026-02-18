# `packages/core/src/dotPath.test.js`

<!--
source: packages/core/src/dotPath.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Tests for [`packages/core/src/dotPath.js`](./dotPath.js.md). Covers `getByPath` (nested paths, array indices, missing segments, null/undefined inputs), `setByPath` (mutation, auto-creation of intermediates, array detection), and `deepClone` (objects, arrays, nested structures, primitives, independence).

## Composition

Three `describe` blocks testing each exported function. Key patterns: boundary conditions (null obj, empty path, non-string path), array index access via numeric path segments, and clone independence verification.

## Dependencies

- [`packages/core/src/dotPath.js`](./dotPath.js.md) — Module under test

## Dependents

None — test file.
