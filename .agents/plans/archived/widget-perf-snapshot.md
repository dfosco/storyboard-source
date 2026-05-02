# Widget Performance & Snapshot Optimization

## Problem

The canvas page (20 widgets, 128k×57k px surface) has two major performance issues:

1. **Zoom jank** — trackpad pinch/scroll zoom "seizes" because every zoom tick forces a synchronous React re-render of the entire widget tree via `flushSync`
2. **Slow widget quit** — exiting interactive mode blocks on a serial dual-theme snapshot capture pipeline (6+ async steps with 2-3s timeouts each)

## Profiling Summary

| Finding | Location | Impact |
|---------|----------|--------|
| `flushSync(() => setZoom())` on every wheel tick | `CanvasPage.jsx:874` | **Critical** — forces sync re-render of all 20 widgets |
| `ChromeWrappedWidget` not memoized | `CanvasPage.jsx:271` | **High** — every zoom tick rebuilds all widget subtrees |
| Inline callbacks create new refs every render | `CanvasPage.jsx:1693-1706` | **High** — defeats any future memoization |
| `saveViewportState()` on every zoom tick | `CanvasPage.jsx:883-889` | **Medium** — hot-path `localStorage.setItem()` |
| `zoom-changed` CustomEvent on every tick | `CanvasPage.jsx:1102-1108` | **Medium** — external consumers do work per tick |
| Serial dual-theme capture on quit | `StoryWidget.jsx:170-183`, `PrototypeEmbed.jsx:263-276` | **Critical** — blocks UI for seconds |
| Double snapshot preload (in hook + in exit handler) | `useSnapshotCapture.js:165-173` + `StoryWidget.jsx:172-180` | **Medium** — redundant work on slow path |
| `html-to-image` at pixelRatio:2 | `mountStoryboardCore.js:301` | **Medium** — expensive DOM clone per capture |
| No `will-change` on zoom container | `CanvasPage.jsx:1738-1743` | **Low** — missed GPU compositing hint |
| `flushSync called from inside lifecycle` console error | Browser console | **Signal** — confirms the problematic pattern |

## Implementation Plan

### Phase 1: CSS-Only Zoom (P0)

**Goal:** Make zoom a CSS-only operation that never triggers React re-renders during active zooming.

**Files:** `CanvasPage.jsx`

1. **Replace zoom React state with imperative DOM mutations during active zoom**
   - Keep `zoomRef` as source of truth during zoom gestures
   - In `applyZoom()`: instead of `flushSync(() => setZoom(clampedZoom))`, directly mutate the zoom container's `style.transform`, `style.width`, `style.height`
   - Only update React `zoom` state on zoom END (debounced ~200ms after last zoom tick) for toolbar display
   - Ensure the render path reads from the same source (CSS var or style) so unrelated re-renders don't snap back to stale zoom

2. **Remove per-tick `saveViewportState()` from `applyZoom()`** (line 883-889)
   - Unify all viewport persistence behind the existing debounced `useEffect` at line 792-807
   - The effect already runs on `[canvasId, zoom]` — once zoom state updates at zoom-end, it persists correctly

3. **Throttle `zoom-changed` CustomEvent** (line 1102-1108)
   - Emit at most every ~100ms via `requestAnimationFrame` or a throttle wrapper
   - External consumers (toolbar zoom display) don't need 60fps updates

4. **Apply `will-change: transform` only during active zoom**
   - Set a `data-zooming` attribute on the zoom container during gesture
   - CSS rule: `[data-zooming] { will-change: transform }`
   - Remove on zoom-end to avoid GPU memory pressure on the 128k surface

### Phase 2: Non-Blocking Widget Quit (P2)

**Goal:** Make exiting interactive mode feel instant by deferring snapshot work.

**Files:** `useSnapshotCapture.js`, `StoryWidget.jsx`, `PrototypeEmbed.jsx`

1. **Decouple iframe teardown from snapshot capture**
   - On quit: `setInteractive(false)` + `setShowIframe(false)` immediately (show snapshot image right away)
   - Fire snapshot capture as a background task that doesn't block the UI
   - Keep iframe mounted but hidden (`visibility: hidden`) during background capture, then unmount

2. **Pipeline dual-theme capture** 
   - Overlap: upload capture-1 while switching theme + capturing capture-2
   - Remove the redundant Image preload in `useSnapshotCapture.js:165-173` — the widget exit handler already preloads

3. **Add capture generation tokens for race protection**
   - Increment a generation counter on each capture request
   - Discard stale results (check generation before calling `onUpdate`)
   - Prevents older background captures from overwriting newer snapshots

4. **Reduce pixelRatio from 2 → 1 for snapshot capture**
   - In `mountStoryboardCore.js:301`: `pixelRatio: 1`
   - Canvas thumbnails are viewed zoomed out — 2x resolution is wasted
   - Halves the work for `html-to-image`

### Phase 3: Widget Memoization (P1)

**Goal:** Prevent unnecessary re-renders of widget subtrees during non-zoom state changes.

**Files:** `CanvasPage.jsx`

1. **Wrap `ChromeWrappedWidget` in `React.memo`**
   - Custom comparator: check `widget` (by reference or shallow props), `selected`, `multiSelected`, `readOnly`
   - Skip re-render when only zoom, selectedWidgetIds (for other widgets), or canvas-level state changes

2. **Stabilize callback references**
   - `onDeselect={() => setSelectedWidgetIds(new Set())}` → extract to a stable `useCallback`
   - `onSelect`, `onRemove`, `onUpdate` — use `useCallback` with stable refs pattern
   - `onCopy` — same treatment

3. **Consider `useMemo` for the `allChildren` array**
   - Only if profiling still shows widget subtree cost after P0

### Phase 4: CSS Paint Optimization (P3) — Conditional

**Goal:** Reduce paint cost during zoom. Only if profiling shows remaining issues after P0-P2.

1. Reduce box-shadow complexity during active zoom (`[data-zooming]` selector)
2. Evaluate `content-visibility: auto` on offscreen widgets (risky with transforms — needs measurement)

## Testing Strategy

- **Zoom smoothness**: Manual test with trackpad pinch on the 20-widget canvas. Compare frame times before/after using Chrome DevTools Performance panel.
- **Widget quit latency**: Time from click-outside to iframe hidden. Should be <100ms (was multi-second).
- **Snapshot correctness**: Verify both light/dark snapshots still generate correctly after pipeline changes.
- **Race conditions**: Rapid enter/exit interactive mode, theme switching during capture.
- **Existing tests**: Run `npm test -- --run` for all canvas widget tests to ensure no regressions.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Unrelated re-render snaps zoom back | Render path must read from same imperative source (style/ref), not stale React state |
| Stale closure bugs from stabilized callbacks | Use refs for mutable values accessed by callbacks |
| Background capture races | Generation token pattern with discard on stale |
| `will-change` GPU memory spike | Only active during zoom gesture, removed on idle |
| Snapshot quality reduction (pixelRatio) | 1x is still sufficient for zoomed-out thumbnails; can make configurable |
