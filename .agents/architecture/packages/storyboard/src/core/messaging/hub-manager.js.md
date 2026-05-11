# `packages/storyboard/src/core/messaging/hub-manager.js`

<!--
source: packages/storyboard/src/core/messaging/hub-manager.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) materializes and governs multi-agent hubs on a canvas. It turns widget/connector topology into ephemeral hub state, tracks token holders and conversation lifecycle, and emits hub events through the bus so the rest of the runtime can observe structural changes without re-reading the canvas model directly.

## Composition

The file keeps two in-memory indexes—one keyed by hub id and one by canvas id—and derives stable hub ids from the sorted membership set:

```js
const hubs = new Map()
const canvasHubs = new Map()

export function stableHubId(canvasId, widgetIds) {
  const sorted = [...widgetIds].sort()
  const hash = createHash('sha1').update(`${canvasId}::${sorted.join(',')}`).digest('hex').slice(0, 10)
  return `hub_${hash}`
}
```

`materializeHubs()` computes connected components, filters to components that actually contain interactive agents, assigns roles, derives broadcast state from connector metadata, and either updates or creates a hub record:

```js
const components = computeComponents(widgets, connectors)
if (!hasAgents || comp.size < 2) continue
hubs.set(hubId, { hubId, canvasId, members, tokenHolder, goal: null, ... })
```

Conversation and governance APIs mutate that ephemeral state and publish lifecycle events:

```js
export async function transferHubToken(hubId, fromWidgetId, toWidgetId) { /* ... */ }
export async function setHubGoal(hubId, senderId, goal) { /* leader-only */ }
export async function startConversation(hubId, senderId) { /* conversation:start */ }
```

## Dependencies

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) — publishes hub and conversation events and registers event namespaces.
- [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md) — lazily generates conversation ids.
- [`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md) — lazily cleaned up when hubs dissolve.
- Node `crypto` — hashes stable membership sets into reproducible hub ids.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) — serves hub state and mutates hubs via HTTP endpoints.
- [`packages/storyboard/src/core/messaging/hub-maintenance.js`](./hub-maintenance.js.md) — scans hub maps for stale conversations.
- `packages/storyboard/src/core/vite/server-plugin.js` — hands the hub map to maintenance on startup.
- `packages/storyboard/src/core/canvas/server.js` — materializes hubs from canvas graph changes.

## Notes

- Hub state is intentionally ephemeral; connectors remain the source of truth and can reconstruct hubs after a restart.
- Leadership and token ownership are separate concepts: the token controls turn-taking, while the leader controls goal-setting and finality.

