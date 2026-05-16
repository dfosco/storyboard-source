---
"@dfosco/storyboard": patch
---

Restore `/allow-all on` send-keys postStartup for Copilot (the `--allow-all` CLI flag didn't apply reliably). The send-keys is now gated on the sessionStart hook touching `.ready`, so Copilot's prompt is guaranteed to be interactive when the keystrokes land — no more race against mid-boot rendering.
