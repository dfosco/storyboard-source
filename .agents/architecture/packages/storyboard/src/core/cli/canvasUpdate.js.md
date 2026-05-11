# `packages/storyboard/src/core/cli/canvasUpdate.js`

<!--
source: packages/storyboard/src/core/cli/canvasUpdate.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas update <widgetId>` — patches a widget's props or position in-place. Supports shorthand flags for common prop types (`--text`, `--content`, `--src`, `--url`, `--color`) as well as arbitrary JSON via `--props` and direct coordinates via `--x`/`--y`.

## Composition

Widget ID is the first positional argument. PATCHes `/_storyboard/canvas/widget` with `{ name, widgetId, props?, x?, y? }`. Shorthand flags are merged into the props object before sending.

```bash
storyboard canvas update widget-abc --canvas my-canvas --text "Updated text"
storyboard canvas update widget-abc --canvas my-canvas --x 500 --y 200
storyboard canvas update widget-abc --canvas my-canvas --props '{"color":"yellow"}'
```

Uses `serverPatch()` — a local helper wrapping `fetch(..., { method: 'PATCH' })` via [`getServerUrl()`](./serverUrl.js.md).

## Dependencies

- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl`
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas update`).
