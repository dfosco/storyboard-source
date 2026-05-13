---
"@dfosco/storyboard": minor
---

Runtime hardening + simplification, plus a one-shot upgrade tool.

- **fix(runtime):** evict reused ports from sibling devDomain routes — fixes the "Wrong domain (421 Misdirected)" page that appeared on one server when a second `sb run` reused its port under a different devDomain.
- **refactor(runtime):** trim the daemon (~435 lines deleted). HotPool removed, lease TTL/`/devserver/renew` removed, FSM simplified to `spawning → ready → stopped`, `dev.js`'s worktree-conversion prompt deleted.
- **feat(cli):** `sb dev` is now an alias for `sb run` (proxy + runtime + dev). One command for new users.
- **feat(cli):** new `sb reset` command nukes the daemon, clears Caddy routes (including pre-runtime Caddyfile-reload leftovers), kills orphan `vite` processes, and respawns a fresh daemon. Use after upgrading from `main`.
- **feat(runtime):** `acquire()` now force-checks daemon version before binding, so `sb run` always respawns a stale daemon after a package upgrade.
- **fix(inspector):** scroll the restored `?inspect=` selection into the viewport before pinning the highlight.
- **docs(readme):** document the upgrade path for users coming from pre-0.5.0.
