# `packages/storyboard/src/core/cli/canvasDuplicate.js`

<!--
source: packages/storyboard/src/core/cli/canvasDuplicate.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas duplicate` — creates a copy of an existing canvas with a new title. Wraps `POST /_storyboard/canvas/duplicate`.

## Composition

Required flags: `-c/--canvas` (source canvas name), `-t/--title` (new canvas title). Optional: `--json`.

```bash
storyboard canvas duplicate --canvas design-system --title "Design System Copy"
```

Returns `{ name, path }` on success.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `post`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas duplicate`).
