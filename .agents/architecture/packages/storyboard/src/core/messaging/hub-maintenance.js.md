# `packages/storyboard/src/core/messaging/hub-maintenance.js`

<!--
source: packages/storyboard/src/core/messaging/hub-maintenance.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/hub-maintenance.js`](./hub-maintenance.js.md) runs the background housekeeping loop for multi-agent hubs. Its current job is narrow but important: detect conversations that have sat active longer than the configured timeout, finalize them in memory, and emit a timeout event onto the hub channel.

## Composition

The module keeps a single timer plus mutable timeout configuration:

```js
let maintenanceTimer = null
let config = {
  conversationTimeoutMs: 30 * 60 * 1000,
  intervalMs: 60 * 1000,
}
```

`startMaintenance()` is idempotent and unrefs the interval so the process can still exit normally:

```js
export function startMaintenance(hubs, opts = {}) {
  if (maintenanceTimer) return
  maintenanceTimer = setInterval(async () => {
    await checkConversationTimeouts(hubs)
  }, config.intervalMs)
}
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) — publishes `conversation:timeout` notifications.
- [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) — supplies the shared hub-state map shape consumed by the maintenance loop.

## Dependents

- `packages/storyboard/src/core/vite/server-plugin.js` — starts and stops the loop during server lifecycle.

## Notes

- Token expiration is intentionally excluded here; that concern stays in [`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md) via per-token timers.

