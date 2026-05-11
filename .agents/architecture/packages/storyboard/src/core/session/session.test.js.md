# `packages/storyboard/src/core/session/session.test.js`

<!--
source: packages/storyboard/src/core/session/session.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Behavioral coverage for the hash-session helpers. The suite locks down the contract that `session.js` must read, update, enumerate, and remove hash params without disturbing unrelated entries.

## Composition

Each `describe()` block maps directly to one exported helper. The tests cover empty-state reads, overwrite semantics, URL-decoding, plain-object enumeration, and removal behavior:

```js
setParam('c', '3')
expect(getParam('a')).toBe('1')
expect(getParam('b')).toBe('2')
expect(getParam('c')).toBe('3')
```

That makes the file a concise executable spec for the URL-hash API rather than just regression coverage.

## Dependencies

- [`packages/storyboard/src/core/session/session.js`](./session.js.md) for the implementation under test.
- Vitest globals and jsdom's `window.location`.

## Dependents

- Consumed by the package test runner; no runtime imports.

## Notes

The suite intentionally uses raw `window.location.hash` setup in addition to helper calls so it verifies parsing and serialization from real browser state.
