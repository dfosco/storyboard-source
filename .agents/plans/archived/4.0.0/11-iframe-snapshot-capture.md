# In-Browser Iframe Snapshot Capture

## Problem

Canvas iframes (prototype embeds, story widgets) are expensive — each loads a full React app. On a canvas with multiple embeds, this causes slow load times and high memory usage. We need lightweight static thumbnails that replace iframes until the user explicitly interacts.

Previous snapshot code was stripped entirely in the "no-snapshots" plan. This plan builds a clean, in-browser-only system from scratch.

## Goals

1. **Capture snapshot when an iframe widget is first added** (after content renders)
2. **Re-capture on resize** (debounced, after resize completes)
3. **Re-capture on "unload"** (when user exits interactive mode — captures latest navigated state)
4. **"Refresh thumbnail" menu item** in the `...` overflow menu
5. **All captures complete in < 1 second**
6. **Dev-mode only** — captures only fire when `onUpdate` is present (`__SB_LOCAL_DEV__` and not prodMode)

## Scope

| Widget type | In-browser capture | Why |
|---|---|---|
| `prototype` (PrototypeEmbed) | ✅ Yes | Same-origin, `_sb_embed` protocol |
| `story` (StoryWidget) | ✅ Yes | Same-origin, `_sb_embed` protocol |
| `figma-embed` (FigmaEmbed) | ❌ No | Cross-origin (`embed.figma.com`), no access to content |
| `component` (ComponentWidget) | ❌ No | Dev-only widget, not deployed |

Figma embed snapshots are a separate concern — they require Playwright or a server-side approach. Excluded from this plan.

---

## Architecture

### Capture flow

```
Parent (CanvasPage)                          Child iframe (embed)
─────────────────                           ──────────────────────
                                            [content renders]
                                            [fonts ready + rAF + quiet period]
                                            ← storyboard:embed:snapshot-ready
[receives ready signal]
[sends capture request] →                   
  storyboard:embed:capture                  
  { requestId, width?, height? }            
                                            [dynamic import html-to-image]
                                            [toBlob(document.body, webp)]
                                            [blob → data URL]
                                            ← storyboard:embed:snapshot
                                              { requestId, dataUrl }
[uploads via POST /image]
[onUpdate({ snapshotLight: url })]
```

### Why postMessage + html-to-image (not canvas.drawImage)

| | html-to-image | canvas.drawImage |
|---|---|---|
| CSS fidelity | ✅ Full (SVG foreignObject) | ❌ Misses transforms, shadows, pseudo-elements |
| Web fonts | ✅ Handled | ❌ Often missing |
| Speed | ~300-500ms | ~30-50ms |
| Cross-origin | Works via postMessage | Same-origin only |

For a design tool where visual fidelity matters, html-to-image is the right tradeoff. The 300-500ms cost is acceptable given the 1s budget and sequential capture pattern (never multiple widgets capturing simultaneously).

### Why NOT a background Playwright process

- Playwright adds ~2-5s startup latency per capture session
- Requires Chromium installed (not always available in consumer repos)
- Adds operational complexity (process lifecycle, port management)
- In-browser capture is simpler, faster, and more reliable for same-origin content

---

## Implementation

### Phase 1: Embed-side capture infrastructure

> Adds the child-iframe side: ready signaling and capture response handling.

#### `packages/core/src/mountStoryboardCore.js`

Extend the existing `isEmbed` block (lines 201-229) to add two capabilities after the navigation broadcasting:

**1. Snapshot-ready signal**

```js
// After navigation broadcasting setup...

// Signal to parent that content is ready for snapshot capture
Promise.all([
  document.fonts.ready,
  // Wait for paint: 2 rAF ticks guarantee at least one
  // composited frame has been produced
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))),
]).then(() => {
  // Additional quiet period for React hydration / data loads
  // Embeds can call window.__sbSnapshotReady() to signal early
  const FALLBACK_DELAY = 1500
  if (!window.__sbSnapshotReadySent) {
    setTimeout(() => {
      if (!window.__sbSnapshotReadySent) {
        window.__sbSnapshotReadySent = true
        window.parent.postMessage(
          { type: 'storyboard:embed:snapshot-ready' },
          '*'
        )
      }
    }, FALLBACK_DELAY)
  }
})

// Allow embeds to signal readiness explicitly (faster path)
window.__sbSnapshotReady = () => {
  if (!window.__sbSnapshotReadySent) {
    window.__sbSnapshotReadySent = true
    window.parent.postMessage(
      { type: 'storyboard:embed:snapshot-ready' },
      '*'
    )
  }
}
```

**Timing strategy (addresses rubber-duck critique #4):**
- `document.fonts.ready` + 2 `requestAnimationFrame` ticks ensure first paint has occurred
- 1.5s fallback delay handles React hydration and data loading for complex prototypes
- `window.__sbSnapshotReady()` allows pages/stories to signal readiness explicitly (fast path)
- A sent flag prevents duplicate signals

**2. Capture handler**

```js
window.addEventListener('message', async (e) => {
  if (e.source !== window.parent) return
  if (e.data?.type !== 'storyboard:embed:capture') return

  const { requestId, width, height } = e.data
  try {
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(document.body, {
      type: 'image/webp',
      quality: 0.85,
      width: width || document.documentElement.clientWidth,
      height: height || document.documentElement.clientHeight,
      pixelRatio: 2,
    })
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    window.parent.postMessage(
      { type: 'storyboard:embed:snapshot', requestId, dataUrl },
      '*'
    )
  } catch (err) {
    window.parent.postMessage(
      { type: 'storyboard:embed:snapshot', requestId, error: err.message },
      '*'
    )
  }
})

// Prewarm html-to-image import after ready signal
// (cuts ~50ms from first capture)
document.fonts.ready.then(() => {
  import('html-to-image').catch(() => {})
})
```

#### `packages/react/src/story/StoryPage.jsx`

Stories have no data loading — they render immediately. Add a fast-path ready signal in embed mode:

```js
// In the embed-mode branch (after existing embed check)
if (isEmbed && window.parent !== window) {
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__sbSnapshotReady?.()
    }))
  })
}
```

This fires the explicit ready signal in ~30ms instead of waiting for the 1.5s fallback.

#### Dependency: `html-to-image`

Add to `packages/core/package.json` as a regular dependency. It's dynamically imported only in embed mode, so it has **zero impact on the main app bundle**. Only embedded iframes pay the cost, and only on first capture.

```bash
cd packages/core && npm install html-to-image
```

---

### Phase 2: Server-side snapshot routing

> Restores snapshot directory handling in the canvas server with stable naming.

#### `packages/core/src/canvas/server.js`

**Changes to the image routes section (lines 625+):**

1. Add `snapshotsDir`:
```js
const snapshotsDir = path.join(root, 'assets', 'canvas', 'snapshots')
```

2. Add `resolveWriteDir(canvasName)` — route snapshot uploads to the snapshots directory:
```js
function resolveWriteDir(canvasName) {
  return canvasName?.startsWith('snapshot-') ? snapshotsDir : imagesDir
}
```

3. Update `resolveImagePath(filename)` — check snapshots dir first, then images:
```js
function resolveImagePath(filename) {
  const snapshotPath = path.join(snapshotsDir, filename)
  if (fs.existsSync(snapshotPath)) return snapshotPath
  const imagePath = path.join(imagesDir, filename)
  if (fs.existsSync(imagePath)) return imagePath
  return null
}
```

4. Support explicit `filename` in POST /image — when a `filename` field is provided in the request body, use it instead of auto-generating. This allows the parent to request stable names like `snapshot-{widgetId}--latest.webp`:

```js
// In POST /image handler, after buffer validation:
const explicitName = body.filename
if (explicitName) {
  // Validate: must match snapshot naming pattern, no path traversal
  if (/^snapshot-[a-z0-9-]+--latest\.webp$/.test(explicitName)) {
    filename = explicitName
  }
}
```

5. Use `resolveWriteDir(canvasName)` as the `targetDir`:
```js
const targetDir = resolveWriteDir(canvasName || '')
```

**Naming convention:** `snapshot-{widgetId}--latest.webp`
- One file per widget (overwritten in place)
- No timestamp accumulation — old snapshots directory can be cleaned up
- Theme variant stored in widget props key (`snapshotLight` vs `snapshotDark`), not filename
  - Rationale: each theme capture overwrites the same file, and the widget prop URL includes a `?v=` cache-buster that changes on each write

#### `packages/core/src/vite/server-plugin.js`

1. Re-add snapshots dir to `watcher.unwatch()` to prevent HMR reloads on snapshot writes
2. Re-add snapshots dir to `generateBundle` emission loop so snapshots are included in production builds

---

### Phase 3: Shared capture hook

> New file: `packages/react/src/canvas/widgets/useSnapshotCapture.js`

A React hook encapsulating the parent-side capture orchestration:

```js
export function useSnapshotCapture({
  iframeRef,     // ref to the <iframe> element
  widgetId,      // widget ID for naming
  onUpdate,      // prop persist callback (null in prod)
  canvasTheme,   // current canvas theme ('light' | 'dark' | 'dark_dimmed' etc.)
})

// Returns:
// {
//   iframeReady: boolean,     — true once snapshot-ready received
//   requestCapture: () => void, — trigger a capture
// }
```

**Internal state:**
- `capturingRef` — prevents concurrent captures (boolean ref)
- `requestIdCounter` — increments for each capture request
- `iframeReady` — state set when `snapshot-ready` received from this iframe

**postMessage listener (single effect):**

```js
useEffect(() => {
  function handler(e) {
    if (!iframeRef.current) return
    if (e.source !== iframeRef.current.contentWindow) return

    if (e.data?.type === 'storyboard:embed:snapshot-ready') {
      setIframeReady(true)
    }

    if (e.data?.type === 'storyboard:embed:snapshot') {
      // Match requestId, process result
      handleSnapshotResponse(e.data)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [iframeRef])
```

**`requestCapture()` implementation:**

```js
const requestCapture = useCallback(() => {
  if (!onUpdate) return                    // dev-mode only guard
  if (!iframeRef.current?.contentWindow) return  // no iframe mounted
  if (capturingRef.current) return         // already capturing

  capturingRef.current = true
  const requestId = ++requestIdCounter.current
  pendingRef.current = requestId

  // Send capture request to iframe
  iframeRef.current.contentWindow.postMessage({
    type: 'storyboard:embed:capture',
    requestId,
  }, '*')

  // Timeout guard — don't hang if iframe never responds
  setTimeout(() => {
    if (pendingRef.current === requestId) {
      capturingRef.current = false
      pendingRef.current = null
    }
  }, 5000)
}, [onUpdate, iframeRef])
```

**`handleSnapshotResponse()` — upload + persist:**

```js
async function handleSnapshotResponse({ requestId, dataUrl, error }) {
  if (requestId !== pendingRef.current) return  // stale response
  pendingRef.current = null

  if (error || !dataUrl) {
    console.warn('[snapshot] Capture failed:', error)
    capturingRef.current = false
    return
  }

  try {
    const filename = `snapshot-${widgetId}--latest.webp`
    const result = await uploadImage(dataUrl, `snapshot-${widgetId}`, filename)
    if (result?.filename) {
      const themeKey = canvasTheme?.startsWith('dark') ? 'snapshotDark' : 'snapshotLight'
      const cacheBust = `?v=${Date.now()}`
      onUpdate?.({ [themeKey]: `/_storyboard/canvas/images/${result.filename}${cacheBust}` })
    }
  } catch (err) {
    console.warn('[snapshot] Upload failed:', err)
  } finally {
    capturingRef.current = false
  }
}
```

**Cache invalidation (addresses rubber-duck critique #3):**
- Each capture appends `?v={timestamp}` to the snapshot URL stored in widget props
- When React re-renders with the new prop value, the `<img>` src changes → browser fetches fresh image
- Server also serves with `Cache-Control: no-cache` as a secondary guard

---

### Phase 4: Trigger integration

> Wire capture triggers into PrototypeEmbed and StoryWidget.

Both widgets get the same trigger pattern. Changes are symmetric.

#### Trigger 1: On add (initial load)

When the iframe first signals ready AND no existing snapshot prop matches this widget:

```js
const { iframeReady, requestCapture } = useSnapshotCapture({
  iframeRef, widgetId, onUpdate, canvasTheme,
})

// Capture on first ready (no existing snapshot)
useEffect(() => {
  if (!iframeReady || !onUpdate) return
  const hasValidSnapshot = (snapshotLight?.includes(widgetId)) || (snapshotDark?.includes(widgetId))
  if (!hasValidSnapshot) {
    requestCapture()
  }
}, [iframeReady]) // intentionally limited deps — fire once
```

**Mount-state note (addresses rubber-duck critique #1):**
When a widget is first added, there is no snapshot → iframe mounts immediately (Phase 5 only defers when a snapshot exists). So the iframe is available for capture. No hidden mount needed.

#### Trigger 2: On resize (debounced 1.5s)

After resize completes, wait 1.5s then recapture:

```js
const resizeTimerRef = useRef(null)

// In the resize onUp handler (after document.removeEventListener):
clearTimeout(resizeTimerRef.current)
resizeTimerRef.current = setTimeout(() => requestCapture(), 1500)

// Cleanup
useEffect(() => () => clearTimeout(resizeTimerRef.current), [])
```

The 1.5s debounce ensures the iframe has re-rendered at new dimensions before capture.

#### Trigger 3: On unload (exit interactive mode)

When the user clicks outside and exits interactive mode, capture current state:

```js
// In the exitInteractive handler / useEffect watching `interactive`:
useEffect(() => {
  // Capture when transitioning OUT of interactive mode
  if (!interactive && prevInteractiveRef.current && onUpdate) {
    requestCapture()
  }
  prevInteractiveRef.current = interactive
}, [interactive, requestCapture, onUpdate])
```

**Why this is safe (addresses rubber-duck critique #1):**
The iframe remains mounted when `interactive` goes to `false` — only Phase 5 introduces deferred unmounting. In Phase 5, the iframe teardown is delayed until after capture completes or times out (5s max). See Phase 5 notes.

#### Trigger 4: Manual — "Refresh thumbnail"

Added to `handleAction` via `useImperativeHandle`:

```js
useImperativeHandle(ref, () => ({
  handleAction(actionId) {
    // ... existing actions ...
    if (actionId === 'refresh-thumbnail') {
      requestCapture()
    }
  },
}), [/* ... existing deps ..., requestCapture */])
```

**When iframe is not mounted (snapshot view):**
Clicking "Refresh thumbnail" calls `requestCapture()` which checks `iframeRef.current?.contentWindow`. If null (iframe not mounted), it no-ops silently. The user must click the widget to enter interactive mode first, then use "Refresh thumbnail" to force a new capture.

This is an acceptable UX tradeoff — the alternative (hidden iframe mount) adds significant complexity for a rare manual action. The "exit interactive" auto-capture (Trigger 3) means thumbnails stay fresh without manual intervention in the common case.

---

### Phase 5: Snapshot display (lazy loading)

> Show static image thumbnail when a snapshot exists, defer iframe mounting until interaction.

#### Snapshot validation

```js
const snapshotMatchesWidget = (url) => url && widgetId && url.includes(widgetId)
const validSnapshot = snapshotMatchesWidget(
  canvasTheme?.startsWith('dark') ? snapshotDark : snapshotLight
) ? (canvasTheme?.startsWith('dark') ? snapshotDark : snapshotLight) : null
```

#### Render logic

```
if (validSnapshot && !showIframe):
  → Render <img src={validSnapshot}> + "Click to interact" overlay
  → No iframe in DOM

if (!validSnapshot || showIframe):
  → Render <iframe> as today
  → "Click to interact" overlay when not interactive
```

State: `showIframe` starts `false` when `validSnapshot` exists, `true` otherwise.

#### Interaction flow

1. **Snapshot showing** → User clicks → `showIframe = true` → iframe mounts → "Click to interact" overlay while loading
2. **Iframe ready** → `iframeReady = true` → overlay hidden → interactive mode
3. **User clicks outside** → `interactive = false` → Trigger 3 fires capture → after capture: `showIframe = false` → snapshot shown with updated image

**Delayed teardown (addresses rubber-duck mount concern):**
When exiting interactive mode, do NOT immediately set `showIframe = false`. Instead:
1. Request capture
2. Keep iframe mounted until capture completes or 5s timeout
3. Then set `showIframe = false` to unmount iframe and show snapshot

```js
// In exit-interactive handler:
if (onUpdate && iframeRef.current?.contentWindow) {
  requestCapture()
  // Delay teardown — hook sets showIframe=false after capture resolves
  teardownTimerRef.current = setTimeout(() => setShowIframe(false), 5000)
} else {
  setShowIframe(false)
}

// In handleSnapshotResponse (hook callback or effect):
// After successful capture + persist, call setShowIframe(false) and clear timer
```

#### No hover preloading (intentional)

The previous architecture critique identified hover-preloading (mounting hidden iframes on hover) as a source of the original performance problem. This plan uses **click-only activation**:
- Hover shows "Click to interact" hint (no iframe mount)
- Click mounts iframe and enters interactive mode
- This keeps startup iframe count at zero

---

### Phase 6: Config + menu item

#### `packages/core/widgets.config.json`

Add to both `prototype` and `story` feature arrays, positioned before `copy-link`:

```json
{
  "id": "refresh-thumbnail",
  "type": "action",
  "action": "refresh-thumbnail",
  "label": "Refresh thumbnail",
  "icon": "image",
  "menu": true
}
```

#### `packages/react/src/canvas/widgets/WidgetChrome.jsx`

No changes needed — the overflow menu already renders all features with `menu: true` and routes non-standard actions through `widgetRef.current.handleAction()`.

---

## Performance Budget

| Operation | Expected time | Notes |
|---|---|---|
| `snapshot-ready` signal | 50-1500ms | Fast for stories (~50ms), fallback for prototypes (1.5s) |
| html-to-image prewarm | 0ms (prewarmed) | Import starts after ready signal |
| `toBlob()` capture | 200-500ms | Depends on DOM complexity |
| Blob → data URL | ~10ms | FileReader |
| Upload to dev server | 10-30ms | Local filesystem write |
| `onUpdate` persist | ~0ms | Batched/debounced |
| **Total (after ready)** | **~250-550ms** | ✅ Well within 1s |

**First capture cold path** (html-to-image not yet imported): add ~50ms for dynamic import. Still within budget.

**Worst case** (very complex prototype DOM): up to 800ms for `toBlob()`. Still within 1s.

---

## Theme Handling

**Current approach: single-theme capture.**

Each capture writes to the prop key matching the current canvas theme:
- Light → `snapshotLight`
- Dark variants → `snapshotDark`

On canvas load, the snapshot matching the current theme is shown. If it's missing (e.g., user only worked in light mode), the iframe loads immediately — same as no-snapshot behavior.

**Not in scope (future follow-up):**
- Dual-theme capture (mount iframe twice with different themes)
- Theme propagation contract improvements (ensuring embed actually renders in the requested theme)
- These are deferred because they add complexity and the single-theme approach covers the common case

---

## Files Changed

| File | Action | Description |
|---|---|---|
| `packages/core/src/mountStoryboardCore.js` | Modify | Add snapshot-ready signal + capture handler in embed block |
| `packages/react/src/story/StoryPage.jsx` | Modify | Add fast-path ready signal in embed mode |
| `packages/core/package.json` | Modify | Add `html-to-image` dependency |
| `packages/core/src/canvas/server.js` | Modify | Add snapshotsDir, resolveWriteDir, explicit filename support |
| `packages/core/src/vite/server-plugin.js` | Modify | Re-add snapshots dir to watcher unwatch + build emission |
| `packages/react/src/canvas/widgets/useSnapshotCapture.js` | Create | Shared capture hook |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | Modify | Integrate capture hook + triggers + snapshot display |
| `packages/react/src/canvas/widgets/PrototypeEmbed.module.css` | Modify | Snapshot image styles |
| `packages/react/src/canvas/widgets/StoryWidget.jsx` | Modify | Integrate capture hook + triggers + snapshot display |
| `packages/react/src/canvas/widgets/StoryWidget.module.css` | Modify | Snapshot image styles |
| `packages/core/widgets.config.json` | Modify | Add refresh-thumbnail feature to prototype + story |
| `packages/react/src/canvas/canvasApi.js` | Modify | Pass `filename` parameter through `uploadImage()` |

---

## Edge Cases

1. **External prototype URLs** (`https://...`) — skip capture (cross-origin), iframe loads directly
2. **Missing/stale snapshots** — iframe loads immediately, no error state
3. **Concurrent captures** — `capturingRef` prevents overlap
4. **Capture timeout** — 5s timeout clears pending state, capture silently fails
5. **Widget deleted during capture** — component unmounts, cleanup cancels pending state
6. **Existing snapshot props in JSONL** — old timestamped snapshot URLs in JSONL will fail the `url.includes(widgetId)` validation and be treated as "no snapshot" → iframe loads → new capture generates correct URL
7. **Zoom/scale (PrototypeEmbed)** — capture dimensions sent in postMessage match the iframe's internal viewport (`width/scale × height/scale`), not the CSS-transformed display size

---

## Testing Plan

| Test | Type | What it validates |
|---|---|---|
| Capture handler responds to postMessage | Unit | mountStoryboardCore embed capture flow |
| Ready signal fires after fonts + rAF | Unit | Timing of snapshot-ready |
| `useSnapshotCapture` sends/receives messages | Unit | Hook message orchestration |
| Cache-busting `?v=` param changes per capture | Unit | Cache invalidation |
| Snapshot validates against widgetId | Unit | Stale snapshot rejection |
| Upload routes to snapshots dir | Unit | Server resolveWriteDir |
| Stable filename overwrites existing file | Integration | No file accumulation |
| Capture on add (no existing snapshot) | Integration | Trigger 1 |
| Debounced capture on resize | Integration | Trigger 2 |
| Capture on exit interactive | Integration | Trigger 3 |
| Refresh thumbnail action dispatches capture | Integration | Trigger 4 + menu wiring |
| Snapshot display → click → iframe mount | Integration | Phase 5 lazy loading |
| Delayed teardown waits for capture | Integration | Mount-state safety |

---

## Open Questions

1. **Old snapshot cleanup** — `assets/canvas/snapshots/` has accumulated timestamped files from the old system. Should we add a cleanup script or gitignore them?
2. **Prod snapshot display** — snapshots created in dev are available in prod builds (via server-plugin emission). Should prod also show "Click to interact" overlays, or just load iframes directly?
3. **CI snapshot generation** — this plan is in-browser only. Should we re-add a CI workflow for initial snapshot seeding in repos where dev capture hasn't run? (Separate plan.)
