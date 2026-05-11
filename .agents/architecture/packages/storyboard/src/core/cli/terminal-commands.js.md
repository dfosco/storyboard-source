# `packages/storyboard/src/core/cli/terminal-commands.js`

<!--
source: packages/storyboard/src/core/cli/terminal-commands.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard terminal {close|open|remove} --id <name-or-id>` — programmatic terminal session management by friendly name, tmux name, or widget ID. Exposes the three session lifecycle operations as a scripting interface (contrast with [`sessions.js`](./sessions.js.md) which is interactive).

## Composition

### Subcommands → server endpoints

| Subcommand | Endpoints |
|---|---|
| `close` / `archive` | `POST …/sessions/<tmuxName>/detach` → `POST …/sessions/<tmuxName>/orphan` |
| `open` | `tmux switch-client` or `tmux attach-session` (no HTTP call) |
| `remove` | `DELETE …/sessions/<tmuxName>` + `DELETE …/canvas/widget` |

`resolveSession(sessions, id)` resolves `--id` by trying: friendly name → tmux name → widget ID.

`apiRequest` tries the proxy base URL then the direct port URL for fault tolerance.

### Flags

`--id <name-or-id>` (required, parsed by [`flags.js`](./flags.js.md))

## Dependencies

- [`proxy.js`](./proxy.js.md) — `readDevDomain`
- [`flags.js`](./flags.js.md), [`intro.js`](./intro.js.md)
- `../worktree/port.js` — `detectWorktreeName`, `resolveRunningPort`
- `@clack/prompts`, Node.js `child_process`

## Dependents

- [`index.js`](./index.js.md) — dispatches `terminal close|open|remove` here

## Notes

`open` uses `tmux switch-client` when already inside a storyboard session, `tmux attach-session` otherwise. The remove path also removes the canvas widget to keep the canvas in sync with tmux state.
