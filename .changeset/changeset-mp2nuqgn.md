---
"@dfosco/storyboard": patch
---

Fix agent spawn PATH and tidy hub UI.

- Fix `command not found: claude` (and other shim-installed agent CLIs) when launching agents from terminal widgets — agent spawn now uses `zsh -ilc` so `~/.zshrc` is sourced.
- Hide the Hub role selector on terminal/agent widgets when there are no connected terminal/agent peers.
- Add regression guard test for the agent spawn shell flags.
