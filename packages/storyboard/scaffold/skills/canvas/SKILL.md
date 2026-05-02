---
name: canvas
description: Work with Storyboard canvases — add, move, update, remove, and arrange widgets. Use when asked to add a sticky note, move a widget, rearrange widgets, update widget content, delete a widget, or describe canvas state.
---

# Canvas

> Triggered by: "add a sticky note", "add widget", "move widget", "delete widget", "rearrange", "update sticky", "change the text", "put a markdown", "to the right of", "below", "next to", "describe the canvas", "what's on the canvas", "list widgets", "remove widget", "look at the canvas", "read the canvas", "look at this image", "what's in this image", "describe the image"

## What This Does

Reads, manipulates, and arranges widgets on a Storyboard canvas. Supports absolute and relational positioning, bulk layout, content updates, and widget removal — all through the canvas server API.

## Prerequisites

- The dev server **must** be running (`storyboard dev` or `npm run dev`)
- The target canvas must already exist

---

## Reference: Collision Detection

**All positioning operations must use collision detection to prevent widget overlaps.**

Use the collision module at `packages/core/src/canvas/collision.js`:

```js
import { resolvePosition, findFreePosition, DEFAULT_SIZES } from './collision.js'

// For adding/moving widgets — resolves to a collision-free position
const { x, y, adjusted } = resolvePosition({
  x: targetX,
  y: targetY,
  type: 'sticky-note',
  props: { width: 270, height: 170 },  // optional — uses defaults if omitted
  widgets: existingWidgets,
  excludeId: 'widget-to-move',  // optional — for move operations
  gridSize: 24,
})

// Or use findFreePosition directly with explicit dimensions
const { x, y, adjusted } = findFreePosition({
  x: targetX,
  y: targetY,
  width: 270,
  height: 170,
  widgets: existingWidgets,
  excludeId: null,
  gridSize: 24,
})
```

**Algorithm:** Tries the target position first. If collision, moves right. If still blocked, moves down. Returns the first free position, snapped to grid.

---

## Reference: Widget Types and Default Sizes

| Type | Default W×H | Content Prop | Other Props |
|------|------------|-------------|-------------|
| `sticky-note` | 270×170 | `text` | `color` (yellow, blue, green, pink, purple, orange), `width`, `height` |
| `markdown` | 530×240 | `content` (markdown) | `width` |
| `prototype` | 800×600 | `src` (URL/path) | `label`, `zoom` (10–250), `width`, `height` |
| `figma-embed` | 800×450 | `url` | `width`, `height` |
| `image` | — | `src` (filename) | `width`, `height`, `private` |
| `link-preview` | — | `url` | `title` |

## Reference: Widget Content, URLs, and File Paths

Each widget type stores content in a different prop. When querying widgets, use this mapping:

| Type | Content Prop | URL | File Path |
|------|-------------|-----|-----------|
| `sticky-note` | `props.text` | — | — |
| `markdown` | `props.content` | — | — |
| `prototype` | `props.src` | `props.src` (prototype path) | — |
| `figma-embed` | `props.url` | `props.url` | — |
| `link-preview` | `props.url` | `props.url` | — |
| `image` | `props.src` (filename) | `/_storyboard/canvas/images/{props.src}` | `src/canvas/images/{props.src}` |

**Image widgets:** The `src` prop contains only the filename (e.g. `my-canvas--2026-04-13--10-30-00.png`). To view the actual image file, use the full path: `src/canvas/images/{props.src}`.

## Reference: Grid & Spacing

- Default grid size: **24px** (stored in the canvas JSONL as `gridSize`; fall back to 24)
- When positioning: **snap to grid** — `Math.round(value / gridSize) * gridSize`
- Standard gap between widgets: **1 grid unit** (= `gridSize`, usually 24px)

## Reference: Server API

All endpoints are at `http://localhost:{PORT}/_storyboard/canvas/`. The port is determined by the worktree:

```js
import { detectWorktreeName, getPort } from '@dfosco/storyboard-core/worktree/port'
const port = getPort(detectWorktreeName())
```

## Reference: CLI Commands

### Read canvas state (CLI)
```bash
npx storyboard canvas read              # List all canvases
npx storyboard canvas read my-canvas    # List all widgets with ID, content, URLs, file paths
npx storyboard canvas read my-canvas --json   # Output as JSON (for parsing)
npx storyboard canvas read my-canvas --id sticky-note-abc123  # Get specific widget
```

The CLI outputs widget ID, type, position, content, and file paths (for images). Use `--json` for machine-readable output that includes enriched `content`, `url`, and `filePath` fields.

## Reference: Server API

### Read canvas state
```
GET /read?name={CANVAS_NAME}
```
Returns the materialized canvas:
```json
{
  "title": "My Canvas",
  "grid": true,
  "gridSize": 24,
  "widgets": [
    {
      "id": "sticky-note-abc123",
      "type": "sticky-note",
      "position": { "x": 100, "y": 200 },
      "props": { "text": "Hello", "color": "yellow", "width": 270, "height": 170 }
    }
  ]
}
```

### List canvases
```
GET /list
```
Returns `{ canvases: [{ name, title, path, widgetCount }] }`.

### Add a widget
```
POST /widget
{ "name": "{CANVAS}", "type": "{TYPE}", "position": { "x": 0, "y": 0 }, "props": {} }
```
Or via CLI: `npx storyboard canvas add {TYPE} --canvas {NAME} --x {X} --y {Y} --props '{JSON}'`

### Remove a widget
```
DELETE /widget
{ "name": "{CANVAS}", "widgetId": "{WIDGET_ID}" }
```

### Bulk update (move, resize, reorder, update props)
```
PUT /update
{ "name": "{CANVAS}", "widgets": [ ...full widgets array... ] }
```
This replaces the entire widgets array. **Always read the current state first**, modify the array, then PUT it back.

### Update canvas settings
```
PUT /update
{ "name": "{CANVAS}", "settings": { "title": "...", "grid": true, "gridSize": 24, ... } }
```
Allowed setting keys: `title`, `description`, `grid`, `gridSize`, `colorMode`, `dotted`, `centered`, `author`, `snapToGrid`.

---

## Procedure

### Step 1: Identify the canvas

If the user doesn't specify which canvas:
```bash
curl -s http://localhost:{PORT}/_storyboard/canvas/list
```
If there's one canvas, use it. If multiple, ask the user.

### Step 2: Read the canvas state

**Always read the current state before any operation that involves positioning or modifying existing widgets:**

```bash
curl -s "http://localhost:{PORT}/_storyboard/canvas/read?name={CANVAS_NAME}"
```

Parse the response to get the `widgets` array and `gridSize`.

### Step 3: Resolve positioning (for add/move operations)

**Absolute** — User gives coordinates:
> "Add a sticky note at 200, 400" → `x=200, y=400` (snap to grid)

**Relational** — User positions relative to another widget:

| Relation | X formula | Y formula |
|----------|-----------|-----------|
| **right of** ref | `ref.x + ref.width + gap` | `ref.y` |
| **left of** ref | `ref.x - new.width - gap` | `ref.y` |
| **below** ref | `ref.x` | `ref.y + ref.height + gap` |
| **above** ref | `ref.x` | `ref.y - new.height - gap` |
| **center aligned with** ref | `ref.x + (ref.width - new.width) / 2` | (same y, or same formula for vertical) |

Where:
- `ref.width` = `ref.props.width` or the default width for that widget type
- `ref.height` = `ref.props.height` or the default height for that widget type
- `new.width/height` = the size of the widget being placed (from props or defaults)
- `gap` = `gridSize` (typically 24)
- **Always snap the final result**: `Math.round(value / gridSize) * gridSize`

**Implicit reference** — If the user says "to the right of the blue sticky" without an ID, read the canvas state and find the matching widget by type + props (e.g. a sticky-note with `color: "blue"`). If ambiguous, ask.

**No position given** — Place near the user's viewport:
1. Read `.storyboard/.selectedwidgets.json` and check the `viewport` field
2. If viewport exists, place near `viewport.centerX, viewport.centerY` (offset slightly to avoid overlap with existing widgets)
3. If no viewport data, fall back to: empty canvas → `(0, 0)`, otherwise → right of rightmost widget or below last row

### Step 4: Execute the operation

**Adding a widget:**
```bash
npx storyboard canvas add {TYPE} --canvas {NAME} --x {X} --y {Y} --props '{JSON}'
```

**Moving a widget:**
1. Read canvas state → get widgets array
2. Find the target widget by ID
3. Update its `position` field
4. PUT the full array back:
```bash
curl -X PUT http://localhost:{PORT}/_storyboard/canvas/update \
  -H 'Content-Type: application/json' \
  -d '{"name":"{CANVAS}","widgets":[...updated array...]}'
```

**Updating widget props** (text, color, size, content, etc.):
1. Read canvas state → get widgets array
2. Find the target widget by ID
3. Merge new props into `widget.props`
4. PUT the full array back

**Removing a widget:**
```bash
curl -X DELETE http://localhost:{PORT}/_storyboard/canvas/widget \
  -H 'Content-Type: application/json' \
  -d '{"name":"{CANVAS}","widgetId":"{WIDGET_ID}"}'
```

**Rearranging / laying out multiple widgets:**
1. Read canvas state → get widgets array
2. Calculate new positions for all affected widgets using the positioning formulas
3. PUT the full updated array back in a single call

### Step 5: Confirm

After the operation, tell the user what changed. For relational positioning, confirm the calculated coordinates. For bulk operations, summarize the layout.

---

## Examples

### Add a sticky note with text
User: "Add a yellow sticky note saying 'TODO: fix bug' to my-canvas"
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 0 --y 0 --props '{"text":"TODO: fix bug","color":"yellow"}'
```

### Relational positioning
User: "Add a blue sticky to the right of sticky-note-f20afo on my-canvas"
1. Read canvas: find `sticky-note-f20afo` at `{x: 100, y: 200}` with `width: 270`
2. Calculate: x = `100 + 270 + 24 = 394` → snap to `Math.round(394/24)*24 = 384`, y = `200`
3. Run:
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 384 --y 200 --props '{"text":"","color":"blue"}'
```

### Move a widget
User: "Move sticky-note-abc123 below markdown-xyz789"
1. Read canvas: find `markdown-xyz789` at `{x: 0, y: 0}` with `height: 240`
2. Calculate: x = `0`, y = `0 + 240 + 24 = 264` → snap to `264`
3. Update the widgets array, set `sticky-note-abc123.position` to `{x: 0, y: 264}`
4. PUT the full array back

### Update content
User: "Change the text of sticky-note-abc123 to 'Done!'"
1. Read canvas, find `sticky-note-abc123`
2. Set `props.text = "Done!"`
3. PUT the full widgets array back

### Row of widgets
User: "Add three sticky notes in a row: red, blue, green"

Stride = `270 + 24 = 294` → snap to `Math.round(294/24)*24 = 288`
```bash
npx storyboard canvas add sticky-note --canvas my-canvas --x 0 --y 0 --props '{"color":"red"}'
npx storyboard canvas add sticky-note --canvas my-canvas --x 288 --y 0 --props '{"color":"blue"}'
npx storyboard canvas add sticky-note --canvas my-canvas --x 576 --y 0 --props '{"color":"green"}'
```

### Describe canvas state
User: "What's on my-canvas?"

**Option 1 — CLI (recommended):**
```bash
npx storyboard canvas read my-canvas
```
This lists all widgets with their ID, type, position, content, URLs, and file paths.

**Option 2 — API:**
1. Read canvas state via API
2. List all widgets with their type, position, key props, and ID

### Query a specific widget
User: "What's in widget sticky-note-abc123?"
```bash
npx storyboard canvas read my-canvas --id sticky-note-abc123
```
Or with JSON output for parsing:
```bash
npx storyboard canvas read my-canvas --id sticky-note-abc123 --json
```

### Remove a widget
User: "Delete the prototype embed on my-canvas"
1. Read canvas, find the widget of type `prototype`
2. Run:
```bash
curl -X DELETE http://localhost:{PORT}/_storyboard/canvas/widget \
  -H 'Content-Type: application/json' \
  -d '{"name":"my-canvas","widgetId":"prototype-xyz789"}'
```

### View an image on the canvas
User: "Look at the image on my-canvas" or "What's in this image?"

**Step 1 — Find the image widget:**
```bash
npx storyboard canvas read my-canvas --json
```
Look for widgets with `"type": "image"`. The output includes the `filePath` field.

**Step 2 — View the image file:**
Use the `view` tool with the file path from the CLI output:
```
view src/canvas/images/my-canvas--2026-04-13--10-30-00.png
```

**Image file path formula:**
- Widget prop: `props.src` (filename only)
- Full path: `src/canvas/images/{props.src}`

If multiple images exist, ask which one the user wants to view, or list them with their widget IDs.

---

## Story Components on Canvas

When creating **story components** (`.story.jsx` files) for use on a canvas:

1. **Always use Primer React components** from `@primer/react` for all UI elements — buttons, forms, layout, etc.
2. **Always use Primer Octicons** from `@primer/octicons-react` for icons.
3. **Use CSS Modules** (`*.module.css`) for any custom styling beyond Primer defaults.
4. **Use the `create` skill** to scaffold the component — never create story files manually.

These rules ensure visual consistency across all canvas widgets and prototype pages.
