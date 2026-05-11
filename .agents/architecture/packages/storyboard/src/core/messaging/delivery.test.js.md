# `packages/storyboard/src/core/messaging/delivery.test.js`

<!--
source: packages/storyboard/src/core/messaging/delivery.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/delivery.test.js`](./delivery.test.js.md) proves that the tmux delivery bridge behaves like a durable inbox instead of a best-effort live subscriber. It checks rebinding, filtering, ack/failure behavior, and replay from saved cursors.

## Composition

The suite boots a real bus and JSONL adapter, then mocks `node:child_process` so tmux commands can be asserted without a real session:

```js
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))
```

Representative cases cover live publish, self-message suppression, and bind-time backfill:

```js
await bindWidget({ widgetId: 'w3', tmuxName: 'my-sess:0.0', branch: 'main', canvasId: 'c1' })
await publish(channel, { type: 'message:request', senderId: 'other-agent', body: 'Hello w3!' })
expect(execSyncMock).toHaveBeenCalled()
```

## Dependencies

- [`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md)
- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md)
- `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js`
- Vitest and Node filesystem helpers.

## Dependents

- No production dependents; this file is a Vitest suite.

## Notes

- Because it uses the real adapter and filesystem cursors, the suite doubles as executable documentation for recovery semantics after server restarts.

