---
"@dfosco/storyboard": minor
---

Fixes broken widget resize, adds a "See deployed branch" command palette entry, and ensures all top-level storyboard.config.json fields reach the runtime.

- Fix widget resize being completely non-functional (zoom scale was NaN, dropped by the NaN guard).
- Add "See deployed branch" command palette entry that opens the current page on the configured prodDomain over HTTPS in a new tab. Hidden when prodDomain is unset.
- prodDomain may include a base path (e.g. "dfosco.github.io/storyboard/") which is prepended to the current pathname.
- Forward all storyboard.config.json top-level keys (and configSchema defaults) to the runtime config — no more silent drops for new fields.
