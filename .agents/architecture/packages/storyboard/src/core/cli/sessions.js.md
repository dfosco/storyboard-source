# `packages/storyboard/src/core/cli/sessions.js`

<!--
source: packages/storyboard/src/core/cli/sessions.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard sessions` — interactive terminal session browser. Lists tmux sessions from the dev server registry, grouped by status (live / background / archived), and lets the user open, remove, or bulk-clean sessions via `@clack/prompts`. Uses a session-list loop so users can navigate back after actions.

## Composition

### Main flow

1. Fetch sessions from `/_storyboard/terminal/sessions` (tries proxy then direct URL)
2. Show Tab cleanup pre-prompt if there are archived/background sessions
3. Display session list with a Clack `p.select`
4. On selection: show detail pane with open / remove / tmux-session-manager options
5. After action: re-enter loop with fresh fetch

### Key helpers

| Helper | Purpose |
|---|---|
| `fetchSessions` | GET `/_storyboard/terminal/sessions[?branch=…]` |
| `cleanupSessions` | POST `/_storyboard/terminal/sessions/cleanup` |
| `showCleanupPrompt` | Tab-triggered bulk-cleanup flow |
| `getCurrentTmuxSession` | Detects current `sb-*` tmux session |
| `formatRow` | Renders a fixed-width session row |

### Flags

`--all` (all branches), `--branch <name>`

## Dependencies

- [`proxy.js`](./proxy.js.md) — `readDevDomain`
- [`flags.js`](./flags.js.md), [`intro.js`](./intro.js.md)
- `../worktree/port.js` — `detectWorktreeName`, `resolveRunningPort`
- `@clack/prompts`, Node.js `child_process`

## Dependents

- [`index.js`](./index.js.md) — dispatches `sessions` command here
- [`terminal-welcome.js`](./terminal-welcome.js.md) — spawns `storyboard terminal` from the sessions sub-menu
