# `packages/storyboard/src/core/messaging/presence.test.js`

<!--
source: packages/storyboard/src/core/messaging/presence.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/presence.test.js`](./presence.test.js.md) captures the expected lifecycle for agent presence: join, heartbeat, expiry, restart recovery, and explicit leave. It validates that the registry behaves correctly both with and without a prior `rehydratePresence()` call.

## Composition

The suite initializes a real bus and adapter, then exercises the presence API through observable queries:

```js
await joinPresence({ widgetId: 'agent-1', senderName: 'Alice', branch: 'main', canvasId: 'canvas-1' })
const present = getPresent('main', 'canvas-1')
expect(present).toHaveLength(1)
```

It also uses fake timers to test expiry semantics deterministically:

```js
vi.useFakeTimers()
vi.advanceTimersByTime(EXPIRY_TTL + 1)
expect(isPresent('old-agent')).toBeNull()
```

## Dependencies

- [`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md)
- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md)
- `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js`
- Vitest.

## Dependents

- No production dependents; this is a Vitest suite.

## Notes

- The tests emphasize recovery from persisted presence events, which is the architectural reason presence is bus-backed instead of purely in-memory.

