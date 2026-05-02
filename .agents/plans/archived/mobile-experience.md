# Mobile Experience for Storyboard

## Problem Statement

Storyboard's toolbar UI doesn't work well on mobile devices (< 500px wide). The toolbar buttons are too small and cramped. Additionally, mobile users experience pull-to-refresh interference and can't install the app as a webapp.

## Approach (Revised after rubber-duck review)

1. **Mobile toolbar → command menu**: Detect viewport < 500px with JS via `matchMedia`. On mobile, hide main-toolbar and canvas-toolbar buttons; inject tools as dynamic command actions using the existing `setDynamicActions` registry. Only the ⌘ button shows.

2. **Disable pull-to-refresh**: Add `overscroll-behavior-y: contain` CSS to `html` and `body`.

3. **Pinch-to-zoom**: Already allowed by viewport meta. No changes needed.

4. **PWA install prompt**: Update manifest, link from index.html, create mobile-only install banner using `beforeinstallprompt` API. Never show on desktop.

## Files to Change

### New files
- `packages/core/src/mobileViewport.js` — Reactive mobile detection store
- `packages/core/src/PwaInstallBanner.svelte` — Mobile-only install banner

### Modified files
- `packages/core/src/CoreUIBar.svelte` — Mobile state, hide toolbars, register dynamic actions
- `index.html` — Manifest link, overscroll-behavior CSS
- `public/manifest.json` — Storyboard branding

## Tool → Command Action Mapping

| Tool | Surface | Command type | Handler |
|------|---------|-------------|---------|
| flows | main-toolbar | submenu | `core:flows` (already registered, has getChildren) |
| theme | main-toolbar | submenu | New adapter using themeStore |
| comments | main-toolbar | toggle | New adapter using toggleCommentMode |
| inspector | main-toolbar | default | Already registered as sidepanel toggle |
| canvas zoom in/out | canvas-toolbar | 2 default actions | Dispatch set-zoom events |
| canvas zoom-to-fit | canvas-toolbar | default | Dispatch zoom-to-fit event |
| canvas snap | canvas-toolbar | toggle | Dispatch toggle-snap event |
| canvas undo/redo | canvas-toolbar | 2 default actions | Dispatch undo/redo events |

Skipped for MVP: `create` (dev-only, complex overlays), `autosync` (dev-only), `canvas-add-widget` (complex widget menu).

## Steps

1. Create `mobileViewport.js` store
2. Modify `CoreUIBar.svelte` — mobile state + dynamic actions + hide toolbars
3. Add overscroll-behavior CSS to `index.html`
4. Update `manifest.json` + add link in `index.html`
5. Create `PwaInstallBanner.svelte` + mount in CoreUIBar

## Edge Cases & Risks

- **Dynamic actions via registry**: Using `setDynamicActions` feeds through existing mode filtering, route exclusions, and tool state — no divergence from desktop.
- **Canvas tools state**: Canvas actions only registered when `canvasActive` is true. Re-synced when canvas mounts/unmounts.
- **Resize between mobile/desktop**: `matchMedia` handles reactively.
- **PWA install**: `beforeinstallprompt` is Chrome/Edge only. Safari shows its own banner. We only show when event fires + check `display-mode: standalone` to avoid prompting if already installed.
- **Touch-action on canvas**: `tiny-canvas` already has `touch-action: none` — pinch-to-zoom only outside canvas.
