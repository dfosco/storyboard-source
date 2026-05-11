# `packages/storyboard/src/core/cli/canvasBounds.js`

<!--
source: packages/storyboard/src/core/cli/canvasBounds.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas bounds` — queries and displays spatial bounds (position + size) for one or all widgets on a canvas. Used for spatial queries and positioning decisions by agents.

## Composition

Reads canvas state from `GET /_storyboard/canvas/state?name=<canvas>`, then for each widget computes or reads persisted bounds using `getWidgetBounds` from `../canvas/collision.js`. Output shows width × height + startX/Y + endX/Y.

```bash
storyboard canvas bounds my-canvas              # all widgets
storyboard canvas bounds my-canvas --id abc     # specific widget
storyboard canvas bounds my-canvas --json       # JSON output
```

Falls back to `getDefaultSize(type)` from the collision module when no persisted bounds exist.

## Dependencies

- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl`
- `../canvas/collision.js` — `getWidgetBounds`, `getDefaultSize`
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas bounds`).
