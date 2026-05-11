# `packages/storyboard/src/core/cli/setup.js`

<!--
source: packages/storyboard/src/core/cli/setup.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard setup` — idempotent one-time dev environment bootstrapper. Installs Homebrew, Git, Caddy, GitHub CLI, VS Code CLI, and Copilot CLI; activates git hooks; creates asset directories; scaffolds agent symlinks; starts the Caddy proxy; and runs `npm install`. Ends with a getting-started note and an optional branch guide.

## Composition

Sequential top-level steps (each guarded so it's safe to re-run):

1. Check `node_modules` presence
2. Install/verify Homebrew
3. Install/verify Git via brew
4. Install/verify Caddy
5. Install/verify GitHub CLI
6. Install/verify VS Code CLI (symlink from `Applications/Visual Studio Code.app`)
7. Install Copilot CLI via `curl https://gh.io/copilot-install`
8. Activate `.githooks/` via `git config core.hooksPath`
9. Create asset dirs: `assets/canvas/images`, `.storyboard/`, etc.; scaffold `.selectedwidgets.json`
10. Add private image patterns to `.gitignore`
11. Scaffold `.agents/` directory; create `@id`-linked symlinks in `.github/agents/` and `.claude/agents/`
12. Start Caddy proxy if installed
13. `npm install` (skipped if dev server is running to avoid Vite restart)
14. Show getting-started note; offer branch guide or mascot art

### Flags

`--skip-branch`, `--branch <name>` (both make the flow non-interactive)

## Dependencies

- [`proxy.js`](./proxy.js.md) — `isCaddyInstalled`, `isCaddyRunning`, `startCaddy`
- [`intro.js`](./intro.js.md) — `gettingStartedLines`, color helpers, `mascot()`
- [`flags.js`](./flags.js.md), `../server/index.js`, `@clack/prompts`
- Node.js `fs`, `path`, `child_process`

## Dependents

- [`index.js`](./index.js.md) — dispatches `setup` command here

## Notes

Hidden `--nuke` flag outputs an uninstall command for testing fresh setups. `withSpin` helper delays the spinner 500ms so fast operations don't flash the UI.
