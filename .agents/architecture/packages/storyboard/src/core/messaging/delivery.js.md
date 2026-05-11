# `packages/storyboard/src/core/messaging/delivery.js`

<!--
source: packages/storyboard/src/core/messaging/delivery.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md) bridges the durable bus to live tmux-backed terminal agents. It binds a widget to a terminal inbox channel, replays missed `message:request` events from the log, then keeps the terminal fed by subscribing to live bus traffic.

## Composition

Initialization registers the `message` namespace and creates the durable cursor directory under `.storyboard/messages/cursors`:

```js
export function initDeliveryBridge({ root }) {
  rootDir = root
  registerEventNamespace('message', {
    events: ['message:request', 'message:delivered', 'message:failed'],
  })
}
```

`bindWidget()` performs the main workflow: compute the widget inbox channel, read any saved cursor, backfill missed events, then subscribe for live ones.

```js
const channel = terminalChannel(branch, canvasId, widgetId)
const cursor = readCursor(widgetId)
const missed = await read(channel, cursor ? { since: cursor } : {})
const unsub = subscribe(channel, async (event) => { /* deliver + ack */ })
```

Live delivery only forwards external `message:request` events, writes them to tmux with `send-keys`, and publishes best-effort `message:delivered` or `message:failed` follow-ups:

```js
function shouldDeliver(event, widgetId) {
  return event.type === 'message:request' && event.senderId !== widgetId
}

execSync(`tmux send-keys -t ${JSON.stringify(tmuxName)} -l ${JSON.stringify(formatted)}`)
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) — used for subscribe/read/publish and namespace registration.
- Node `fs` and `path` — persist durable cursors per widget.
- `node:child_process` (lazy import) — injects text into tmux panes.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) — reads bindings and synthesizes terminal channels during hub fanout.
- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md) — re-exports the bridge API.
- [`packages/storyboard/src/core/messaging/delivery.test.js`](./delivery.test.js.md) — validates backfill, rebinding, and cursor persistence.
- `packages/storyboard/src/core/canvas/terminal-server.js` and `packages/storyboard/src/core/canvas/server.js` — bind/unbind terminal widgets and inspect active channels.
- `packages/storyboard/src/core/vite/server-plugin.js` — initializes the bridge at server startup.

## Notes

- Cursor writes are best effort: if disk persistence fails, the system falls back to at-least-once redelivery on the next bind.
- Rebinding updates the tmux target without changing the bus subscription, which is what makes the hot-pool workflow cheap.

