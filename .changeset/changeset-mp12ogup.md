---
"@dfosco/storyboard": minor
---

Auto-respawn runtime daemon on package version mismatch

The runtime daemon is a long-lived process shared across worktrees. After upgrading `@dfosco/storyboard`, the in-memory daemon previously kept serving stale code until you ran `sb proxy restart`. Now `RuntimeClient.health()` compares the client's package.json version against the daemon's `/health` response and SIGTERMs + respawns automatically on mismatch. Source-tree dev (`0.0.0`) is exempt.
