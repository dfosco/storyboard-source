---
"@dfosco/storyboard": patch
---

Canvas widget fixes for deployed branch previews.

- component-set widgets now route through the real story page (`?_sb_component_set`) instead of the dev-only `_storyboard/canvas/isolate-set` middleware, so they render correctly in production builds (e.g. branch deploys) instead of showing a white iframe
- agent readiness polling tightened from 3s to 500ms, with the `.ready` watcher kept alive past 30s (soft-bind at 30s) so slow consumer-repo cold starts no longer drop postStartup context
