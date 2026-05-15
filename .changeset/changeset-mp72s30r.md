---
"@dfosco/storyboard": minor
---

Auto-resume Copilot CLI agent widgets across `tmux kill-server`, dev-server restarts, and machine reboots — plus several reliability and DX fixes.

- **Auto-resume Copilot agent widgets.** Captures each widget's Copilot session id via the user-level `~/.copilot/hooks/storyboard-capture.json` hook (installed once on dev-server boot, idempotent). On cold restart, the widget relaunches with `copilot --resume=<id> --agent terminal-agent` so the prior conversation history is restored. Pre-flight UUID + `~/.copilot/session-state/<id>/` check guarantees a clean fresh-session fallback if the captured id is no longer valid (e.g. cleared history, machine swap).
- **Hot-pool capture support.** Pool-warmed Copilot sessions also capture their session id via a pool-keyed file; at handoff, terminal-server reads or watches the file (handles the async hook race) and persists it onto the widget config.
- **Unified `resumeCommand`** field — single full launch template with `{id}` placeholder (e.g. `"copilot --resume={id} --agent terminal-agent"`). Replaces the previous split of `resumeCommand` (browse) + `resumeArgsTemplate` (auto-resume).
- **Cold-path readiness fallback.** Adds a 30s safety timeout to the post-readiness flow so identity / role / broadcast / hub `bindWidget` always run, even when the readiness signal never matches (e.g. Copilot resume mode prints different early output).
- **Hide env-export soup.** Cold-path env exports are now wrapped with leading + trailing `clear` so the multi-KB env blob no longer flashes between Enter and the welcome command.
- Various smaller fixes: snap component-set width + height to content on resize end; drop `--strictPort` so Vite rolls forward when a port is taken; re-add `/branch--<name>` suffix to deployed-branch link; wire `customerMode` config to actually apply effects; add fixed-port config; replace `devDomain` with `repository.name`.
