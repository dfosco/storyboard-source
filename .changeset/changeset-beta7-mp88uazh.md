---
"@dfosco/storyboard": patch
---

Several setup + agent-launch reliability fixes.

- `.storyboard/.user.json` per-user state file (gitignored) tracks the version setup last ran against. `storyboard dev` now auto-runs `storyboard setup --skip-branch` on first boot and on version drift, so scaffolding reaches users who upgrade via plain `npm install`.
- First-time setup asks via multiselect which coding agents to install (Copilot CLI, Claude Code, Codex CLI). Selection is persisted and reinstalled only when missing on subsequent runs.
- Mascot now renders above Vite output on `storyboard dev`, with the dev URL beside it.
- Fix: env script now ends with `echo "Environment loaded:"` again. Without it the readiness poller fell through to a 30s timeout fallback, delaying `/allow-all`, canvas-context injection, role/broadcast bind, and identity for every fresh agent launch.
