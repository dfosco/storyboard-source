---
"@dfosco/storyboard": patch
---

Fix slow / mis-attributed hub communication for hot-pool agent widgets.

Warm-handoff Copilot/Claude/Codex TUIs inherited `STORYBOARD_WIDGET_ID=pool-<…>` from the pool process, so messages sent via `storyboard messages send` / `storyboard hub send` / `storyboard terminal send` were signed by the pool id instead of the widget. The leader couldn't recognize replies from its hub members and would retry until enough messages eventually came through, making coordination feel slow.

- New `resolveWidgetId()` helper: explicit flag → `STORYBOARD_WIDGET_ID_OVERRIDE` → non-pool `STORYBOARD_WIDGET_ID` → lookup in `.storyboard/terminal-sessions.json` keyed by tmux session name → fallback.
- Wired into `messages`, `hub`, and `terminal` CLI commands.
- Warm-handoff path in `terminal-server.js` now also writes the per-widget `.env.sh` and updates the tmux session env so newly forked shells start with the correct id.
