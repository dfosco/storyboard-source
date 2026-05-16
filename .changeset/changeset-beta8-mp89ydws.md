---
"@dfosco/storyboard": patch
---

Fix agent-launch lag (round 2). The env-source send-keys was `clear && source <env.sh> && clear` — the trailing `clear` wiped the `Environment loaded:` readiness echo from the pane ~10 ms after it printed, so `tmux capture-pane` never saw it and the post-startup poller fell through to its 30 s timeout fallback. Result on fresh client machines: `/allow-all`, canvas context, role/broadcast bind, and identity all arrive ~30 s late, often into Copilot's first-launch trust dialog or the input prompt mid-render. Drop the trailing clear — the welcome wrapper clears the pane itself before launching the agent.
