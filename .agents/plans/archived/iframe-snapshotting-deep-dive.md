# Iframe Snapshotting — Deep-Dive Technical Reference (4.0.0)

## Executive Summary

Storyboard's canvas hosts interactive iframe-based widgets (prototypes, stories, Figma embeds) that are expensive to render. The snapshotting system captures static PNG/WebP images of these iframes and uses them as lightweight placeholders until the user interacts. Snapshots are generated through **three independent pathways**: (1) **client-side in-browser capture** during local dev via `postMessage` + `html-to-image`, (2) **CLI batch generation** via `storyboard snapshots` using Playwright, and (3) **GitHub Actions CI** via `snapshots.yml` triggered after branch deploys. Each pathway writes images to `assets/canvas/snapshots/`, persists references as widget props (`snapshotLight`/`snapshotDark`), and serves them through the `/_storyboard/canvas/images/` URL namespace.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Canvas Page (parent)                        │
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │ PrototypeEmbed│   │ StoryWidget  │   │  FigmaEmbed  │            │
│  │  (iframe)     │   │  (iframe)    │   │  (iframe)    │            │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┘            │
│         │                  │                                         │
│         │  postMessage     │  postMessage                           │
│         ▼                  ▼                                         │
│  ┌──────────────────────────────────┐                               │
│  │ mountStoryboardCore.js (embed)   │◄── _sb_embed query param      │
│  │ - snapshot-ready signal          │                               │
│  │ - capture handler (html-to-image)│                               │
│  └──────────────┬───────────────────┘                               │
│                 │  data URL                                          │
│                 ▼                                                     │
│  ┌──────────────────────────────────┐                               │
│  │ canvasApi.js → uploadImage()     │                               │
│  │ POST /_storyboard/canvas/image   │                               │
│  └──────────────┬───────────────────┘                               │
│                 │                                                     │
│                 ▼                                                     │
│  ┌──────────────────────────────────┐     ┌─────────────────────┐   │
│  │ canvas/server.js (Vite middleware)│────▶│ assets/canvas/      │   │
│  │ - POST /image (write)            │     │   snapshots/*.png   │   │
│  │ - GET /images/* (serve)          │     │   images/*.webp     │   │
│  └──────────────────────────────────┘     └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│ CLI: storyboard snapshots            │
│ (Playwright, headless Chromium)      │
│                                       │
│ 1. Discover .canvas.jsonl files      │
│ 2. Start ephemeral Vite server       │
│ 3. Capture each widget at dimensions │
│ 4. Write PNGs to assets/canvas/      │
│    snapshots/                        │
│ 5. Append widgets_replaced to JSONL  │
│ 6. Auto-commit                       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ CI: .github/workflows/snapshots.yml  │
│                                       │
│ Trigger: workflow_run after deploy   │
│ Runs: storyboard snapshots           │
│        --changed-only                │
│ Commits snapshots back to branch     │
└──────────────────────────────────────┘
```

---

## 1. Embed Detection and the `_sb_embed` Protocol

### How an iframe becomes "embeddable"

When any storyboard page loads, `mountStoryboardCore.js` checks for the `_sb_embed` query parameter[^1]:

```js
const isEmbed = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('_sb_embed')
```

If present, the entire storyboard UI (toolbar, sidebar, etc.) is **skipped**. Instead, the embed runtime installs three capabilities[^2]:

1. **Navigation broadcasting** — intercepts `pushState`, `replaceState`, `popstate`, and `hashchange` to send `storyboard:embed:navigate` messages to the parent canvas
2. **Snapshot-ready signaling** — after fonts load + 3 second delay, sends `storyboard:embed:snapshot-ready` to the parent
3. **Capture handler** — listens for `storyboard:embed:capture` messages and uses `html-to-image` to capture `document.body`

### The postMessage Protocol

| Message Type | Direction | Payload | Purpose |
|---|---|---|---|
| `storyboard:embed:snapshot-ready` | iframe → parent | `{}` | Signals the iframe content has finished rendering and is ready for capture |
| `storyboard:embed:capture` | parent → iframe | `{ requestId }` | Requests the iframe capture its DOM as an image |
| `storyboard:embed:snapshot` | iframe → parent | `{ requestId, dataUrl }` or `{ requestId, error }` | Returns the captured image as a base64 data URL |
| `storyboard:embed:navigate` | iframe → parent | `{ src }` | Notifies parent of in-iframe navigation |

### Snapshot-ready timing

There are **two sources** of the `snapshot-ready` signal:

1. **Generic fallback** (`mountStoryboardCore.js`[^3]): Waits for `document.fonts.ready` + a 3-second `setTimeout`. This handles prototype pages where rendering involves data loading, animations, and React hydration.

2. **Story-specific** (`StoryPage.jsx`[^4]): Waits for `document.fonts.ready` + two `requestAnimationFrame` ticks (≈30ms). This fires much faster since stories have no data loading — just component rendering.

The parent widget (PrototypeEmbed or StoryWidget) listens for the first `snapshot-ready` it receives and uses that as the trigger to request a capture.

---

## 2. Client-Side Capture (Dev Mode)

### The capture mechanism inside the iframe

When the iframe receives a `storyboard:embed:capture` message, it dynamically imports `html-to-image`[^5] and calls `toBlob()`:

```js
const { toBlob } = await import('html-to-image')
const blob = await toBlob(document.body, {
  type: 'image/webp',
  quality: 0.85,
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
  pixelRatio: 2,  // Retina capture
})
```

Key parameters:
- **Format**: `image/webp` at 85% quality — balances file size with visual fidelity
- **Pixel ratio**: `2` — always captures at 2x resolution for retina displays
- **Dimensions**: Full viewport (`clientWidth × clientHeight`) of the iframe's document

The blob is converted to a base64 data URL via `FileReader.readAsDataURL()` and sent back to the parent via `postMessage`[^6].

### Upload flow

The parent widget (PrototypeEmbed or StoryWidget) receives the data URL and uploads it via the canvas API[^7]:

```js
const result = await uploadImage(dataUrl, `snapshot-${widgetId}`)
```

The `uploadImage` function calls `POST /_storyboard/canvas/image` with `{ dataUrl, canvasName }`[^8].

### Server-side routing of snapshot uploads

The canvas server's `resolveWriteDir()` function routes snapshot files to the correct directory[^9]:

```js
function resolveWriteDir(canvasName) {
  return canvasName && canvasName.startsWith('snapshot-') ? snapshotsDir : imagesDir
}
```

- If `canvasName` starts with `snapshot-` → writes to `assets/canvas/snapshots/`
- Otherwise → writes to `assets/canvas/images/`

This means snapshot uploads (where `canvasName` = `snapshot-{widgetId}`) always land in the snapshots directory, separate from user-uploaded images.

### When client-side captures happen

Client-side snapshot capture is triggered in several situations:

#### On initial load
Both PrototypeEmbed[^10] and StoryWidget[^11] listen for `storyboard:embed:snapshot-ready`. When received:
1. `setIframeLoaded(true)` — marks the iframe as loaded
2. If `onUpdate` is available (dev mode), calls `requestSnapshotCapture()`

#### On resize (debounced)
After a widget is resized, both widgets trigger a re-capture after a 2-second debounce[^12]:

```js
const triggerResizeCapture = useCallback(() => {
  if (!onUpdate) return
  clearTimeout(resizeCaptureTimer.current)
  resizeCaptureTimer.current = setTimeout(() => requestSnapshotCapture(), 2000)
}, [requestSnapshotCapture, onUpdate])
```

#### On theme change
When the canvas theme changes (light ↔ dark), a re-capture is triggered after 3 seconds to update the alternate theme variant[^13]:

```js
useEffect(() => {
  if (canvasTheme !== prevThemeRef.current && onUpdate && showIframe) {
    prevThemeRef.current = canvasTheme
    const timer = setTimeout(() => requestSnapshotCapture(), 3000)
    return () => clearTimeout(timer)
  }
}, [canvasTheme, onUpdate, showIframe, requestSnapshotCapture])
```

#### On src/prototype change (PrototypeEmbed only)
When a different prototype is selected in PrototypeEmbed, a re-capture fires after 4 seconds[^14]:

```js
useEffect(() => {
  if (src && src !== prevSrcRef.current && onUpdate && !isExternal && showIframe) {
    prevSrcRef.current = src
    const timer = setTimeout(() => requestSnapshotCapture(), 4000)
    return () => clearTimeout(timer)
  }
}, [src, onUpdate, isExternal, showIframe, requestSnapshotCapture])
```

### Theme-aware storage

Snapshots are stored as two separate widget props based on the current theme[^15]:

```js
const themeKey = canvasTheme?.startsWith('dark') ? 'snapshotDark' : 'snapshotLight'
onUpdate?.({ [themeKey]: imageUrl })
```

This means each widget can have both a light and dark snapshot, and the correct one is shown based on the active canvas theme.

---

## 3. Lazy Loading: How Snapshots Are Displayed

### The snapshot → iframe swap

Both PrototypeEmbed and StoryWidget implement an identical lazy-loading strategy:

1. **Canvas loads** → If `snapshotLight`/`snapshotDark` props exist, show the static snapshot image[^16]
2. **User hovers** → After 500ms dwell, begin preloading the iframe (hidden, behind the snapshot)[^17]
3. **User clicks** → Show the iframe, enter interactive mode[^18]
4. **Iframe loads** → Once `storyboard:embed:snapshot-ready` fires, fade from snapshot to live iframe

### Snapshot validation

A critical guard ensures snapshots belong to the current widget. Stale or mismatched snapshot URLs are rejected[^19]:

```js
const snapshotMatchesWidget = (url) => url && widgetId && url.includes(widgetId)
const validSnapshotLight = snapshotMatchesWidget(snapshotLight) ? snapshotLight : null
const validSnapshotDark = snapshotMatchesWidget(snapshotDark) ? snapshotDark : null
```

This prevents a widget from displaying another widget's snapshot if props get mixed up during canvas operations.

### Spinner UX

When the iframe is loading behind a snapshot, a spinner appears only after 500ms of loading[^20]. This avoids flash-of-spinner for fast-loading iframes:

```js
useEffect(() => {
  if (showIframe && !iframeLoaded && hasSnapshot) {
    const timer = setTimeout(() => setShowSpinner(true), 500)
    return () => clearTimeout(timer)
  }
  setShowSpinner(false)
}, [showIframe, iframeLoaded, hasSnapshot])
```

### The "Click to interact" overlay

When a snapshot is displayed, an overlay covers the widget with a "Click to interact" hint[^21]. This overlay handles:
- **Hover**: starts 500ms timer for iframe preload
- **Click**: immediately activates the iframe and enters interactive mode
- **Click-outside**: exits interactive mode (returning to snapshot display)

---

## 4. CLI Batch Generation (`storyboard snapshots`)

### Overview

The CLI tool[^22] is a standalone batch processor that:
1. Discovers all `.canvas.jsonl` files on disk
2. Spins up a temporary Vite dev server on port 19876
3. Uses Playwright (headless Chromium) to capture each embeddable widget
4. Writes PNG images to `assets/canvas/snapshots/`
5. Appends `widgets_replaced` events to the JSONL
6. Auto-commits the results

### Command syntax

```bash
storyboard snapshots              # All canvases
storyboard snapshots <name>       # Specific canvas (partial match)
storyboard snapshots --force      # Regenerate even if snapshots exist
storyboard snapshots --changed-only  # Only canvases/stories changed since HEAD~1
```

Registered in the CLI at `packages/core/src/cli/index.js:118-119`[^23].

### Canvas discovery

`findCanvasFiles()` recursively walks the project root, ignoring `node_modules`, `dist`, `.git`, `.worktrees`, and collects all `*.canvas.jsonl` files[^24]:

```js
function findCanvasFiles(root) {
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])
  // recursive walk...
}
```

### Canvas ID mapping

Each canvas file's relative path becomes its ID by stripping the `.canvas.jsonl` suffix[^25]:

```js
function toCanvasId(relPath) {
  return relPath.replace(/\.canvas\.jsonl$/, '').replace(/\\/g, '/')
}
```

### Widget filtering

Only three widget types are eligible for snapshot capture[^26]:

```js
const widgets = (state.widgets || []).filter(w =>
  w.type === 'prototype' || w.type === 'story' || w.type === 'figma-embed'
)
```

### URL resolution

The CLI resolves embed URLs differently for each widget type via `resolveEmbedUrl()`[^27]:

| Widget Type | URL Pattern | Notes |
|---|---|---|
| `prototype` | `{serverUrl}{path}?_sb_embed` | Strips branch prefixes, preserves hash |
| `story` | `{serverUrl}/components/{storyId}?_sb_embed=1&export={exportName}` | Uses story route |
| `figma-embed` | `https://embed.figma.com/...?embed-host=share` | Converts figma.com → embed.figma.com |

External prototype URLs (`https://...`) are skipped — `resolveEmbedUrl()` returns `null`[^28].

### Theme handling

Non-Figma widgets get captured in both `light` and `dark` themes. Theme is injected via URL parameter[^29]:

```js
function appendThemeParam(url, theme) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_sb_theme_target=prototype&_sb_canvas_theme=${theme}`
}
```

Figma embeds only get a single `light` capture since their content doesn't respond to storyboard theme parameters[^30].

### Capture dimensions

Dimensions are computed differently per widget type[^31]:

| Widget Type | Width | Height | Notes |
|---|---|---|---|
| `story` | `rawW` | `max(rawH - 31, 100)` | Subtracts 31px for the header bar |
| `prototype` | `rawW / scale` | `rawH / scale` | Accounts for zoom factor |
| `figma-embed` | `rawW` | `rawH` | Uses raw dimensions |

Playwright viewport is set to these dimensions with `deviceScaleFactor: 2` for retina capture[^32]:

```js
const context = await browser.newContext({
  viewport: { width: captureW, height: captureH },
  deviceScaleFactor: 2,
  colorScheme: theme === 'dark' ? 'dark' : 'light',
})
```

### Page loading strategy

For each capture, a fresh browser context is created. The page navigates with `waitUntil: 'networkidle'` and a 30-second timeout, followed by an additional delay[^33]:

```js
await page.goto(themeUrl, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(isFigma ? 4000 : 2000)
```

- **Figma embeds**: 4 seconds (external page load)
- **Local prototypes/stories**: 2 seconds (Vite HMR-ready app)

### Stable filename convention

Snapshot files use deterministic names that include the canvas ID and widget ID[^34]:

```
snapshot-{canvasId}-{widgetId}--{theme}--latest.png
```

Where `canvasId` has slashes replaced with dashes. Widget props (`snapshotLight`/`snapshotDark`) reference the URL:

```
/_storyboard/canvas/images/snapshot-{canvasId}-{widgetId}--{theme}--latest.png
```

Files are overwritten in place — no accumulation of old snapshots.

### Dirty detection

When `--force` is not set, the CLI checks whether each widget actually needs regeneration via `isWidgetDirty()`[^35]:

A widget is "dirty" if:
1. **Missing snapshots** — no `snapshotLight` or `snapshotDark` prop (Figma only needs `snapshotLight`)
2. **Source file hash changed** — for `story` widgets, the source `.story.jsx` file's git hash is compared against the stored `_snapshotHash` prop

```js
function isWidgetDirty(widget, root) {
  // ...
  if (widget.type === 'story') {
    const sourceFile = resolveSourceFile(widget, root)
    if (sourceFile) {
      const currentHash = gitHashFile(sourceFile, root)
      const savedHash = widget.props?._snapshotHash
      if (currentHash && currentHash !== savedHash) return true
    }
  }
  return false
}
```

Source file hashes are computed using `git hash-object`[^36] and stored as `_snapshotHash` in the widget props alongside the snapshot URLs[^37].

### `--changed-only` mode

This flag restricts processing to canvases that actually changed since the previous commit[^38]:

1. Runs `git diff HEAD~1 --name-only` to get all changed files
2. Filters for `.canvas.jsonl` changes
3. Filters for `.story.jsx/.tsx` changes
4. For story changes, also checks which canvases reference those stories
5. Only processes the intersection

If no canvas or story files changed, exits early with "Nothing to do".

### JSONL persistence

After generating snapshots, the CLI appends a `widgets_replaced` event to the canvas JSONL file[^39]:

```js
function appendWidgetsReplaced(jsonlPath, widgets) {
  const event = {
    event: 'widgets_replaced',
    timestamp: new Date().toISOString(),
    widgets,
  }
  fs.appendFileSync(jsonlPath, serializeEvent(event) + '\n', 'utf-8')
}
```

This is the same event type used for bulk widget updates. The full widget array (with updated `snapshotLight`/`snapshotDark`/`_snapshotHash` props) is written, so replaying the JSONL produces the correct final state.

### Auto-commit

After all captures complete, the CLI stages and commits snapshot files[^40]:

```js
execSync('git add assets/canvas/snapshots/ src/canvas/', { cwd: root, stdio: 'pipe' })
execSync(
  'git commit -m "chore: update canvas snapshots [skip ci]" --no-verify --allow-empty',
  { cwd: root, stdio: 'pipe' }
)
```

The `[skip ci]` tag prevents triggering CI on the snapshot commit. `--no-verify` bypasses git hooks.

---

## 5. GitHub Actions CI (`snapshots.yml`)

### Workflow definition

Two nearly identical workflow files exist:
- **`.github/workflows/snapshots.yml`** — the repo's own workflow[^41]
- **`packages/core/scaffold/snapshots.yml`** — the template scaffolded for consumer repos[^42]

### Trigger mechanism

The workflow uses `workflow_run` to trigger **after** the branch preview deploy completes successfully[^43]:

```yaml
on:
  workflow_run:
    workflows: ["Deploy branch preview"]
    types: [completed]
```

This is non-blocking — the deploy and snapshot generation are separate jobs. The `if` condition ensures snapshots only run when the deploy succeeded[^44]:

```yaml
if: github.event.workflow_run.conclusion == 'success'
```

### Concurrency control

A concurrency group prevents parallel snapshot runs on the same branch[^45]:

```yaml
concurrency:
  group: snapshots-${{ github.event.workflow_run.head_branch }}
  cancel-in-progress: true
```

If a new push triggers while snapshots are still running, the in-progress run is cancelled.

### Steps

1. **Checkout** at the triggering SHA (with full history for `git diff`)[^46]
2. **Node setup** (Node 22)
3. **Install dependencies** (`npm ci`)
4. **Install Playwright Chromium** (`npx playwright install chromium`)
5. **Generate snapshots** (`npx storyboard snapshots --changed-only`)
6. **Commit and push** back to the source branch

### Commit-back mechanism

The workflow pushes directly to the source branch[^47]:

```bash
BRANCH="${{ github.event.workflow_run.head_branch }}"
git commit -m "chore: update canvas snapshots [skip ci]" --no-verify
git push origin HEAD:"refs/heads/${BRANCH}"
```

Key safeguards:
- `[skip ci]` prevents infinite loops (snapshot commit doesn't trigger deploy, which won't re-trigger snapshots)
- `git diff --cached --quiet` check skips the commit entirely if nothing changed
- `contents: write` permission is required

### Differences between repo and scaffold versions

| Aspect | `.github/workflows/snapshots.yml` | `scaffold/snapshots.yml` |
|---|---|---|
| Node version | Not pinned (uses default) | Pinned to 22 |
| npm install | `npm ci --legacy-peer-deps` | `npm ci` |
| Checkout action | `@v4` | `@v6` |
| Node action | `@v4` | `@v6` |

---

## 6. Image Storage and Serving

### On-disk layout

```
assets/
  canvas/
    images/       ← user-uploaded images (paste, drag-drop)
    snapshots/    ← CLI and client-side snapshot captures
```

Both directories are created by `storyboard setup`[^48]:

```js
const dirs = ['assets/canvas/images', 'assets/canvas/snapshots']
```

### Dev server: Vite middleware

During development, the canvas server serves images from both directories. The `resolveImagePath()` function checks snapshots first, then images[^49]:

```js
function resolveImagePath(filename) {
  const snapshotPath = path.join(snapshotsDir, filename)
  if (fs.existsSync(snapshotPath)) return snapshotPath
  const imagePath = path.join(imagesDir, filename)
  if (fs.existsSync(imagePath)) return imagePath
  return null
}
```

Images are served with `Cache-Control: no-cache`[^50] so snapshot updates are reflected immediately.

### Production builds: Vite `generateBundle`

At build time, the server-plugin emits both image directories as static assets[^51]:

```js
for (const dir of [
  path.join(root, 'assets', 'canvas', 'images'),
  path.join(root, 'assets', 'canvas', 'snapshots'),
]) {
  // ... read files, emit as _storyboard/canvas/images/{file}
}
```

All images end up in the `_storyboard/canvas/images/` path in the build output, regardless of their source directory. Private images (prefixed with `_`) are excluded from builds[^52].

### Watcher exclusion

The Vite server plugin explicitly unwatches both image directories to prevent HMR reloads when snapshots are written[^53]:

```js
server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'images'))
server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'snapshots'))
```

---

## 7. Widget Props Schema

### Snapshot-related props

| Prop | Type | Description | Set by |
|---|---|---|---|
| `snapshotLight` | `string` | URL to light-theme snapshot image | Client capture or CLI |
| `snapshotDark` | `string` | URL to dark-theme snapshot image | Client capture or CLI |
| `_snapshotHash` | `string` | Git hash of source file at capture time | CLI only (story widgets) |

These props are persisted in the `.canvas.jsonl` file as part of the widget's props object.

### URL format

All snapshot URLs follow the same pattern:

```
/_storyboard/canvas/images/{filename}
```

During dev, this is served by the canvas server middleware. In production, it maps to the static build output.

---

## 8. Playwright Setup

### During `storyboard setup`

The CLI setup command checks for Playwright and installs it if missing[^54]:

```js
// 8. Playwright (for canvas snapshots)
let hasPlaywright = false
try {
  run('node -e "require(\'playwright\')"')
  hasPlaywright = true
} catch { /* not installed */ }

if (!hasPlaywright) {
  run('npm install --save-dev playwright')
  run('npx playwright install chromium')
}
```

### During `storyboard snapshots`

The CLI validates Playwright availability at runtime[^55]:

```js
let chromium
try {
  const pw = await import('playwright')
  chromium = pw.chromium
} catch {
  p.log.error('Playwright is required for snapshot generation.')
  p.log.info('Install: ' + yellow('npx storyboard setup'))
  process.exit(1)
}
```

### Vite server

The CLI starts a temporary Vite server on port 19876 (non-strict, will use next available)[^56]:

```js
const { createServer } = await import('vite')
server = await createServer({
  root,
  server: { port: SNAPSHOT_PORT, strictPort: false },
  logLevel: 'silent',
})
await server.listen()
```

This is completely independent from any running dev server — it does not interfere with the user's development session.

---

## 9. Figma Embed Snapshots — Special Handling

Figma embeds are treated differently from prototype and story widgets:

1. **Single theme only** — Figma content doesn't respond to storyboard themes, so only a `light` variant is captured[^57]
2. **CLI only** — FigmaEmbed.jsx has no snapshot-related code (no `snapshotLight`/`snapshotDark` props, no `postMessage` handling)
3. **URL transformation** — The CLI converts `figma.com` URLs to `embed.figma.com` with `embed-host=share` param[^58]
4. **Longer wait** — 4 seconds instead of 2 for the embed to fully render[^59]

---

## 10. Edge Cases and Failure Modes

### External prototype URLs
External URLs (`https://...`) in PrototypeEmbed are skipped for both client-side capture[^60] and CLI capture[^61]. These widgets show the iframe directly without lazy loading.

### Missing snapshots
When `snapshotLight`/`snapshotDark` are absent, the widget immediately loads the iframe without showing a placeholder[^62]. No error state is triggered.

### Capture failures
If `html-to-image` fails (e.g., CORS issues, missing fonts), the error is sent back via `postMessage` and logged as a warning[^63]. The widget continues to function normally — it just won't have a snapshot.

### Concurrent captures
Both PrototypeEmbed and StoryWidget use a `capturingRef` guard to prevent multiple simultaneous captures[^64]:

```js
const requestSnapshotCapture = useCallback(() => {
  if (!iframeRef.current?.contentWindow || capturingRef.current) return
  capturingRef.current = true
  // ...
}, [])
```

### Commit-back loop prevention
The `[skip ci]` tag in commit messages prevents the snapshot commit from triggering another deploy → snapshot cycle[^65].

### Cross-canvas filename collisions
The CLI includes the canvas ID in snapshot filenames to prevent collisions when different canvases have widgets with the same ID[^66]:

```js
const safeCanvasId = canvasId.replace(/\//g, '-')
const filename = `snapshot-${safeCanvasId}-${widgetId}--{theme}--latest.png`
```

### Image size limit
Uploaded images (including snapshots via client-side capture) are limited to 5 MB[^67]. CLI-generated PNGs are not subject to this limit since they're written directly to disk.

---

## 11. Complete Flow: End-to-End Scenarios

### Scenario A: First-time snapshot generation (dev)

1. Developer opens a canvas with a PrototypeEmbed widget
2. Widget has no `snapshotLight`/`snapshotDark` → iframe loads immediately
3. Prototype renders inside iframe
4. `mountStoryboardCore.js` waits 3s + fonts, sends `storyboard:embed:snapshot-ready`
5. PrototypeEmbed receives signal, calls `requestSnapshotCapture()`
6. Posts `storyboard:embed:capture` to iframe
7. iframe uses `html-to-image` to capture `document.body` as WebP
8. Data URL sent back via `storyboard:embed:snapshot`
9. PrototypeEmbed calls `uploadImage(dataUrl, 'snapshot-{widgetId}')`
10. Server writes to `assets/canvas/snapshots/{prefix}{date}.webp`
11. `onUpdate({ snapshotLight: '/_storyboard/canvas/images/{filename}' })` persists to JSONL
12. On next canvas load, snapshot image is shown instead of iframe

### Scenario B: CI snapshot generation after push

1. Developer pushes to branch `feature/new-canvas`
2. `Deploy branch preview` workflow runs, builds, deploys
3. On success, `Generate canvas snapshots` workflow triggers
4. Checks out at the same SHA, installs deps + Playwright
5. Runs `npx storyboard snapshots --changed-only`
6. CLI runs `git diff HEAD~1 --name-only`, finds changed `.canvas.jsonl` files
7. Starts ephemeral Vite server on port 19876
8. For each dirty widget, launches Playwright with widget dimensions
9. Navigates to embed URL, waits for networkidle + 2s
10. Captures PNG at 2x resolution for both light and dark themes
11. Writes to `assets/canvas/snapshots/snapshot-{canvasId}-{widgetId}--{theme}--latest.png`
12. Appends `widgets_replaced` event to JSONL
13. Commits and pushes back to `feature/new-canvas` with `[skip ci]`

### Scenario C: Story source change detected

1. Developer modifies `button-patterns.story.jsx`
2. `storyboard snapshots --changed-only` runs (locally or CI)
3. `git diff HEAD~1 --name-only` includes `button-patterns.story.jsx`
4. CLI scans all canvases for widgets referencing `button-patterns`
5. For matching widgets, compares `git hash-object` of current file vs `_snapshotHash`
6. If hash differs, widget is marked dirty and re-captured
7. New `_snapshotHash` is recorded in the JSONL alongside the snapshot URL

---

## Key Repositories and Files Summary

| File | Purpose | Lines of Interest |
|---|---|---|
| `packages/core/src/cli/snapshots.js` | CLI batch snapshot generator | Full file (492 lines) |
| `packages/core/src/mountStoryboardCore.js` | Embed detection, snapshot-ready, capture handler | Lines 200-273 |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | Prototype iframe widget with snapshot lazy-loading | Lines 46-47, 69-84, 301-395, 526-568 |
| `packages/react/src/canvas/widgets/StoryWidget.jsx` | Story iframe widget with snapshot lazy-loading | Lines 81-83, 111-165, 199-268 |
| `packages/react/src/story/StoryPage.jsx` | Story page with embed snapshot-ready signal | Lines 62-72 |
| `packages/react/src/canvas/canvasApi.js` | Client-side API including `uploadImage()` | Lines 43-45 |
| `packages/core/src/canvas/server.js` | Image upload/serve endpoints, routing logic | Lines 627-725 |
| `packages/core/src/vite/server-plugin.js` | Build-time image emission, watcher exclusion | Lines 202-204, 411-432 |
| `packages/core/src/cli/setup.js` | Playwright installation during setup | Lines 199-234 |
| `packages/core/src/cli/index.js` | CLI command registration | Lines 70-71, 118-119 |
| `.github/workflows/snapshots.yml` | CI workflow for automated snapshot generation | Full file (51 lines) |
| `packages/core/scaffold/snapshots.yml` | Scaffold template for consumer repos | Full file (50 lines) |

---

## Confidence Assessment

**High confidence:**
- All code paths were traced directly from source code
- The postMessage protocol, URL resolution, file naming, and storage patterns are explicitly documented in the implementation
- CI workflow behavior is verifiable from the YAML definitions

**Medium confidence:**
- The FigmaEmbed component appears to have no client-side snapshot code. It's captured by the CLI only — but the component file was not fully read due to size. The CLI explicitly handles `figma-embed` type widgets.

**Assumptions:**
- The `Deploy branch preview` workflow mentioned in `workflow_run` triggers exists in the repo (referenced but not examined)
- The `html-to-image` library is installed as a dependency (imported dynamically)

---

## Footnotes

[^1]: `packages/core/src/mountStoryboardCore.js:202`
[^2]: `packages/core/src/mountStoryboardCore.js:203-271`
[^3]: `packages/core/src/mountStoryboardCore.js:229-238`
[^4]: `packages/react/src/story/StoryPage.jsx:62-72`
[^5]: `packages/core/src/mountStoryboardCore.js:245-252`
[^6]: `packages/core/src/mountStoryboardCore.js:254-262`
[^7]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:349-361`
[^8]: `packages/react/src/canvas/canvasApi.js:43-45`
[^9]: `packages/core/src/canvas/server.js:635-637`
[^10]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:328-331`
[^11]: `packages/react/src/canvas/widgets/StoryWidget.jsx:215-218`
[^12]: `packages/react/src/canvas/widgets/StoryWidget.jsx:248-258`; `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:363-371`
[^13]: `packages/react/src/canvas/widgets/StoryWidget.jsx:261-269`; `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:386-394`
[^14]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:374-383`
[^15]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:356`; `packages/react/src/canvas/widgets/StoryWidget.jsx:241`
[^16]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:527-541`; `packages/react/src/canvas/widgets/StoryWidget.jsx:437-451`
[^17]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:95-103`; `packages/react/src/canvas/widgets/StoryWidget.jsx:138-147`
[^18]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:87-92`; `packages/react/src/canvas/widgets/StoryWidget.jsx:130-135`
[^19]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:70-74`; `packages/react/src/canvas/widgets/StoryWidget.jsx:113-117`
[^20]: `packages/react/src/canvas/widgets/StoryWidget.jsx:159-165`; `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:115-122`
[^21]: `packages/react/src/canvas/widgets/embedOverlay.module.css:1-36`
[^22]: `packages/core/src/cli/snapshots.js:1-492`
[^23]: `packages/core/src/cli/index.js:70-71, 118-119`
[^24]: `packages/core/src/cli/snapshots.js:31-49`
[^25]: `packages/core/src/cli/snapshots.js:51-55`
[^26]: `packages/core/src/cli/snapshots.js:302-304`
[^27]: `packages/core/src/cli/snapshots.js:444-481`
[^28]: `packages/core/src/cli/snapshots.js:449`
[^29]: `packages/core/src/cli/snapshots.js:483-486`
[^30]: `packages/core/src/cli/snapshots.js:333`
[^31]: `packages/core/src/cli/snapshots.js:325-329`
[^32]: `packages/core/src/cli/snapshots.js:367-370`
[^33]: `packages/core/src/cli/snapshots.js:374-375`
[^34]: `packages/core/src/cli/snapshots.js:62-68`
[^35]: `packages/core/src/cli/snapshots.js:148-168`
[^36]: `packages/core/src/cli/snapshots.js:86-92`
[^37]: `packages/core/src/cli/snapshots.js:392-399`
[^38]: `packages/core/src/cli/snapshots.js:188-236`
[^39]: `packages/core/src/cli/snapshots.js:71-78`
[^40]: `packages/core/src/cli/snapshots.js:417-429`
[^41]: `.github/workflows/snapshots.yml:1-51`
[^42]: `packages/core/scaffold/snapshots.yml:1-50`
[^43]: `.github/workflows/snapshots.yml:3-6`
[^44]: `.github/workflows/snapshots.yml:14`
[^45]: `.github/workflows/snapshots.yml:8-10`
[^46]: `.github/workflows/snapshots.yml:20-24`
[^47]: `.github/workflows/snapshots.yml:42-51`
[^48]: `packages/core/src/cli/setup.js:199`
[^49]: `packages/core/src/canvas/server.js:640-646`
[^50]: `packages/core/src/canvas/server.js:719`
[^51]: `packages/core/src/vite/server-plugin.js:411-432`
[^52]: `packages/core/src/vite/server-plugin.js:421`
[^53]: `packages/core/src/vite/server-plugin.js:202-204`
[^54]: `packages/core/src/cli/setup.js:210-234`
[^55]: `packages/core/src/cli/snapshots.js:255-264`
[^56]: `packages/core/src/cli/snapshots.js:272-279`
[^57]: `packages/core/src/cli/snapshots.js:319, 333`
[^58]: `packages/core/src/cli/snapshots.js:466-479`
[^59]: `packages/core/src/cli/snapshots.js:375`
[^60]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:339`
[^61]: `packages/core/src/cli/snapshots.js:449`
[^62]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:77-79`
[^63]: `packages/core/src/mountStoryboardCore.js:263-269`
[^64]: `packages/react/src/canvas/widgets/PrototypeEmbed.jsx:338-339`; `packages/react/src/canvas/widgets/StoryWidget.jsx:225-226`
[^65]: `.github/workflows/snapshots.yml:50`
[^66]: `packages/core/src/cli/snapshots.js:65-66`
[^67]: `packages/core/src/canvas/server.js:632`
