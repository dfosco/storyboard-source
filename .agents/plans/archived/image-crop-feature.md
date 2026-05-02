# Image Crop Feature — Implementation Plan

## Problem

Add a browser-based image cropping tool to the canvas image widget. When activated from the "Image actions" dropdown, crop handles appear around the image. The user drags them to define a crop region (with a dark overlay over the excluded area), then can **save**, **undo**, or **cancel** from a contextual toolbar.

### Crop save behavior
- A new image file is generated server-side: `{original-base}--cropped--{timestamp}.{ext}`
  - If re-cropping an already-cropped image, the `--cropped--{timestamp}` suffix is replaced (not stacked)
- The widget updates its `src` to point to the new cropped file
- The old image file is preserved on disk

### Undo behavior
- After saving a crop, "undo" replaces the widget's `src` back to the **previous** image
- The cropped file stays on disk (user may redo later)
- This is a widget-level undo (swap src), not a file-system undo

### Three interaction model stories

We'll prototype three different UX approaches for the crop toolbar as **canvas stories** so we can compare them side-by-side on the canvas.

---

## Story A — "Inline Toolbar Swap"

The existing widget toolbar is **replaced** while in crop mode.

- Entering crop: toolbar buttons fade out, replaced by **Save ✓**, **Undo ↩**, **Cancel ✕**
- Exiting crop (save/cancel): original toolbar fades back in
- Pro: Minimal chrome; reuses the toolbar's exact position
- Con: Slightly disorienting if the user expects the toolbar to stay

**Implementation:**
- `ImageWidget` gains a `cropActive` state
- When `cropActive`, the widget renders `<ImageCropOverlay>` over the image
- `ImageWidget.handleAction('crop')` toggles crop mode on
- `useImperativeHandle` exposes a `getCropToolbarFeatures()` method that WidgetChrome reads to swap features
- Actually simpler: ImageWidget renders its own mini-toolbar **inside** the widget frame when cropping, and tells WidgetChrome to hide via a `data-crop-active` attribute

**Revised approach — self-contained in ImageWidget:**
- When crop is active, ImageWidget renders:
  1. `<CropOverlay>` — handles + dark mask
  2. `<CropToolbar>` — floating bar with Save/Undo/Cancel, positioned below the image (same spot as WidgetChrome toolbar)
- WidgetChrome hides its toolbar when `data-crop-active` is set on the widget slot
- This keeps all crop logic inside ImageWidget without modifying WidgetChrome's API

---

## Story B — "Fixed Panel Below" (Sticky-Note Color Picker Pattern)

A panel slides down from the toolbar, similar to the sticky note color picker.

- The "Crop" button in the dropdown triggers a fixed panel that appears **below the toolbar**
- Panel contains: Save, Undo, Cancel buttons + crop dimensions display
- Clicking outside the panel does **NOT** dismiss it (unlike the color picker) — only explicit Cancel/Save does
- Pro: Familiar pattern; toolbar stays visible
- Con: More vertical space used; panel could overlap nearby widgets

**Implementation:**
- Same `<CropOverlay>` component for the handles/mask
- A `<CropPanel>` component rendered as a child of WidgetChrome (via portal or direct child)
- The panel is absolutely positioned below the toolbar
- pointerdown-outside is intercepted but does NOT close the panel (only Cancel/Save)

---

## Story C — "Floating Toolbar" (Open-ended idea)

A detached floating toolbar appears **on top of the image**, anchored to the crop region.

- When crop activates, a compact floating bar appears centered above the crop selection
- As the crop region moves/resizes, the bar follows
- Contains: Save, Undo, Cancel + live crop dimensions (e.g., "400×300")
- The bar has a slight backdrop blur and is semi-transparent
- Pro: Context stays right where the user is working; no toolbar displacement
- Con: Could overlap image content; needs careful positioning

**Implementation:**
- `<CropOverlay>` tracks the crop rect in state
- `<FloatingCropBar>` uses absolute positioning relative to the crop rect's top-center
- Bar re-positions on every drag frame via a callback from the crop handles
- Falls back to bottom-center if the crop rect is too close to the top edge

---

## Shared Components (all three stories use these)

### `CropOverlay` — the crop interaction layer
- Renders 4 drag handles (corners) + 4 edge handles
- Dark semi-transparent overlay on the excluded region (CSS mask or 4 rect divs)
- Tracks crop rect as `{ x, y, width, height }` relative to the image's natural dimensions
- Emits `onCropChange(rect)` on every drag frame
- Emits `onCropComplete(rect)` on pointer-up
- Handles minimum crop size (e.g., 20×20px)
- Constrained to image bounds

### `cropImage` — canvas API helper
```js
export function cropImage(filename, cropRect) {
  return request('/image/crop', 'POST', { filename, crop: cropRect })
}
```

### Server endpoint: `POST /image/crop`
- Receives `{ filename, crop: { x, y, width, height } }` (values are 0–1 ratios of natural dimensions)
- Uses `<canvas>` on the server? No — **this runs in the browser**
- Actually: crop is done **client-side** using an offscreen `<canvas>`, then the result is uploaded via the existing `uploadImage` API with a computed filename
- Server gets a new helper or we just use the existing upload with a specific filename format

### Client-side crop flow
1. User defines crop rect via `CropOverlay`
2. On "Save": create an offscreen canvas, draw the cropped region, export as data URL
3. Compute the new filename: `{base}--cropped--{timestamp}.{ext}`
4. Upload via `uploadImage(dataUrl, canvasId, newFilename)` — but we need the server to accept explicit filenames for non-snapshot uploads
5. Update the widget's `src` prop to the new filename

**Server change needed:** Relax the filename restriction in `POST /image` to allow `--cropped--` filenames (currently only `snapshot-*` filenames are allowed as explicit names).

---

## File Changes

| File | Change |
|------|--------|
| `packages/core/src/canvas/server.js` | Allow explicit `--cropped--` filenames in POST /image |
| `packages/react/src/canvas/canvasApi.js` | Add `cropImage()` helper (client-side crop + upload) |
| `packages/react/src/canvas/widgets/ImageWidget.jsx` | Add crop state, render CropOverlay, handle save/undo/cancel |
| `packages/react/src/canvas/widgets/ImageWidget.module.css` | Crop overlay + toolbar styles |
| `packages/react/src/canvas/widgets/CropOverlay.jsx` | **New** — shared crop interaction component |
| `packages/react/src/canvas/widgets/CropOverlay.module.css` | **New** — crop overlay styles |
| `packages/core/widgets.config.json` | Add "crop" action to image features |
| `src/canvas/examples/image-crop-inline.story.jsx` | **New** — Story A demo |
| `src/canvas/examples/image-crop-panel.story.jsx` | **New** — Story B demo |
| `src/canvas/examples/image-crop-floating.story.jsx` | **New** — Story C demo |

---

## Task Assignment

| Story | Agent | Description |
|-------|-------|-------------|
| **A — Inline Toolbar Swap** | Agent 1 | Toolbar is replaced while cropping |
| **B — Fixed Panel Below** | Agent 2 | Panel slides below the toolbar |
| **C — Floating Toolbar** | sand-swift (me) | Floating bar follows the crop region |

All three agents share the `CropOverlay` component. **sand-swift builds CropOverlay first**, then all three implement their story in parallel.
