# `packages/storyboard/src/core/cli/canvasDelete.js`

<!--
source: packages/storyboard/src/core/cli/canvasDelete.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas delete <widgetId>` — deletes a single widget from a canvas. Thin wrapper around `DELETE /_storyboard/canvas/widget`.

## Composition

Widget ID is the first positional argument. Required flags: `-c/--canvas`. Optional: `--json`.

```bash
storyboard canvas delete widget-abc123 --canvas my-canvas
storyboard canvas delete widget-abc123 --canvas my-canvas --json
```

Uses [`parseSimpleArgs`](./cliHelpers.js.md) and the `del` helper for the request.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `del`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas delete`).
