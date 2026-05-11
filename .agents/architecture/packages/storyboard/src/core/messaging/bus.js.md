# `packages/storyboard/src/core/messaging/bus.js`

<!--
source: packages/storyboard/src/core/messaging/bus.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) is the process-local messaging kernel for Storyboard’s server-side coordination layer. It gives the rest of the system a storage-agnostic publish/subscribe API, so HTTP routes, terminal delivery, presence tracking, and hub orchestration can all talk in terms of channels and envelopes instead of filesystem details. Persistence is delegated to `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js` through a small adapter interface, which keeps the bus reusable even though the current runtime uses JSONL logs.

Architecturally, this file sits at the center of the messaging stack. It creates normalized envelopes via [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md), writes them durably, then synchronously fans them out to in-process subscribers. That makes it the seam between durable history (`read` / `readMulti`) and live coordination (`subscribe` / `subscribeAll`), which is why higher-level modules like [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md), [`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md), [`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md), and [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) all build directly on it.

## Composition

The module keeps singleton process state for the current adapter, per-channel subscribers, registered namespaces, and wildcard subscribers:

```js
let adapter = null
const subscribers = new Map()
const namespaces = new Map()
const wildcardSubscribers = new Set()
```

Initialization is intentionally small: callers inject a storage adapter once, tests can inspect it, and `resetBus()` clears everything back to a blank singleton.

```js
export function initBus(storageAdapter) {
  adapter = storageAdapter
}

export function getAdapter() {
  return adapter
}

export function resetBus() {
  adapter = null
  subscribers.clear()
  namespaces.clear()
  wildcardSubscribers.clear()
}
```

Namespace registration is advisory metadata. Domain modules declare prefixes up front so unexpected event families can be surfaced in development without blocking delivery:

```js
export function registerEventNamespace(namespace, opts = {}) {
  namespaces.set(namespace, {
    events: opts.events || [],
  })
}
```

`publish()` is the core path. It fills missing envelope fields, validates them, warns on unknown namespaces, persists the event, and only then notifies live subscribers. Because subscribers run after append, in-process consumers see the same canonical envelope that durable readers will later replay.

```js
export async function publish(channel, eventFields) {
  if (!adapter) {
    throw new Error('Bus not initialized. Call initBus(adapter) first.')
  }

  const event = createEnvelope({ ...eventFields, channel })
  const { valid, errors } = validateEnvelope(event)
  if (!valid) {
    throw new Error(`Invalid message envelope: ${errors.join(', ')}`)
  }

  const ns = event.type.split(':')[0]
  if (!namespaces.has(ns)) {
    console.warn(`[messaging-bus] Unregistered event namespace: "${ns}" (type: ${event.type})`)
  }

  await adapter.append(channel, event)
  // ...notify channel and wildcard subscribers...
  return event
}
```

The subscription surface is split into channel-specific and wildcard listeners. Both return unsubscribe functions so higher-level modules can bind and unbind without mutating bus internals directly.

```js
export function subscribe(channel, handler) {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set())
  }
  subscribers.get(channel).add(handler)
  return () => { /* remove handler and prune empty set */ }
}

export function subscribeAll(handler) {
  wildcardSubscribers.add(handler)
  return () => wildcardSubscribers.delete(handler)
}
```

Historical access goes through the adapter. `read()` is the single-channel primitive, while `readMulti()` parallelizes channel reads and returns a keyed object for batch endpoints.

```js
export async function read(channel, opts = {}) {
  if (!adapter) throw new Error('Bus not initialized. Call initBus(adapter) first.')
  return adapter.read(channel, opts)
}

export async function readMulti(channels, opts = {}) {
  const result = {}
  await Promise.all(
    channels.map(async (ch) => {
      result[ch] = await adapter.read(ch, opts)
    })
  )
  return result
}
```

## Dependencies

- [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md) — supplies `createEnvelope()` and `validateEnvelope()` so the bus always persists normalized, namespaced envelopes.
- `./storage/types.js` (type-only JSDoc) — defines the storage adapter contract and read option shape.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) — exposes bus operations over HTTP, SSE, and request/response correlation.
- [`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md) — subscribes to terminal inbox channels and backfills from durable reads.
- [`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md) — publishes and rehydrates heartbeat events.
- [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) — emits hub and conversation lifecycle events.
- [`packages/storyboard/src/core/messaging/hub-maintenance.js`](./hub-maintenance.js.md) — publishes timeout events for idle conversations.
- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md) — re-exports the public bus API.
- [`packages/storyboard/src/core/messaging/bus.test.js`](./bus.test.js.md), [`packages/storyboard/src/core/messaging/delivery.test.js`](./delivery.test.js.md), and [`packages/storyboard/src/core/messaging/presence.test.js`](./presence.test.js.md) — verify core bus behavior and downstream integrations.
- `packages/storyboard/src/core/vite/server-plugin.js`, `packages/storyboard/src/core/canvas/server.js`, and `packages/storyboard/src/core/canvas/terminal-server.js` — bootstrap the bus and publish runtime events from server flows.

## Notes

- Delivery to in-process subscribers is synchronous from the caller’s perspective, but subscriber failures are isolated with `try/catch` so one consumer cannot block the bus.
- Namespace registration is informational rather than authoritative; unknown namespaces warn instead of failing, which keeps local development flexible while still surfacing drift.
- `resetBus()` is critical for tests because this module is a singleton, not a class instance.

