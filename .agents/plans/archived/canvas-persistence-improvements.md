# Canvas Persistence Improvements

## Problem

### Bug: Optimistic updates rolled back at random

The user reports that canvas edits (widget moves, text changes) sometimes visually revert after being made.

**Root cause (lines 664–684 of `CanvasPage.jsx`):**

```jsx
if (canvas !== trackedCanvas) {
  setTrackedCanvas(canvas)
  setLocalWidgets(canvas?.widgets ?? null)     // ← OVERWRITES optimistic state
  setLocalConnectors(canvas?.connectors ?? [])
  setLocalSources(canvas?.sources ?? [])
  // ...
}
```

The race condition:
1. User edits widget → `setLocalWidgets(optimistic)` → schedules debounced save (2s delay)
2. **Before the 2s fires**, an HMR push arrives from a *previous* save (or a data-plugin file watcher event)
3. `useCanvas` merges server data → the `canvas` prop reference changes
4. `canvas !== trackedCanvas` is `true` → line 668 replaces `localWidgets` with the stale server state
5. The optimistic edit vanishes — **rollback**

This is non-deterministic because it depends on timing: how fast the server pushes HMR, whether Vite's file watcher triggers, network latency, debounce alignment. That's why it appears "random."

### Secondary issue: HMR echo overhead

Every save triggers: HTTP round-trip → server appends JSONL → server re-reads entire file → pushes full state back over WebSocket → browser re-processes. The append is fast; everything else is unnecessary overhead.

---

## Current Architecture

| Layer | File | Role |
|-------|------|------|
| API client | `packages/react/src/canvas/canvasApi.js` | `fetch()` wrappers for each endpoint |
| UI state | `packages/react/src/canvas/CanvasPage.jsx` | Local-first React state, debounced saves, write queue |
| Canvas hook | `packages/react/src/canvas/useCanvas.js` | Fetches on mount, listens to HMR updates |
| Server API | `packages/core/src/canvas/server.js` | HTTP routes, `appendEvent()`, `pushCanvasUpdate()` |

---

## Proposed Fix: Two-Phase Approach

### Phase 1: Fix the Rollback Bug (immediate)

**Goal:** Stop the HMR echo from overwriting in-flight optimistic state.

**Approach — Write-epoch guard:**

The `canvas !== trackedCanvas` block currently replaces local state unconditionally. Instead:

1. **Track a "dirty" flag** — set to `true` when the user makes an optimistic edit, cleared when the debounced save completes (or on save error).
2. **When `canvas` changes and dirty is true, skip the local state replacement** — the optimistic state is more recent than the server state. The next save will persist it, and the subsequent HMR push (after dirty clears) will reconcile.
3. **When `canvas` changes and dirty is false, replace as today** — this handles genuine external updates (CLI, agent, other tab).

Alternatively (simpler but coarser): **suppress the `canvas !== trackedCanvas` replacement entirely when a debounced save is pending**. The `debouncedSave.pending()` check already exists on lodash/debounce.

**Files to change:**
- `packages/react/src/canvas/CanvasPage.jsx` — add dirty/pending guard to the canvas-sync block (lines 664–684)

This is a surgical 5–10 line fix that directly addresses the reported bug.

### Phase 2: WebSocket Write Channel (eliminate echo entirely)

**Goal:** Remove the HTTP round-trip and HMR echo path so the rollback race condition can't happen at all.

**Approach:** Send JSONL events directly over the existing Vite HMR WebSocket.

**Client side:**
```
Browser → WS: { event: "storyboard:canvas-write", data: { canvas, events: [...] } }
```

**Server side:**
1. Receives WS event → validates → `appendEventRaw()` (sub-ms)
2. Broadcasts to *other* WS clients only (skips sender)
3. Does **not** call `readCanvas()` — no full file re-read

**Files to change:**
1. **`packages/core/src/canvas/server.js`** — add WS handler for `storyboard:canvas-write`, append + broadcast-to-others
2. **`packages/react/src/canvas/canvasApi.js`** — add `writeCanvasEvents()` using `import.meta.hot.send()`
3. **`packages/react/src/canvas/CanvasPage.jsx`** — swap HTTP calls for WS writes in `debouncedSave`, `handleWidgetRemove`, `handleItemDragEnd`
4. **`packages/react/src/canvas/useCanvas.js`** — no changes (HMR handler only receives other-client broadcasts)

HTTP endpoints stay as-is for CLI/agent writes.

With Phase 2, the sender never gets an echo back, so the Phase 1 guard becomes a safety net rather than the primary fix.

### Phase 3: Conflict Detection (deferred)

Per-canvas sequence numbers, WS error events on stale writes. Lower priority — single-user prototyping rarely hits real conflicts.

---

## Implementation Order

1. **Phase 1 first** — fixes the user-facing bug immediately with a small, low-risk change
2. **Phase 2 next** — eliminates the root cause (echo path) and improves performance
3. **Phase 3 later** — when multi-client editing becomes a priority

---

## Risks & Considerations

- **Phase 1 dirty guard**: If a save fails silently, the dirty flag stays true and blocks future server syncs. Need to clear on error too. Also need to handle the case where multiple widgets are edited in sequence — the flag should track per-canvas, not per-widget.
- **Phase 2 Vite version**: Need per-client WS handlers to skip the sender. Vite 5.1+ exposes `client` in WS handlers — need to verify our version.
- **Phase 2 production**: `import.meta.hot` is `undefined` in prod. Canvas editing is dev-only anyway, so natural fallback.
- **Semver**: Phase 1 is a patch (bugfix). Phase 2 is a minor (new feature, backwards compatible).
