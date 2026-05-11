# `packages/storyboard/src/core/cli/canvasBatch.js`

<!--
source: packages/storyboard/src/core/cli/canvasBatch.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas batch` — executes multiple canvas operations atomically in a single server call. Designed for scripting and agent use where multiple widget mutations must be applied together. Always outputs JSON.

## Composition

Operations are provided via `--ops '<JSON array>'` or `--ops-file <path>` (use `-` for stdin). POSTs to `POST /_storyboard/canvas/batch`.

Supported operation types: `create-widget`, `update-widget`, `move-widget`, `delete-widget`, `create-connector`, `delete-connector`. Operations can reference IDs of earlier `create` ops using `$0`, `$1`, etc., or named refs via the `"ref"` field.

```bash
storyboard canvas batch --canvas my-canvas --ops '[
  {"op":"create-widget","type":"sticky-note","ref":"note1","props":{"text":"First"}},
  {"op":"create-connector","start":"$note1","end":"widget-abc"}
]'
```

## Dependencies

- [`flags.js`](./flags.js.md) — `parseFlags`, `formatFlagHelp`
- [`create.js`](./create.js.md) — `ensureDevServer`, `serverPost`
- `node:fs` — reading `--ops-file`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas batch`).
