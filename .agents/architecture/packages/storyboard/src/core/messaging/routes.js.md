# `packages/storyboard/src/core/messaging/routes.js`

<!--
source: packages/storyboard/src/core/messaging/routes.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) is the HTTP boundary for the messaging subsystem. It translates REST-style requests into bus operations, supports SSE for live subscriptions, negotiates JSON vs TOON payloads, and exposes higher-level orchestration endpoints for presence, hubs, token passing, and conversation lifecycle.

## Composition

`createMessagingRoutes()` dispatches a single route handler across messaging subpaths instead of exporting many discrete handlers:

```js
export function createMessagingRoutes({ sendJson }) {
  return async (req, res, ctx) => {
    if (method === 'POST' && subpath === 'publish') return await handlePublish(...)
    if (method === 'GET' && subpath.startsWith('hub/')) return await handleHubState(...)
  }
}
```

The file groups three major responsibilities:

1. Low-level bus endpoints such as `/publish`, `/send`, `/batch`, `/read`, and `/subscribe`.
2. Read-oriented status endpoints like `/presence`, `/bindings`, and `/hub/:canvasId`.
3. Mutation endpoints for hub token transfer, goal setting, turn delegation, and conversation state.

The SSE path backfills missed events before attaching a live subscription, using the event id as the SSE cursor:

```js
const since = req.headers['last-event-id'] || url.searchParams.get('since') || undefined
read(channel, { since, type: typeFilter }).then((missed) => {
  for (const event of missed) writeSseEvent(res, event)
})
```

Hub fanout is where this file becomes orchestration-heavy. `/hub/send` publishes the canonical request to the hub channel, creates ordered tokens with [`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md), then mirrors the request into each recipient terminal channel for tmux delivery:

```js
const event = await publish(hub.channel, {
  type: 'hub:message:request',
  senderId,
  body: parsed.body,
})
const tokens = createMessageTokens(event.id, hubId, recipientList, { timeoutMs, parentMessageId })
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md)
- [`packages/storyboard/src/core/messaging/toon.js`](./toon.js.md)
- [`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md)
- [`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md)
- [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md)
- [`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md)

## Dependents

- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md) — public re-export.
- `packages/storyboard/src/core/vite/server-plugin.js` — mounts the route handler into the dev/runtime server.

## Notes

- `closeAllSseConnections()` exists so server shutdown can proactively terminate open event streams.
- `/send` uses correlation ids plus an in-process subscription rather than a separate queue, which keeps the request/response feature layered directly on top of the same bus primitives exposed everywhere else.

