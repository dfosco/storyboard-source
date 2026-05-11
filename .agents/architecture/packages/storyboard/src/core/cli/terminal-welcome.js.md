# `packages/storyboard/src/core/cli/terminal-welcome.js`

<!--
source: packages/storyboard/src/core/cli/terminal-welcome.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard terminal-welcome` — the interactive welcome supervisor for all terminal widget sessions running inside tmux. Presents a Clack select menu (start agent / shell / browse sessions), launches the chosen program, and loops back when it exits. With `--startup <cmd>`, auto-launches the command on the first iteration (no menu). Critical stdin-drain logic prevents accumulated mouse escape sequences from corrupting Clack prompts.

## Composition

### Key functions

| Function | Purpose |
|---|---|
| `drainStdin()` | Reads and discards all buffered stdin bytes before Clack prompts |
| `loadAgents()` | Reads `canvas.agents` from `storyboard.config.json` |
| `setMouse(on)` | `tmux set-option mouse on|off` — must be off during Clack, on during child |
| `spawnShell()` | Spawns interactive shell with `.storyboard/terminals/bin/` on PATH |
| `launchAgent(agent, opts)` | Spawns agent's `startupCommand`; polls pane for `readinessSignal`; injects identity + pending messages |
| `injectIdentityMessage(tmuxName)` | Sends `[System] Your terminal identity has been set…` to the running agent |
| `deliverPendingMessages(tmuxName)` | Calls `takePendingMessages` and forwards each via tmux send-keys |
| `agentEnv()` | Strips bin wrapper dir from PATH (prevents infinite recursion), forces truecolor |
| `welcomeLoop()` | Main `while(true)` supervisor loop |
| `resetTerminal()` | Restores terminal state after a TUI app exits (alternate screen, cursor, attributes) |

### Flags

`--branch`, `--canvas`, `--name`, `--startup`

## Dependencies

- [`flags.js`](./flags.js.md), [`intro.js`](./intro.js.md)
- `../canvas/terminal-config.js` — `takePendingMessages`
- `@clack/prompts`, Node.js `child_process`, `fs`, `path`

## Dependents

- [`index.js`](./index.js.md) — dispatches `terminal-welcome` command here
- Terminal server — spawns this script as the entry process for new sessions

## Notes

`drainStdin` is critical: mouse escape sequences from tmux accumulate in stdin while an agent runs and would auto-select Clack menu options if not drained before the next prompt. `--startup` with `MAX_STARTUP_RETRIES = 2` retries on non-zero exit before falling back to the interactive menu.
