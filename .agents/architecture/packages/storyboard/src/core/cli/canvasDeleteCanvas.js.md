# `packages/storyboard/src/core/cli/canvasDeleteCanvas.js`

<!--
source: packages/storyboard/src/core/cli/canvasDeleteCanvas.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas delete-canvas` — deletes an entire canvas and its directory on disk. Thin wrapper around `DELETE /_storyboard/canvas/delete-canvas`.

## Composition

Required flag: `-c/--canvas`. Optional: `--json`.

```bash
storyboard canvas delete-canvas --canvas old-canvas
```

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `del`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas delete-canvas`).

## Notes

This is a destructive operation with no confirmation prompt — the caller is responsible for confirming intent before invoking.
