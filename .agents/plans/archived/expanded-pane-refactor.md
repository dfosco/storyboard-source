# ExpandedPane Refactor — Unified Expand/Split System

## Problem

The current expand/split-screen system is fragmented across widgets:

- **TerminalWidget** — rolls its own `createPortal` with custom expand backdrop, split handling, terminal reparenting + fit logic, secondary pane rendering for connected embeds
- **PrototypeEmbed** — rolls its own `PrototypeExpandModal` with iframe reparenting, split handling, secondary pane rendering (terminal/markdown/link-preview)
- **FigmaEmbed** — rolls its own `FigmaExpandModal`, nearly identical to PrototypeEmbed's version
- **MarkdownBlock** / **LinkPreview** — use the reusable `SplitExpandModal`, which *also* handles secondary pane rendering internally

This means:
1. **4 different split-screen implementations** with duplicated secondary-pane logic
2. The "secondary" pane is always a second-class citizen — it doesn't get the same rendering treatment as the "trigger" widget
3. Terminal height bugs (the reported issue) because secondary terminals get different styling than primary terminals
4. Adding a new widget type requires updating secondary pane renderers in 4+ places

## Approach

Create a single `ExpandedPane` component that owns the full-screen portal and delegates content rendering back to each widget. No widget manages its own portal or knows about split layout.

### Key Design Decisions

**Two single-pane variants:**
- **`modal`** — 90vw × 90vh centered card with border-radius, box-shadow, dark backdrop. Used by: prototype, figma, codepen, markdown, link-preview, story
- **`full`** — `position: fixed; inset: 0`, no border-radius, no padding, with a slim title bar. Used by: terminal, agent

**Split-pane mode:**
- ALL widgets render in `full` mode (fixed inset, no border-radius)
- CSS grid with `grid-template-columns: 1fr 1fr` (or `1fr 1fr 1fr` etc. for future multi-panel)
- Each pane gets a per-cell title bar label
- One shared top bar with close button + all pane labels
- Pane ordering determined by widget x-coordinates (existing logic)

**Widget rendering contract:**
- Each widget exposes a `renderExpanded(containerRef)` function (or equivalent) that renders its content into a given container
- Terminal: reparents xterm DOM + calls `fitTerminalToElement`
- Prototype/Figma: reparents iframe DOM
- Markdown/LinkPreview/Story: renders content component into container
- The ExpandedPane never knows HOW to render widget internals — it only provides the container

**Terminal-specific care:**
- `fitTerminalToElement` already works with any container element via the `terminalRegistry`
- ExpandedPane will use ResizeObserver on terminal pane containers and call `fitTerminalToElement` on resize
- Staggered fit timers (150ms, 400ms) preserved from current implementation to handle flex/grid layout settling
- On collapse, widget restores its own inline size

**Future multi-panel:**
- The grid layout naturally supports N columns: `grid-template-columns: repeat(N, 1fr)`
- `findConnectedSplitTarget` currently enforces exactly-1-connection — this constraint lives in expandUtils and can be relaxed to return multiple targets
- The `SplitScreenTopBar` (renamed to `ExpandedPaneTopBar`) takes an array of `{ label, active }` instead of fixed left/right
- Pane ordering generalizes from binary `primaryIsLeft` to sorted-by-x array

## Implementation Plan

### Phase 1: Create `ExpandedPane` component

**New file: `packages/react/src/canvas/widgets/ExpandedPane.jsx`**

```
ExpandedPane({ initialPanes, variant, onClose })
```

Props:
- `initialPanes: Array<{ widgetId, label, renderContent: (containerEl) => cleanup }>` — initial ordered panes
- `variant: 'modal' | 'full'` — single-pane display mode (ignored in split, always full)
- `onClose: () => void`

Internal state:
- `panes[]` — mutable pane array (add/remove/reorder)
- `columnSizes[]` — grid column sizes (drag-to-resize)
- `activePane` — index of focused pane

Behavior:
- If `panes.length === 1` → single-pane mode using `variant`
- If `panes.length >= 2` → split-pane mode (always full, CSS grid)
- `createPortal` to `document.body`
- CSS grid layout: `grid-template-columns` driven by `columnSizes` state
- Draggable dividers between panes for resize
- Each pane's `renderContent` called with a ref to the pane container div
- Escape key closes
- Event propagation stops (pointer, key, wheel)

**New file: `packages/react/src/canvas/widgets/ExpandedPane.module.css`**

- `.backdrop` — fixed inset, z-index 100000
- `.modalContainer` — 90vw × 90vh, border-radius, box-shadow (single-pane modal)
- `.fullContainer` — fixed inset 0, flex column (single-pane full / split-pane)
- `.topBar` — slim 40px bar, flex, holds pane labels + add/close buttons
- `.topBarLabel` — individual pane label with active/muted states, draggable
- `.topBarLabelRemove` — × button on each pane label
- `.topBarAddBtn` — + button to add a new pane
- `.grid` — CSS grid body, `grid-template-columns` driven by inline style from state
- `.pane` — each grid cell, `overflow: hidden; min-width: 0; min-height: 0`
- `.divider` — drag-to-resize handle between panes (`cursor: col-resize`, thin hit area)
- `.emptyPane` — widget picker state for newly added panes
- `.widgetPicker` — filterable widget list inside empty pane

**New file: `packages/react/src/canvas/widgets/ExpandedPaneTopBar.jsx`**

Replaces `SplitScreenTopBar`. Props:
- `panes: Array<{ label, active }>` — one entry per pane
- `onClose: () => void` — close entire ExpandedPane
- `onRemovePane: (index) => void` — remove a specific pane
- `onReorderPanes: (fromIndex, toIndex) => void` — drag-reorder
- `onAddPane: () => void` — add empty pane slot

Renders:
- One draggable label chip per pane (active highlighted, muted otherwise, × remove button)
- "+" add-pane button
- Close button (rightmost)

### Phase 2: Create per-widget `useExpandedContent` hooks

Each expandable widget exports (or exposes via ref) a function that knows how to render its content into a provided container. This is the "render delegate" pattern.

**Terminal/Agent:**
- `renderExpandedContent(containerEl)` → reparent xterm DOM into containerEl, start ResizeObserver → `fitTerminalToElement`, return cleanup that restores DOM + observer
- This is essentially the existing expand logic extracted into a reusable function

**Prototype/Figma:**
- `renderExpandedContent(containerEl)` → reparent iframe into containerEl (moveBefore/prepend), return cleanup that restores iframe to inline position

**Markdown:**
- `renderExpandedContent(containerEl)` → render expanded markdown preview into container (or use React portal for this pane)

**LinkPreview:**
- `renderExpandedContent(containerEl)` → render expanded issue/link content into container

**CodePen/Story:**
- `renderExpandedContent(containerEl)` → create/reparent iframe for the embed

### Phase 3: Wire ExpandedPane into widgets

Each widget's expand trigger (`handleAction('expand')` or `handleAction('split-screen')`) now:

1. Sets `expanded = true`
2. The widget renders `<ExpandedPane>` with its own pane + any connected widget's pane
3. Connected widget resolution still uses `findConnectedSplitTarget` from expandUtils

The widget itself decides:
- Its `variant` ('modal' or 'full')
- Its `renderContent` callback
- Whether to look for connected split targets

### Phase 4: Migrate widgets one at a time

Order matters — start with the simplest (uses SplitExpandModal already) to validate the pattern, then tackle the complex ones:

1. **MarkdownBlock** — already uses SplitExpandModal. Migrate to ExpandedPane with `variant: 'modal'` + `renderContent` that renders the expanded markdown view.

2. **LinkPreview** — same as Markdown, already uses SplitExpandModal.

3. **FigmaEmbed** — has its own FigmaExpandModal. Replace with ExpandedPane + `variant: 'modal'` + iframe reparenting renderContent.

4. **PrototypeEmbed** — has its own PrototypeExpandModal. Replace with ExpandedPane + `variant: 'modal'` + iframe reparenting renderContent.

5. **TerminalWidget** — most complex due to ghostty-web sensitivity. Replace the inline portal with ExpandedPane + `variant: 'full'` + terminal reparenting/fit renderContent.

### Phase 5: Cleanup

- Delete `SplitExpandModal.jsx` + `.module.css`
- Delete `SplitScreenTopBar.jsx` + `.module.css` (replaced by ExpandedPaneTopBar)
- Remove per-widget expand CSS from individual `.module.css` files (expandBackdrop, expandBody, expandSplit, expandContainer, expandContainerSplit, expandSplitBody, etc.)
- Remove duplicated secondary-pane renderers (SecondaryPane in SplitExpandModal, PrototypeExpandModal, FigmaExpandModal)
- Clean up expandUtils.js — `buildSecondaryIframeUrl` may be simplified or removed if widgets handle their own rendering

## Terminal Sensitivity Notes

The ghostty-web terminal has specific requirements:

1. **Reparenting** — The xterm container must be physically moved (appendChild) into the new container. It cannot be re-created.
2. **Fit after layout** — `fitTerminalToElement` reads `containerEl.clientWidth/clientHeight` and calculates cols/rows from real charWidth/charHeight. This MUST happen after the CSS grid has laid out (hence 150ms + 400ms staggered timeouts).
3. **ResizeObserver** — Must observe the pane container and re-fit on every resize (window resize, split pane added/removed, drag-to-resize divider).
4. **WebSocket resize** — After computing new cols/rows, must send `{ type: 'resize', cols, rows }` over the WebSocket to the PTY backend.
5. **Collapse restore** — On un-expand, terminal must be reparented back AND resized to inline widget dimensions.

The ExpandedPane component itself doesn't need to know about any of this — it just provides a container div. The terminal's `renderContent` callback handles all the sensitivity internally via `fitTerminalToElement` + the `terminalRegistry`.

## Testing Strategy

Tests use **Vitest + @testing-library/react** (existing pattern in this repo). Test files are co-located with source files.

### `ExpandedPane.test.jsx`

**Rendering modes:**
- Renders single-pane `modal` variant (90vw centered card, backdrop, border-radius)
- Renders single-pane `full` variant (fixed inset 0, no border-radius, top bar)
- Renders split-pane (2 panes) in full mode with CSS grid
- Renders 3+ panes with correct grid-template-columns
- Doesn't render when panes array is empty

**Portal behavior:**
- Portal mounts in document.body
- Portal unmounts cleanly on close

**Pane rendering:**
- Calls each pane's `renderContent` with the container element ref
- Calls cleanup function when pane is removed or component unmounts
- Calls cleanup + re-invokes renderContent when pane's widgetId changes

**Keyboard:**
- Escape key calls onClose
- Escape doesn't propagate to parent elements

**Event isolation:**
- Pointer/key/wheel events don't propagate through backdrop

### `ExpandedPane.interactions.test.jsx`

**Drag-to-resize:**
- Dragging divider updates grid-template-columns
- Terminal pane's renderContent cleanup + refit is called after resize settles
- Minimum pane width enforced (can't drag to zero)
- Resize state resets when pane is removed

**Pane operations:**
- `onRemovePane` removes pane from array, grid reflows
- Removing last pane closes ExpandedPane entirely
- Removing a pane calls its cleanup function
- `onAddPane` appends empty pane slot with WidgetPicker
- `onReorderPanes` swaps pane positions, calls cleanup + re-renderContent for affected panes

### `ExpandedPaneTopBar.test.jsx`

**Labels:**
- Renders one label per pane
- Active pane label highlighted, others muted
- Labels show correct text from pane data

**Buttons:**
- Close button calls onClose
- Per-pane × button calls onRemovePane with correct index
- "+" button calls onAddPane
- × button not shown when only 1 pane remains

**Reorder:**
- Drag-start on label fires reorder callback with correct from/to indices

### `WidgetPicker.test.jsx`

**Rendering:**
- Shows all widgets from bridge state
- Groups widgets by type
- Excludes widgets already in a pane

**Filtering:**
- Filter input narrows visible widgets by label/type
- Empty filter shows all widgets
- No-match shows empty state

**Selection:**
- Clicking a widget calls onSelect with the widget data
- Close/cancel callback works

### `expandUtils.test.js`

**Existing tests for `findConnectedSplitTarget`, `getPaneOrder`, `buildSecondaryIframeUrl`, `getSplitPaneLabel`** — update to reflect any API changes.

**New tests:**
- `findConnectedSplitTargets` (plural, new) — returns array of connected split-capable widgets
- `getPaneOrderMulti` — sorts N widgets by x-coordinate
- `getSplitPaneLabel` covers all widget types (terminal, agent, prototype, figma, codepen, story, markdown, link-preview)

### Per-widget migration tests

Each migrated widget gets tests verifying the ExpandedPane integration:

**MarkdownBlock.test.jsx (extend existing):**
- Expand action renders ExpandedPane with `variant: 'modal'`
- Expanded markdown content is readable in the pane
- Connected split-screen widget produces 2-pane layout

**LinkPreview.test.jsx (extend existing):**
- Same pattern as Markdown

**PrototypeEmbed.test.jsx (extend existing):**
- Expand renders ExpandedPane with `variant: 'modal'`
- Iframe is reparented into the pane container (check DOM parent)
- Collapse restores iframe to inline container

**FigmaEmbed.test.jsx (new if not existing):**
- Same pattern as Prototype

**TerminalWidget.test.jsx (new):**
- Expand renders ExpandedPane with `variant: 'full'`
- `fitTerminalToElement` is called after expand (mock via terminalRegistry)
- Split-screen with another terminal: both panes get fit calls
- Collapse restores terminal to inline widget
- Resize (via divider drag) triggers refit

## File Change Summary

| File | Action |
|------|--------|
| `widgets/ExpandedPane.jsx` | **CREATE** — unified expand/split portal with interactive pane management |
| `widgets/ExpandedPane.module.css` | **CREATE** — all expand/split/resize/picker styles |
| `widgets/ExpandedPaneTopBar.jsx` | **CREATE** — N-pane top bar with drag-reorder, remove, add |
| `widgets/ExpandedPaneTopBar.module.css` | **CREATE** — top bar styles |
| `widgets/WidgetPicker.jsx` | **CREATE** — filterable widget picker for empty pane slots |
| `widgets/WidgetPicker.module.css` | **CREATE** — picker styles |
| `widgets/TerminalWidget.jsx` | **EDIT** — extract renderContent, use ExpandedPane |
| `widgets/TerminalWidget.module.css` | **EDIT** — remove expand-specific styles |
| `widgets/PrototypeEmbed.jsx` | **EDIT** — remove PrototypeExpandModal, use ExpandedPane |
| `widgets/PrototypeEmbed.module.css` | **EDIT** — remove expand-specific styles |
| `widgets/FigmaEmbed.jsx` | **EDIT** — remove FigmaExpandModal, use ExpandedPane |
| `widgets/FigmaEmbed.module.css` | **EDIT** — remove expand-specific styles |
| `widgets/MarkdownBlock.jsx` | **EDIT** — replace SplitExpandModal usage |
| `widgets/LinkPreview.jsx` | **EDIT** — replace SplitExpandModal usage |
| `widgets/SplitExpandModal.jsx` | **DELETE** |
| `widgets/SplitExpandModal.module.css` | **DELETE** |
| `widgets/SplitScreenTopBar.jsx` | **DELETE** |
| `widgets/SplitScreenTopBar.module.css` | **DELETE** |
| `widgets/expandUtils.js` | **EDIT** — simplify, keep findConnectedSplitTarget + getSplitPaneLabel |

## Interactive Pane Management (built into Phase 1)

ExpandedPane is not just a static layout — it's an interactive workspace. Users can manipulate panes on the fly:

### Drag-to-resize pane edges

- Vertical dividers between grid cells are draggable resize handles
- Dragging updates `grid-template-columns` from `repeat(N, 1fr)` to explicit pixel/fraction values (e.g. `2fr 1fr`)
- ResizeObserver on each pane fires `fitTerminalToElement` for terminal panes after resize settles
- Resize state is ephemeral (resets on close) — no persistence needed initially
- Implementation: thin invisible hit-area div between panes (`cursor: col-resize`), mousedown → mousemove updates CSS custom properties, mouseup commits

### Reorder panes

- Each pane's top bar label is a drag handle
- Drag a pane label left/right to reorder
- Uses the same pane array state — just reorders the array
- Smooth CSS transition on reorder (grid columns swap)

### Remove panes

- Each pane's label area has a close/remove button (× icon)
- Removing a pane:
  - If 1 pane remains → stays in expanded view (single-pane mode)
  - If 0 panes → closes the ExpandedPane entirely
  - Grid reflows to `repeat(N-1, 1fr)`
  - Terminal cleanup: if removed pane was terminal, reparent DOM back to inline widget

### Add widget to new pane

- An "Add pane" button (+ icon) in the top bar
- Clicking opens an **empty pane slot** on the right side of the grid
- The empty pane renders a **widget picker** — a filterable list of all widgets on the current canvas page
  - Reads from `window.__storyboardCanvasBridgeState.widgets`
  - Grouped by type (terminals, prototypes, embeds, etc.)
  - Search/filter input at top
  - Shows widget label + type icon
  - Excludes widgets already in a pane
- Selecting a widget fills the slot: calls `renderContent` for that widget's type
- If the user closes the picker without selecting, the empty pane is removed

### State model

```
ExpandedPane state = {
  panes: Array<{
    widgetId: string,
    label: string,
    renderContent: (containerEl) => cleanup,
    variant: 'modal' | 'full',  // per-pane hint (ignored in multi-pane)
  }>,
  columnSizes: string[],  // e.g. ['1fr', '1fr'] or ['2fr', '1fr']
  activePane: number,     // index of focused pane
}
```

Pane operations are simple array/state mutations:
- **Add:** push new pane, append '1fr' to columnSizes
- **Remove:** splice pane, splice columnSizes
- **Reorder:** swap indices in both arrays
- **Resize:** update columnSizes entry

### ExpandedPaneTopBar evolution

Takes the full pane state and renders:
- One label per pane (draggable for reorder, with × button for remove)
- Active pane highlighted
- "+" button to add pane
- Close button (closes entire ExpandedPane)

## Multi-Panel Future Extension

The architecture above already supports 3-4+ panels — it's built into Phase 1:

1. `findConnectedSplitTarget` can return an array of connected widgets (relax the exactly-1-connection constraint)
2. ExpandedPane already takes `panes[]` and uses CSS grid with `--pane-count`
3. ExpandedPaneTopBar already renders N labels with drag-reorder + remove
4. Pane ordering generalizes: sort all widgets by x-coordinate
5. Add-pane lets users manually build any layout they want

This is a cheap extension because every piece of ExpandedPane is already N-pane aware by design.
