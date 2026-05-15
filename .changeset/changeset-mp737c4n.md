---
"@dfosco/storyboard": patch
---

Claude Code session capture + auto-resume (parity with Copilot from beta.1) and CI lint fixes.

- **Claude Code auto-resume.** Mirror the Copilot capture mechanism: install a `SessionStart` hook in `~/.claude/settings.json` (merged into existing settings, marked with `# storyboard-capture` for idempotent replace) that writes the captured session id to `<root>/.storyboard/agent-sessions/<widgetId>.session-id` using `STORYBOARD_WIDGET_ID` and `STORYBOARD_PROJECT_ROOT` from env. Shared bash script handles both `sessionId` (Copilot) and `session_id` (Claude) payload shapes. Pre-flight resume validation supports per-project session dirs via the new `sessionStateGlob` agent-config option (Claude pattern: `~/.claude/projects/*/{id}.jsonl`).
- **storyboard.config.json defaults** for Claude updated: `resumeCommand` is now `claude --resume {id} --agent terminal-agent --dangerously-skip-permissions`, `sessionIdEnv: "CLAUDE_SESSION_ID"`, `sessionStateGlob: "~/.claude/projects/*/{id}.jsonl"`.
- Fix CI lint errors in `RadialMenu` (unused vars) that were blocking the publish workflow.
