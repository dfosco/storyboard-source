# `packages/storyboard/src/core/canvas/compact.js`

<!--
source: packages/storyboard/src/core/canvas/compact.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/compact.js`](./compact.js.md) keeps append-only canvas logs from growing without bound. It materializes an existing `.canvas.jsonl` file and rewrites it as a single fresh `canvas_created` snapshot once the file crosses a size threshold.

## Composition

The module scans `src/canvas/` recursively:

```js
export function findCanvasFiles(root) {
  const canvasDir = path.join(root, 'src', 'canvas')
```

Compaction itself is intentionally simple and piggybacks on [`packages/storyboard/src/core/canvas/materializer.js`](./materializer.js.md):

```js
export function compactCanvas(filePath, { force = false } = {}) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const before = Buffer.byteLength(raw, 'utf-8')
  if (!force && before < COMPACT_THRESHOLD_BYTES) {
    return { compacted: false, before, after: before }
  }
  const state = materializeFromText(raw)
  const event = { event: 'canvas_created', timestamp: new Date().toISOString(), ...state }
```

`compactAll()` applies the same rewrite across every discovered canvas file.

## Dependencies

- Node `fs` and `path` for filesystem traversal and rewriting.
- [`packages/storyboard/src/core/canvas/materializer.js`](./materializer.js.md) for replay.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/cli/compact.js`
- `packages/storyboard/src/core/cli/dev.js`
- `packages/storyboard/src/core/cli/dev.legacy.js`
- `packages/storyboard/src/core/server/index.js`

## Notes

The hard threshold is `500 * 1024` bytes. This file exists because large canvas JSONL histories hurt the full Vite → watcher → HMR → React pipeline even when isolated replay looks cheap.
