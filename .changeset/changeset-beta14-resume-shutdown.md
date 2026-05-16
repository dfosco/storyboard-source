---
"@dfosco/storyboard": patch
---

Agent reliability + dev UX:

- **Agent resume now survives `tmux kill-server`** — we always attempt `--resume <id>` when a sessionId is stored, instead of pre-checking the agent's local session-state on disk. Local GC / cache cleanup / disk moves no longer silently downgrade to a fresh agent. CLI rejection still falls through to a fresh session with a visible notice.
- **Dev shutdown** — Ctrl+C now escalates SIGINT → SIGTERM (+2 s) → SIGKILL (+5 s); second Ctrl+C force-exits immediately. No more being held hostage when the storyboard-server plugin loops on orphan archiving.
