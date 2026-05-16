---
"@dfosco/storyboard": patch
---

More agent resume + dev UX fixes:

- **Agent resume robustness**: 3-step fallback chain. Stored-id resume → `resumeLastCommand` (new field: `copilot --continue`, `claude --continue`, `codex resume --last`) → fresh `startupCommand` with a yellow notice. Stale ids no longer downgrade silently; non-zero exits cascade cleanly through shell `||`.
- **Vite 504 Outdated Optimize Dep auto-recovery**: dev now wipes `node_modules/.vite` on setup (first run + version drift) so dep IDs match the cached chunks; client-side error handler triggers a single full-page reload when the error fires at runtime (guarded against loops).
- **Shutdown reliability**: `Ctrl+C` now escalates SIGINT → SIGTERM (+2 s) → SIGKILL (+5 s); a second `Ctrl+C` force-exits immediately so you can't get held hostage by a looping plugin teardown.
- **Dev URL fix**: was hardcoded to `/storyboard/` from the Caddy proxy era. Now reads `VITE_BASE_PATH` env / `basePath` key in `storyboard.config.json` / `/` default.
