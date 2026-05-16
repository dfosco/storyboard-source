---
"@dfosco/storyboard": patch
---

Fix `npx storyboard setup` blockers on fresh machines.

- Animate install spinners — previously `npm install` and brew installs ran via `execSync`, which blocked Node's event loop and prevented the `@clack` spinner from ever appearing, making setup look stuck.
- Add network probe (HEAD against `api.github.com`) that warns up front when GitHub is unreachable (VPN/proxy/DNS).
- Install `tmux` automatically (required for headless agent sessions).
- Run `gh auth status` after installing `gh` — prompt the user to `gh auth login` when not authed.
- Tell users that Copilot CLI auth is separate from `gh` — they must run `copilot` then `/login`.
- Drop dead Caddy plumbing (Caddy was removed in 0.6).
