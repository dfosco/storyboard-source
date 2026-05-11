# `packages/storyboard/src/core/cli/agent.js`

<!--
source: packages/storyboard/src/core/cli/agent.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements the `storyboard agent` command group, which lets agents (and scripts) communicate their status to the canvas server. It covers five subcommands: `signal` (report done/error/running/working), `spawn` (start a headless tmux agent session), `status` (poll current agent status), `peek` (check if a tmux session exists), and `list` (list storyboard-spawned agents on a canvas).

Each subcommand maps 1:1 to a server endpoint under `/_storyboard/canvas/agent/`. The `signal` subcommand has a local fallback: if the server is unreachable, it writes status directly to the terminal config file via `../canvas/terminal-config.js`.

## Composition

- **`signal`** → `POST /_storyboard/canvas/agent/signal` with `{ widgetId, canvasId, branch, status, message }`
- **`spawn`** → `POST /_storyboard/canvas/agent/spawn` with `{ canvasId, widgetId, prompt, autopilot, agentId, branch }`
- **`status`** → `GET /_storyboard/canvas/agent/status?widgetId=…&canvasId=…&branch=…`
- **`peek`** → `POST /_storyboard/canvas/agent/peek` with `{ widgetId, canvasId }`
- **`list`** → `GET /_storyboard/canvas/agents?canvasId=…&branch=…` (excludes externally-spawned agents)

Widget/canvas IDs fall back to `$STORYBOARD_WIDGET_ID` / `$STORYBOARD_CANVAS_ID` env vars, which are auto-set by the terminal server for running agent sessions.

```js
// signal example
npx storyboard agent signal --status done --message "Task complete"
// spawn example
npx storyboard agent spawn --prompt "Implement the feature" --autopilot
```

## Dependencies

- [`flags.js`](./flags.js.md) — `parseFlags` for argument parsing
- [`intro.js`](./intro.js.md) — ANSI color helpers
- `../canvas/terminal-config.js` — fallback config write for offline signal

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'agent'`). Called by agents running inside terminal sessions.

## Notes

The `signal` fallback (writing directly to config when the server is offline) ensures agents can always record their final status even in environments where the dev server has already shut down.
