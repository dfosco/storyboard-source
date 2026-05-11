# `packages/storyboard/src/core/data/dotPath.test.js`
<!--
source: packages/storyboard/src/core/data/dotPath.test.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Unit tests for `dotPath.js`. Covers `getByPath` (nested access, missing paths, array indices, null-safety), `setByPath` (deep creation of intermediate keys, array vs object detection), and `deepClone` (arrays, objects, primitives).

## Composition

Standard Vitest test file importing from [`dotPath.js`](./dotPath.js.md).

## Dependencies

- `vitest`
- [`./dotPath.js`](./dotPath.js.md)

## Dependents

None (test file).
