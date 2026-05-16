---
"@dfosco/storyboard": patch
---

Round of UX + agent fixes:

- **Codex agent**: switch from removed `--full-auto` flag to `--dangerously-bypass-approvals-and-sandbox`. Add `"YOLO mode"` readinessSignal (Codex's persistent UI footer) — until the user trusts our sessionStart hook via `/hooks`, this is what allows the readiness poller to detect ready agent state in <2s instead of timing out at 30s.
- **Codex resume**: new `resumeLastCommand` agent-config field. Library defaults now include `codex resume --last --dangerously-bypass-approvals-and-sandbox` as a fallback when no per-widget session id has been captured (Codex's hook needs manual trust before it captures ids).
- **Copilot agent**: `--allow-all` flag couldn't be relied on, so keep `/allow-all on` send-keys postStartup, but it's now gated on the sessionStart hook touching `.ready` — Copilot's prompt is guaranteed to be interactive when the keystrokes land.
- **Hot pool**: remove `webgl_ready_slots` from library defaults (was contributing to perf loss with unbounded background sessions). Easy to override per-project if needed.
- **Dev CLI**: quiet by default — only `worktree:` / `port:` headers + Vite "ready in" + mascot + URL show. Verbose plumbing hidden behind `--verbose`.
- **Mascot animation**: configurable per-frame delays in `mascot.config.json` (frames entries can be `"file.txt"` or `["file.txt", delayMs]`). Vite's default URL block is suppressed via the storyboard-server plugin so the mascot can own the bottom of the screen without races.
- **Mascot opt-out**: `--no-buddy` flag and `STORYBOARD_NO_BUDDY=1` env var. Dev's auto-spawned setup passes both so the mascot only renders once.
- **Shutdown noise**: detach Vite stdio listeners + send SIGINT on Ctrl+C — no more `Pre-transform error: The service was stopped` spam from in-flight esbuild transforms.
