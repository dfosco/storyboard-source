# `packages/storyboard/src/core/messaging/bus.test.js`

<!--
source: packages/storyboard/src/core/messaging/bus.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/bus.test.js`](./bus.test.js.md) is the contract test suite for the core messaging bus. It verifies the durable log path, live subscription semantics, namespace warnings, and multi-channel reads against the real `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js` implementation rather than a mock.

## Composition

Each test builds a fresh temporary adapter, initializes [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md), and resets the singleton after the assertion:

```js
beforeEach(async () => {
  resetBus()
  adapter = new JsonlAdapter({ root: tmpDir })
  await adapter.init()
  initBus(adapter)
})
```

The suite covers the bus API end to end:

```js
await publish('ch', { type: 'message:request', senderId: 'a' })
const events = await read('ch')
expect(events).toHaveLength(2)

subscribeAll((channel, event) => received.push({ channel, event }))
const result = await readMulti(['ch1', 'ch2'])
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md)
- `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js`
- Vitest plus Node `fs`, `path`, and `os` helpers for isolated adapter roots.

## Dependents

- No production modules import this file; it is executed by Vitest as part of the messaging test suite.

## Notes

- The tests intentionally exercise real adapter persistence, so they document expected integration behavior in addition to unit-level API guarantees.

