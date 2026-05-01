# Prototype Embed Lazy Loading with Snapshots

## Problem

Prototype embed iframes on canvas are expensive — each one loads a full React app. On a canvas with multiple prototype embeds, this causes slow load times and high memory usage. We want to defer iframe loading until the user interacts.

## Approach

### Snapshot capture (dev only)
- After a prototype embed iframe finishes loading (or after resize), capture screenshots in both light and dark theme
- Upload the screenshots to the canvas image server
- Store the filenames as widget props (`snapshotLight`, `snapshotDark`)

### Lazy loading (dev + prod)
- On canvas load, show the snapshot image instead of the iframe
- Show "Click to interact" overlay on top of the snapshot
- On hover: start loading the iframe (hidden behind the snapshot)
- On click: hide the snapshot, show the iframe in interactive mode

## Snapshot capture mechanism

Use `postMessage` to request the embedded prototype capture its own viewport:
1. The embed adds `_sb_embed` query param — the prototype runtime already knows it's embedded
2. Send a `storyboard:embed:capture` message to the iframe
3. The prototype runtime uses `html2canvas` (or `document.documentElement` → canvas) to capture
4. Sends back a `storyboard:embed:snapshot` message with the data URL
5. PrototypeEmbed uploads to the image server and stores as widget prop

Alternative (simpler): Use a `<canvas>` element with `drawImage(iframe)` — works for same-origin iframes. This avoids instrumenting the prototype runtime.

## Files to change

| File | Action | Description |
|------|--------|-------------|
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | Modify | Add snapshot display, lazy iframe loading, capture logic |
| `packages/react/src/canvas/widgets/PrototypeEmbed.module.css` | Modify | Add snapshot image styles |
| `packages/react/src/canvas/canvasApi.js` | Verify | uploadImage already exists |

## Implementation steps

### 1. Add snapshot state and display
- New props: `snapshotLight`, `snapshotDark` read from widget props
- New state: `iframeReady` (iframe loaded), `showIframe` (user clicked)
- Show snapshot image when available and `!showIframe`
- On hover: start preloading iframe (set `preload=true`)
- On click: set `showIframe=true` and enter interactive mode

### 2. Add iframe capture logic (dev only)
- After iframe `load` event: wait 1s for rendering, then capture
- Capture using `canvas.drawImage(iframe)` for same-origin
- Capture twice: once with current theme, switch theme via postMessage, capture again
- Upload both to image server
- Store as widget props via onUpdate

### 3. Trigger re-capture on resize
- After resize completes (debounced), re-capture snapshots

## Edge cases
- External URLs (https://...) cannot be captured → skip snapshot, show iframe directly
- Missing snapshot → fall back to loading iframe immediately
- Sandbox restrictions may block drawImage → fall back gracefully
- Theme changes → show appropriate snapshot variant
