# `packages/storyboard/src/core/messaging/index.js`

<!--
source: packages/storyboard/src/core/messaging/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/index.js`](./index.js.md) is the public barrel for the messaging subsystem. It gathers the core bus, schema helpers, HTTP routes, TOON boundary helpers, presence registry, delivery bridge, and JSONL adapter behind one stable import surface.

## Composition

The file is intentionally only re-exports:

```js
export { initBus, publish, subscribe, read, readMulti, registerEventNamespace } from './bus.js'
export { generateId, validateEnvelope, createEnvelope, STATUS } from './schema.js'
export { JsonlAdapter } from './storage/jsonl-adapter.js'
export { createMessagingRoutes, closeAllSseConnections } from './routes.js'
```

That keeps downstream modules from needing to know the full internal file layout.

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md)
- [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md)
- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md)
- [`packages/storyboard/src/core/messaging/toon.js`](./toon.js.md)
- [`packages/storyboard/src/core/messaging/presence.js`](./presence.js.md)
- [`packages/storyboard/src/core/messaging/delivery.js`](./delivery.js.md)
- `packages/storyboard/src/core/messaging/storage/jsonl-adapter.js`

## Dependents

- Consumers that want a single messaging entrypoint rather than reaching into individual files.

## Notes

- This barrel omits some internal hub/token files, signaling that those pieces are primarily runtime internals rather than the main public API.

