---
"@dfosco/storyboard": patch
---

Copilot agents: switch to native `--allow-all` flag (same shape as Claude's `--dangerously-skip-permissions`) and use the `sessionStart` hook to signal true agent readiness. Eliminates the send-keys `/allow-all on` race that was typing into Copilot mid-boot, and replaces the unreliable pre-agent shell echo with a marker file touched the instant Copilot's prompt becomes interactive. Identity, role, and broadcast bind now land the moment the agent is actually usable.
