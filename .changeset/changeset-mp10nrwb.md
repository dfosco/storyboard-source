---
"@dfosco/storyboard": minor
---

Reliability fixes for canvas/story creation and proxy startup

- Fix canvas creation navigating to malformed `/branch--<x>src/canvas` URLs (artifact route now returns explicit `route` field; CreateDialog hardened)
- Eliminate post-creation 404 race for canvases and stories — server synchronously rebuilds the data index before responding
- Fix `sb proxy start` failing with garbled "subject does not qualify for certificate" error (Caddy stdin + stdio bugs)
- Fix `sb run` printing a deprecation warning from the legacy `generateCaddyfile()` stub
- Fix agent terminals failing with `command not found: storyboard` when `.zshrc` resets PATH — welcome command now uses absolute CLI path
- Surface 'agent done' status with a new collab-bar (matches canvas-toolbar visual language)
- Persist agent status at canvas level + accept widget type 'agent'
- Snap dropped connectors inside widget bounds to nearest anchor
- CreateDialog uses Primer's experimental Dialog with proper inner-content scrolling
- Hide Flow / Object / Record / Page from the command palette's create section
- Markdown editing works in split-screen secondary panes (caret preserved)
