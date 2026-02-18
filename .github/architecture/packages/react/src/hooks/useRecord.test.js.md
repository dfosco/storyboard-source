# `packages/react/src/hooks/useRecord.test.js`

<!--
source: packages/react/src/hooks/useRecord.test.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Tests for [`packages/react/src/hooks/useRecord.js`](./useRecord.js.md). Validates both `useRecord` (single entry lookup by URL param, missing param, default `id` param, nonexistent collection) and `useRecords` (all entries, empty on missing collection, hash overrides on existing entries, new entry creation from hash).

## Composition

Mocks `react-router-dom`'s `useParams` to control URL param values. Uses `seedTestData()` and `TEST_RECORDS` from test utilities. Hash override tests use `record.posts.{id}.{field}` convention.

## Dependencies

- [`packages/react/src/hooks/useRecord.js`](./useRecord.js.md) — Module under test
- `@testing-library/react` — `renderHook`, `act`
- `react-router-dom` — Mocked `useParams`

## Dependents

None — test file.
