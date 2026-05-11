# `packages/storyboard/src/core/session/localStorage.test.js`

<!--
source: packages/storyboard/src/core/session/localStorage.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Main regression suite for the localStorage adapter. It proves the namespacing scheme, CRUD helpers, event fan-out, and snapshot cache invalidation rules used by runtime consumers.

## Composition

The file exercises the public surface end to end with real `localStorage` state. Representative cases include namespaced writes and cached snapshot reads:

```js
setLocal('z', '3')
setLocal('a', '1')
const snap = getStorageSnapshot()
expect(snap).toBe(P + 'a=1&' + P + 'z=3')
```

The tests also verify that both custom and native storage events can trigger subscribers.

## Dependencies

- [`packages/storyboard/src/core/session/localStorage.js`](./localStorage.js.md).
- Vitest spies and jsdom `localStorage` / `window` events.

## Dependents

- Consumed only by tests.

## Notes

`beforeEach()` clears storage because jsdom persists it across test cases in the same suite.
