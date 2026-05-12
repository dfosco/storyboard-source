---
"@dfosco/storyboard": patch
---

Fix 404 after renaming or duplicating canvas pages.

- Canvas route map now reads `canvases` live (mirrors the existing story-route pattern), so HMR rename/duplicate are reflected without a stale-snapshot 404.
- Canvas route detection and page-selector siblings re-evaluate on `storyboard:canvas-index-changed`.
- PageSelector navigates immediately on rename/duplicate/create instead of waiting for a `vite:beforeFullReload` event that never fires for canvas HMR. Rename also updates the page list optimistically.
