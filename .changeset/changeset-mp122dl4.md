---
"@dfosco/storyboard": minor
---

Add `sb proxy restart` command

After upgrading `@dfosco/storyboard`, the long-lived runtime daemon may hold stale code from the previous version, masking CLI fixes that shipped in newer alphas. `sb proxy restart` kills the daemon (via `~/.storyboard/runtime.pid`) and verifies the fresh daemon is healthy. Run this once after every `sb update:alpha`/`update:version` until automatic version-based respawn lands.
