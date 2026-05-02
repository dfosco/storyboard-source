# Canvas Read: Performance Optimizations for Large Canvases

## Problem Statement

For large canvases (10k+ JSONL lines), `canvas read <name> --id <widgetID>` materializes the entire canvas and sends the full widget array over the wire, only to filter client-side. This is wasteful when you only need one widget.

Beyond the single-widget case, the append-only JSONL format accumulates unbounded history — every move, update, and add is a new line. A canvas with 50 widgets that's been edited heavily can reach 10k+ lines even though the materialized state is only ~50 entries.

## Completed

### Server: `?widget=` query param on `/read` endpoint

**File:** `packages/core/src/canvas/server.js`

The `/read` endpoint now accepts an optional `?widget=<id>` query parameter. When present, the response only includes the matching widget in the `widgets` array. Returns 404 if the widget doesn't exist. The CLI (`canvasRead.js`) passes this param when `--id` is used.

**Impact:** Reduces response payload size. Does not reduce materialization time.

---

## Future: Reverse-scan for single widget state

### Concept

When reading a single widget, we don't need to replay the full history. Instead, scan the JSONL **backwards** (tail) looking for the most recent event that fully defines the widget's current state.

### How it would work

The materializer currently replays forward: `canvas_created` → all events → final state. For a single-widget query, we can scan backward:

1. Read the file from the end, line by line
2. Look for the **last** `widgets_replaced` event — it contains the full current widget array, so the target widget is in there. This is the most common fast-path since every drag-end and bulk edit emits `widgets_replaced`.
3. If found before hitting the start, parse just that one event and extract the widget.
4. Fall back to full materialization if no `widgets_replaced` is found (rare — only canvases that have never been bulk-saved).

### Considerations

- **`widgets_replaced` is the key event**: It's emitted on every save/drag-end and contains the full widget array. In practice, the last `widgets_replaced` is usually within the final ~10 lines.
- **Incremental events after the last `widgets_replaced`**: If there are `widget_added`, `widget_updated`, `widget_moved`, or `widget_removed` events after the last `widgets_replaced`, those would need to be replayed on top. But this is typically 0–5 events, not thousands.
- **File I/O**: Reading from the end of a file is efficient with `fs.readFileSync` + splitting from the end, or `readline` in reverse. For very large files, a streaming reverse reader avoids loading the full file.
- **API**: New function `materializeWidget(text, widgetId)` in `materializer.js` that returns a single widget or null.

### Estimated speedup

For a 10k-line JSONL with a recent `widgets_replaced` in the last 20 lines: **~500x less parsing** (20 lines vs 10,000).

---

## Future: History compaction for large canvas files

### Concept

Periodically compact a canvas JSONL by materializing its current state and rewriting the file as a single `canvas_created` event + a `widgets_replaced` event. This collapses all intermediate history into the final state.

### How it would work

1. **Trigger**: Run automatically when a JSONL file exceeds a configurable threshold (e.g., 5,000 lines or 500 KB).
2. **Process**:
   - Materialize the full current state via `materializeFromText()`
   - Write a new JSONL with two events:
     - `canvas_created` with title, settings, sources
     - `widgets_replaced` with the full widget array
   - Atomically replace the old file (write to `.tmp`, then rename)
3. **When to run**:
   - **Option A — On write**: After appending an event, check line count. If over threshold, compact in-place. Simple, but adds latency to writes.
   - **Option B — CLI command**: `storyboard canvas compact [name]` — explicit, no surprises. Can be run in CI or as a git hook.
   - **Option C — On dev server start**: Compact all large canvases during `storyboard dev` startup. One-time cost, transparent to the user.
4. **Git implications**: Compaction rewrites the file, which creates a large diff. This is fine for `.canvas.jsonl` files since they're already noisy in git. Could optionally run before commits to keep diffs clean.

### API

```js
// materializer.js
export function compact(text) → string   // Returns compacted JSONL text (2 lines)
export function shouldCompact(text, { maxLines: 5000, maxBytes: 512_000 }) → boolean
```

```bash
# CLI
storyboard canvas compact              # Compact all canvases over threshold
storyboard canvas compact <name>       # Compact a specific canvas
storyboard canvas compact --dry-run    # Show which files would be compacted
```

### Considerations

- **Data loss**: History is lost. This is intentional — the JSONL history is operational, not archival. Git history preserves the actual audit trail.
- **Undo/redo**: Hard cap of **250 undo operations** in the in-memory undo stack. Compaction only affects the on-disk file, not the live undo buffer. The 250-operation limit should be enforced in CanvasPage.jsx regardless of compaction.
- **Autosync**: If autosync is running, compaction should be coordinated to avoid conflicts. The `isRepoBusy()` guard already exists.
- **Threshold tuning**: Configurable via `storyboard.config.json` → `canvas.compactThreshold`.

### Compaction rules

Compaction uses a two-tier trigger system:

1. **Age gate**: Never compact entries less than **1 week old**. This preserves recent history for debugging and auditing, even if the file is moderately large.
2. **Hard override**: If the file exceeds **5,000 lines** or **500 KB**, compact regardless of age. At this size the performance cost outweighs the history value.

In practice:
- A canvas edited daily stays uncompacted until it's a week old or hits the hard limit.
- A heavily-edited canvas that blows past 5k lines gets compacted immediately, even if all edits happened today.
- After compaction, the file is 2 lines. The 1-week age gate only applies to the _next_ compaction cycle.

