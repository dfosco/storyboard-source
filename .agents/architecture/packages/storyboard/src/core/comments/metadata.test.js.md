# `packages/storyboard/src/core/comments/metadata.test.js`

<!--
source: packages/storyboard/src/core/comments/metadata.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file tests the metadata wire format used by the comments API. It covers valid parsing, malformed payloads, trimming rules, serialization, and update merging.

## Composition

The suite exercises round-trips and edge cases for [`packages/storyboard/src/core/comments/metadata.js`](./metadata.js.md), including bodies with no metadata at all.

```js
it('roundtrips with parseMetadata', () => {
  const meta = { x: 10, y: 20, resolved: false }
  const text = 'A comment body'
  const body = serializeMetadata(meta, text)
  const parsed = parseMetadata(body)
  expect(parsed.meta).toEqual(meta)
  expect(parsed.text).toBe(text)
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/metadata.js`](./metadata.js.md) — Provides the helpers under test.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; this suite protects the metadata contract used by [`packages/storyboard/src/core/comments/api.js`](./api.js.md).
