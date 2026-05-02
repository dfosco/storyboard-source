# Plan: Remove all snapshot code (nuclear option)

## Goals

1. **No iframe creates or uses snapshots** — remove all snapshot capture, snapshot display, and snapshot-related message handling from canvas widgets
2. **No iframe pre-loading** — iframes load only on click, never on hover or eagerly
3. **Clean slate** — remove all snapshot infrastructure (CLI command, CI workflow, html-to-image dep, Playwright setup)

## Problem Statement

Snapshot functionality (capturing iframe content as images for lazy loading) has accumulated complexity, quirks, and edge cases. Rather than patching, we remove it entirely to start fresh later with a cleaner approach.

## Approach

Strip snapshot code from the inside out: widget rendering → embed message handling → core embed handler → CLI → CI → deps.

## Files to Change

### Widget components (packages/react)
1. **`packages/react/src/canvas/widgets/PrototypeEmbed.jsx`** — Remove: snapshot props, snapshot validation, lazy-loading state (preload/hover), snapshot image rendering, snapshot capture request/result handlers, hover preload timers, snapshot-ready listener, resize/theme recapture. Simplify: iframe always renders immediately, click-to-interact overlay stays.
2. **`packages/react/src/canvas/widgets/StoryWidget.jsx`** — Same treatment as PrototypeEmbed: remove all snapshot/lazy-loading code. Iframe renders immediately.
3. **`packages/react/src/canvas/widgets/PrototypeEmbed.module.css`** — Remove `.snapshotImage`, `.snapshotSpinner`, `.spinner` styles
4. **`packages/react/src/canvas/widgets/StoryWidget.module.css`** — Remove `.snapshotImage`, `.snapshotSpinner`, `.spinner` styles
5. **`packages/react/src/story/StoryPage.jsx`** — Remove `snapshot-ready` postMessage in embed mode

### Core embed handler
6. **`packages/core/src/mountStoryboardCore.js`** — Remove the snapshot-ready signal and the `storyboard:embed:capture` message listener (html-to-image import)

### Canvas server
7. **`packages/core/src/canvas/server.js`** — Remove snapshotsDir variable, simplify resolveWriteDir (always imagesDir), simplify resolveImagePath (only imagesDir)

### Vite build
8. **`packages/core/src/vite/server-plugin.js`** — Remove snapshots dir from watcher.unwatch and from generateBundle emission loop

### CLI
9. **`packages/core/src/cli/snapshots.js`** — Delete entirely
10. **`packages/core/src/cli/index.js`** — Remove `snapshots` case from command switch
11. **`packages/core/src/cli/setup.js`** — Remove `assets/canvas/snapshots` dir creation and Playwright installation step

### CI / scaffold
12. **`.github/workflows/snapshots.yml`** — Delete entirely
13. **`packages/core/scaffold/snapshots.yml`** — Delete entirely

### Dependencies
14. **`package.json`** (root) — Remove `html-to-image`
15. **`packages/core/package.json`** — Remove `html-to-image`

## Edge Cases & Risks

- **Existing snapshot props in JSONL data** — `snapshotLight`/`snapshotDark` props will remain in existing canvas JSONL files. Widgets will simply ignore them (they won't read those props anymore). No migration needed.
- **uploadImage import** — `PrototypeEmbed.jsx` imports `uploadImage` for snapshots. Check if it's used for anything else before removing the import. **StoryWidget.jsx** same.
- **rename-watcher** uses "snapshot" to mean filesystem state diffing — NOT canvas snapshots. Do NOT touch.
- **Vitest snapshot references** in scaffold/skills are about test snapshots (a Vitest feature), not canvas snapshots. Do NOT touch.
- **assets/canvas/snapshots/** directory and its contents will remain on disk but won't be used. Can be cleaned up separately.

## Steps

1. Edit PrototypeEmbed.jsx — strip all snapshot code, make iframe render immediately on click
2. Edit StoryWidget.jsx — same treatment
3. Edit PrototypeEmbed.module.css — remove snapshot styles
4. Edit StoryWidget.module.css — remove snapshot styles
5. Edit StoryPage.jsx — remove snapshot-ready postMessage
6. Edit mountStoryboardCore.js — remove snapshot-ready signal and capture listener
7. Edit canvas/server.js — simplify image routing (remove snapshotsDir)
8. Edit server-plugin.js — remove snapshots from watcher and build emission
9. Delete snapshots.js CLI command
10. Edit cli/index.js — remove snapshots case
11. Edit cli/setup.js — remove snapshots dir + Playwright step
12. Delete .github/workflows/snapshots.yml
13. Delete packages/core/scaffold/snapshots.yml
14. Remove html-to-image from both package.json files
15. Run npm install to update lockfile
16. Run lint + build + test
