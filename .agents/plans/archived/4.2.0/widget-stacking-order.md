# Widget Stacking Order Fix

## Problem

Widget stacking on canvas is broken in several ways:
1. **Added widgets aren't selected** — `addWidget()` and `addStoryWidget()` (toolbar add) don't call `setSelectedWidgetIds`, so new widgets land behind existing ones. Paste flows DO select, but toolbar/image/copy flows don't.
2. **z-index soup** — the current approach uses `z-index: 1` on any hovered/selected widget (`data-tc-elevated`), which doesn't truly stack selected above others — they just all compete at the same level.
3. **No real ordering** — visual stacking is determined by DOM order (array position), but nothing reorders widgets when selected.

## Approach

Replace z-index elevation with DOM-order stacking + CSS isolation:

1. **Isolate each widget** — add `isolation: isolate` on each widget wrapper so internal z-index (chrome toolbars, resize handles, overlays) never leaks to siblings.
2. **Render selected widgets last** — sort the render array so non-selected widgets come first, selected come last. DOM order = visual stacking order. No z-index needed between siblings.
3. **Remove `data-tc-elevated` z-index** — delete the `:global(.tc-drag:has([data-tc-elevated])) { z-index: 1 }` rule. Keep `data-tc-elevated` attribute for hover styling if needed, but it no longer controls stacking.
4. **Select newly added widgets** — fix `addWidget`, `addStoryWidget`, `handleWidgetCopy`, and `processImageFile` to call `setSelectedWidgetIds(new Set([result.widget.id]))` after adding.

### Hover stacking

With this approach, hovering a widget behind another won't bring it forward (no DOM reorder on hover — too expensive). This is acceptable — selection is the interaction that elevates. If hover elevation is missed, we can revisit with a lightweight z-index:1 on hover only, scoped within the stacking context.

## Files to change

| File | Change |
|------|--------|
| `packages/react/src/canvas/CanvasPage.jsx` | Sort render array (selected last); fix `addWidget`, `addStoryWidget`, `handleWidgetCopy`, `processImageFile` to select new widget |
| `packages/react/src/canvas/CanvasPage.module.css` | Remove `.tc-drag:has([data-tc-elevated]) { z-index: 1 }`; add `isolation: isolate` on widget wrappers |
| `packages/react/src/canvas/widgets/WidgetChrome.jsx` | Keep `data-tc-elevated` for styling (selection outline etc.) — no functional change needed |

## Todos

- `fix-select-on-add` — Add `setSelectedWidgetIds` calls to `addWidget`, `addStoryWidget`, `handleWidgetCopy`, `processImageFile`
- `sort-render-order` — Sort widget render array so selected widgets are rendered last (on top)
- `css-isolation` — Add `isolation: isolate` to widget wrappers, remove z-index:1 elevation rule
- `verify` — Test that new widgets appear on top, selection brings to front, internal z-index still works
