---
"@dfosco/storyboard": patch
---

Hot-pool leak fix and Agents-ready zoom

- fix(hot-pool): canvas widget POST and batch create-widget no longer leak warm pool slots — `peek()` probes webgl-readiness without claiming
- feat(canvas): clicking "Agents ready" now zooms to at least 100% before panning to the next done agent
