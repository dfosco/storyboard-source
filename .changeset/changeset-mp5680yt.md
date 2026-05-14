---
"@dfosco/storyboard": patch
---

Fix prompt widget stuck on "Processing…" when its canvas-page id contains a slash (nested canvas, e.g. `folder/page`). PromptWidget now resolves the full canvas id from the canvas bridge state, includes `canvasId` on the status poll URL, and the `/agent/status` server handler falls back to the widget-id-named symlink so a missing or stale `canvasId` no longer hides the persisted `done` status. Newly-spawned prompts also persist the correct nested `canvasId`.
