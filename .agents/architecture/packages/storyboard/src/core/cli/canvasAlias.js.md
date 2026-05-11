# `packages/storyboard/src/core/cli/canvasAlias.js`

<!--
source: packages/storyboard/src/core/cli/canvasAlias.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas alias <get|set|clear>` — reads, sets, or clears the human-readable alias (nickname) for a canvas widget. Exported as `handleAlias(args)` and called directly by [`index.js`](./index.js.md) rather than being auto-executed on import.

## Composition

| Subcommand | Endpoint | Method |
|---|---|---|
| `get` | `/_storyboard/canvas/alias?widgetId=…&canvas=…` | GET |
| `set` | `/_storyboard/canvas/alias` | PUT |
| `clear` | `/_storyboard/canvas/alias` | DELETE |

Flags: `-w/--widget`, `-c/--canvas`, `-a/--alias` (set only), `--json`.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `get`, `put`, `del`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Called by [`index.js`](./index.js.md) via `import('./canvasAlias.js').then(m => m.handleAlias(process.argv.slice(4)))`.
