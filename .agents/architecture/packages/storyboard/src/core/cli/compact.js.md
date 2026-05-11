# `packages/storyboard/src/core/cli/compact.js`

<!--
source: packages/storyboard/src/core/cli/compact.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard compact` — compacts canvas JSONL files to remove accumulated bloat. JSONL files grow with every edit (each change appends a new snapshot row); compaction materialises the final state into a single row, dramatically reducing file size and preventing HMR/Vite pipeline slowdowns.

## Composition

Three usage modes:
- `storyboard compact` — compact all canvases over the 500KB threshold
- `storyboard compact --all` — force-compact all canvases regardless of size
- `storyboard compact folder/page` — compact a specific canvas by name

Delegates to `compactAll(root, { force })` and `compactCanvas(filePath, { force: true })` from `../canvas/compact.js`. Reports before/after KB sizes and reduction percentage.

```bash
storyboard compact --all
# sticky-note-board: 4321KB → 9KB (99% reduced)
```

## Dependencies

- `../canvas/compact.js` — `compactAll`, `compactCanvas`, `findCanvasFiles`
- `@clack/prompts`

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'compact'`).

## Notes

This command is the primary remedy for the canvas performance issue described in the architecture debugging notes — a 4MB JSONL file causes full-pipeline HMR re-renders on every edit. Run `compact --all` after bulk-editing canvases.
