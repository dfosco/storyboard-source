---
"@dfosco/storyboard": patch
---

Lint fix: remove two unused imports (`listWorktrees` in `cli/server.js`, `withSpin` helper in `cli/setup.js`) that were causing the publish workflow to fail. No runtime changes; this is the same beta.14/beta.15 payload made publishable.
