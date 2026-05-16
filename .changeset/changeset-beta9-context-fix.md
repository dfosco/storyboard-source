---
"@dfosco/storyboard": patch
---

Eliminate the ~30 s context-delivery delay for Copilot CLI agents (cold and warm). Three layered fixes: skip the redundant readiness re-poll on hot-pool warm handoff (the pool already verified readiness); write a `.ready` marker file from the env script and poll `existsSync` (terminal-state-independent, immune to TUI repaints / alt-screen / clears); switch all `tmux capture-pane` readiness polls from `-p` to `-p -S -200` so the echo survives Copilot's full-screen TUI repaint. Claude was never affected because its readiness signal lives in a persistent status bar.
