---
"@dfosco/storyboard": patch
---

Fix three canvas/toolbar issues found in 0.5.0-alpha.28.

- fix(artifact): canvas creation now writes a proper `canvas_created` event so dot grid, title, and other settings render on canvases created via the Workshop / Viewfinder.
- fix(branch-bar): default dev domain label to the project directory name when no devDomain is configured.
- fix(toolbar): use the `sync` icon (instead of an unresolvable `iconoir/view-grid`) for the cycle-layout action so the button renders an icon instead of fallback text.
