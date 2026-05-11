# `packages/storyboard/src/core/cli/canvasBroadcast.js`

<!--
source: packages/storyboard/src/core/cli/canvasBroadcast.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas broadcast` — toggles broadcast messaging for a widget and its connected peers. Controls how messages propagate through a canvas's connection graph.

## Composition

POSTs to `POST /_storyboard/canvas/broadcast`. Flags: `-c/--canvas` (required), `-w/--widget` (defaults to `$STORYBOARD_WIDGET_ID`), `-m/--mode` (`two-way` | `one-way` | `none`, default `two-way`), `--pass-through` (BFS traverse entire connected component), `--json`.

Uses [`ensureDevServer`](./create.js.md) to confirm the dev server is reachable before sending.

```bash
storyboard canvas broadcast --canvas my-canvas --widget abc --mode two-way --pass-through
storyboard canvas broadcast --canvas my-canvas --widget abc --mode none
```

## Dependencies

- [`create.js`](./create.js.md) — `ensureDevServer`, `serverPost`
- [`flags.js`](./flags.js.md) — `parseFlags`, `hasFlags`, `formatFlagHelp`
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas broadcast`).
