# `packages/storyboard/src/core/messaging/presence.js`

<!--
source: packages/storyboard/src/core/messaging/presence.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md) tracks which agent widgets are currently alive on each canvas. It combines durable event replay with heartbeat-based expiry so presence can recover after server restarts without needing an explicit “disconnect” event.

## Composition

The registry is keyed by widget id and paired with per-channel subscriptions plus local heartbeat timers:

```js
const registry = new Map()
const channelSubs = new Map()
const heartbeatTimers = new Map()
```

Startup registers the `presence` namespace and launches a sweep loop that removes entries older than `EXPIRY_TTL`:

```js
export function initPresence() {
  registerEventNamespace('presence', {
    events: ['presence:join', 'presence:heartbeat'],
  })
  sweepTimer = setInterval(sweepExpired, SWEEP_INTERVAL)
}
```

`joinPresence()` publishes a join event, updates the registry immediately, and starts periodic heartbeat publication:

```js
await publish(channel, {
  type: 'presence:join',
  senderId: widgetId,
  senderName,
  branch,
  canvasId,
})
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) — used for publish/read/subscribe and event namespace registration.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) — exposes presence queries over HTTP.
- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md) — re-exports the presence API.
- [`packages/storyboard/src/core/messaging/presence.test.js`](./presence.test.js.md) — verifies registry and rehydration behavior.
- `packages/storyboard/src/core/canvas/terminal-server.js` — joins and leaves presence as terminal widgets connect.
- `packages/storyboard/src/core/vite/server-plugin.js` — initializes the subsystem at startup.

## Notes

- Rehydration subscribes lazily per presence channel, so canvases only incur live listeners after they have been observed.

