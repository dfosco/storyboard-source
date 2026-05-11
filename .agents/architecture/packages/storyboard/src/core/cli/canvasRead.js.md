# `packages/storyboard/src/core/cli/canvasRead.js`

<!--
source: packages/storyboard/src/core/cli/canvasRead.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas read [name]` — the primary command for agents to inspect a canvas. Lists all widgets with IDs, types, positions, content, URLs, and file paths. Used constantly by agents that need to understand the canvas state before acting.

## Composition

Fetches canvas state from `GET /_storyboard/canvas/state?name=<canvas>`, then formats each widget by type. `getWidgetContent(widget)` extracts the primary content field by widget type (text for sticky-notes, markdown for markdown blocks, src/url for prototype/image/link-preview widgets). Each widget also has bounds computed via `../canvas/collision.js`.

```bash
storyboard canvas read my-canvas           # list all widgets
storyboard canvas read my-canvas --json    # raw JSON
storyboard canvas read my-canvas --id abc  # single widget
```

Canvas name defaults to the active canvas from `$STORYBOARD_CANVAS_ID` or interactive prompt.

## Dependencies

- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl`
- `../canvas/collision.js` — `getWidgetBounds`
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas read` and `canvas` with no subcommand).
