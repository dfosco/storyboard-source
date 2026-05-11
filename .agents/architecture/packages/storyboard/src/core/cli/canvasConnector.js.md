# `packages/storyboard/src/core/cli/canvasConnector.js`

<!--
source: packages/storyboard/src/core/cli/canvasConnector.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas connector` — creates, updates, deletes, and manages waypoints on canvas connectors (the directed edges between widgets).

## Composition

| Subcommand | Endpoint | Method |
|---|---|---|
| `create` | `/_storyboard/canvas/connector` | POST |
| `update <id>` | `/_storyboard/canvas/connector` | PATCH |
| `delete <id>` | `/_storyboard/canvas/connector` | DELETE |
| `waypoints set <id>` | `/_storyboard/canvas/connector/waypoints` | PUT |
| `waypoints clear <id>` | `/_storyboard/canvas/connector/waypoints` | DELETE |

`create` flags: `--start`, `--end`, `--canvas`, optional `--start-anchor`, `--end-anchor` (auto-calculated if omitted), `--connector-type`, `--meta`. `update` patches anchors and meta. `waypoints` accepts a JSON array of `{dx, dy, tHint}` objects for manual routing.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `post`, `patch`, `del`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas connector`).
