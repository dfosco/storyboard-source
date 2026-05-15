---
"@dfosco/storyboard": patch
---

Codex CLI session capture + auto-resume — round out the auto-resume trio (Copilot + Claude + Codex).

- `ensureCodexCaptureHookInstalled()` writes a `SessionStart` hook to `~/.codex/hooks.json` using the same shared capture script. Codex's hook format is JSON like Claude's; payload uses `session_id` (already handled).
- Codex resume syntax is a subcommand: `resumeCommand: "codex resume {id}"`.
- Codex sessions are nested under `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<id>.jsonl`. `isResumableSessionId` now supports a recursive `**` glob form (uses `find -name -print -quit` under the hood) for `sessionStateGlob`.
- `terminal-server` boot installs all three hooks (Copilot, Claude, Codex).
- One-time trust prompt: Codex requires non-managed hooks to be approved via `/hooks` UI on first run. Documented in the migrate skill.
