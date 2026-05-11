# `packages/storyboard/src/core/comments/metadata.js`

<!--
source: packages/storyboard/src/core/comments/metadata.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module defines the metadata encoding used to pin comments to coordinates while keeping the visible comment body readable. It treats GitHub Discussion text as a transport that can carry both user text and hidden structured fields.

## Composition

It exports three helpers: parse metadata from a leading HTML comment, serialize metadata back into that format, and merge updates into an existing body while preserving text.

```js
const META_REGEX = /<!--\s*sb-meta\s+(\{.*?\})\s*-->/

export function parseMetadata(body) {
  if (!body) return { meta: null, text: '' }
  const match = body.match(META_REGEX)
  if (!match) return { meta: null, text: body.trim() }
  try {
    const meta = JSON.parse(match[1])
    const text = body.replace(META_REGEX, '').trim()
    return { meta, text }
  } catch {
    return { meta: null, text: body.trim() }
  }
}
```

## Dependencies

This file has no significant module imports beyond platform globals such as `fetch`, `localStorage`, or the test runner.

## Dependents

- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Uses metadata when reading, creating, resolving, and moving comments.
- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports the helpers.
- [`packages/storyboard/src/core/comments/metadata.test.js`](./metadata.test.js.md) — Validates parsing and round-tripping.

## Notes

Malformed metadata intentionally degrades to plain-text comments instead of throwing, which keeps existing GitHub content readable even if the metadata block is damaged.
