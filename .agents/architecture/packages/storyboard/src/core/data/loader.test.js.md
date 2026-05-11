# `packages/storyboard/src/core/data/loader.test.js`
<!--
source: packages/storyboard/src/core/data/loader.test.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Unit tests for `loader.js`. Covers `init()` seeding, `loadFlow()` with `$global` and `$ref` resolution, `loadRecord()`/`findRecord()`, `loadObject()`, scope resolution helpers (`resolveFlowName`, `resolveObjectName`, `resolveRecordName`), `flowExists()` (case-insensitive), and error cases (missing data files, circular `$ref`).

## Composition

Standard Vitest test file. Seeds the data index via `init()` with fixture data in each test. No mocking of fs/network — the loader is pure in-memory after `init()`.

## Dependencies

- `vitest`
- [`./loader.js`](./loader.js.md)

## Dependents

None (test file).

## Notes

- Circular `$ref` detection is specifically tested: `{ "$ref": "a" }` where `a` also has `{ "$ref": "a" }` should throw.
- Prototype scoping scenarios are verified: `resolveFlowName('Dashboard', 'default')` should prefer `Dashboard/default` over `default` when both exist.
