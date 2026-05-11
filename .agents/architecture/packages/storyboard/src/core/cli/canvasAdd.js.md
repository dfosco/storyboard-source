# `packages/storyboard/src/core/cli/canvasAdd.js`

<!--
source: packages/storyboard/src/core/cli/canvasAdd.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas add <type>` — adds a new widget to an existing canvas. Handles the auto-positioning priority chain (active agent → selected widget → viewport center → last widget) and forwards to `POST /_storyboard/canvas/widget`.

## Composition

Widget type is the first positional argument. All positioning and property flags come from [`widgetSchema`](./schemas.js.md) (`--canvas`, `--x`, `--y`, `--near`, `--direction`, `--gap`, `--resolve`, `--props`, `--props-file`, `--json`).

`--props-file -` reads from stdin, making the command pipeline-friendly. The `--resolve` flag enables server-side collision detection on the target position.

```bash
storyboard canvas add sticky-note --canvas my-canvas --text "Hello"
storyboard canvas add markdown --canvas my-canvas --near widget-abc --direction below
storyboard canvas add prototype --canvas my-canvas --props-file widget.json --json
```

## Dependencies

- [`flags.js`](./flags.js.md) — `parseFlags`, `hasFlags`, `formatFlagHelp`
- [`schemas.js`](./schemas.js.md) — `widgetSchema`
- [`create.js`](./create.js.md) — `ensureDevServer`, `serverPost`, `getServerUrl`
- `@clack/prompts`, `node:fs`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas add`).
