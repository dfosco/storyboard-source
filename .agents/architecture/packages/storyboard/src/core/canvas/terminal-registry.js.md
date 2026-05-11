# `packages/storyboard/src/core/canvas/terminal-registry.js`

<!--
source: packages/storyboard/src/core/canvas/terminal-registry.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/terminal-registry.js`](./terminal-registry.js.md) is the durable session ledger for terminal and agent tmux sessions. It keeps the authoritative map of widget ↔ tmux session identity in memory, persists it to `.storyboard/terminal-sessions.json`, and reconciles that file with real tmux state after server restarts.

## Composition

Stable tmux session names are derived from branch, canvas, and widget IDs:

```js
export function generateTmuxName(branch, canvasId, widgetId) {
  const input = `${branch}::${canvasId}::${widgetId}`
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 12)
  return `${TMUX_PREFIX}${hash}`
}
```

`initRegistry()` loads persisted sessions and immediately `reconcile()`s them against live tmux sessions so stale `live` entries downgrade to `background` and expired archived sessions get killed. `registerSession()` upgrades or creates active entries, while orphan/background timers manage grace periods.

## Dependencies

- Node `fs`, `path`, `child_process`, and `crypto`.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js`
- `packages/storyboard/src/core/canvas/terminal-server.js`
- `packages/storyboard/src/core/vite/server-plugin.js`

## Notes

The registry deliberately separates friendly names from stable tmux IDs: humans see names like `red-robin`, but system addressing always uses hashed `sb-*` session names.
