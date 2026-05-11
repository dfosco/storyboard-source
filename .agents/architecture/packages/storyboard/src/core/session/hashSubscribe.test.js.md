# `packages/storyboard/src/core/session/hashSubscribe.test.js`

<!--
source: packages/storyboard/src/core/session/hashSubscribe.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Unit tests for the hash subscription bridge. They verify that the subscription lifecycle matches the needs of `useSyncExternalStore` consumers.

## Composition

The suite checks three things: unsubscribe behavior, fan-out to multiple listeners, and live snapshots from `window.location.hash`.

```js
const unsub = subscribeToHash(cb)
window.dispatchEvent(new Event('hashchange'))
expect(cb).toHaveBeenCalledTimes(1)
unsub()
```

The second `describe()` block treats `getHashSnapshot()` as a pure read of browser state.

## Dependencies

- [`packages/storyboard/src/core/session/hashSubscribe.js`](./hashSubscribe.js.md).
- Vitest spies and jsdom events.

## Dependents

- Consumed only by tests.

## Notes

Because the implementation is so small, the tests focus on contract details instead of branching logic.
