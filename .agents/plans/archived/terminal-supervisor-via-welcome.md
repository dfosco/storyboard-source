# Plan: Terminal Supervisor via `terminal-welcome.js`

## Problem

When a terminal widget has a `startupCommand` (e.g. Copilot), the command is written directly into the tmux shell. When the agent exits, the user is left at a blank shell — no welcome screen, no way to restart without manual intervention.

The welcome-screen path already works as a supervisor (it spawns children and loops back on exit). The `startupCommand` path bypasses it.

## Approach

Extend `terminal-welcome.js` with a `--startup <cmd>` flag. When provided, auto-launch the command on first entry, then fall back to the normal welcome menu when it exits. This unifies both paths through a single supervisor.

**What changes:**
- `terminal-welcome.js` — add `--startup` flag handling
- `terminal-server.js` — route startupCommand through `terminal-welcome` instead of raw `ptyProcess.write(cmd)`

**What stays the same:**
- Readiness polling + postStartup injection stays in `terminal-server.js` (it's widget/tmux orchestration, not process lifecycle)
- The welcome screen loop, agent selection, shell launch — all unchanged

## Todos

### 1. Add `--startup` flag to `terminal-welcome.js`

- Add `startup` to `flagSchema` (`{ type: 'string', description: 'Auto-launch this command on first loop iteration' }`)
- At the top of `welcomeLoop()`, if `flags.startup` is set:
  - Create an agent-like object `{ label: '<command>', startupCommand: flags.startup }`
  - Call `launchAgent(agent)` (or equivalent for non-agent commands)
  - After it exits, continue into the normal `while(true)` welcome loop
- This means first iteration auto-launches, all subsequent iterations show the menu

### 2. Fix command parsing — use shell execution

Replace the brittle `startupCommand.split(/\s+/)` pattern in `launchAgent()`:

**Before:**
```js
const parts = agent.startupCommand.split(/\s+/)
const cmd = parts[0]
const args = parts.slice(1)
spawn(cmd, args, { stdio: 'inherit' })
```

**After:**
```js
const shell = process.env.SHELL || '/bin/zsh'
spawn(shell, ['-lc', agent.startupCommand], { stdio: 'inherit' })
```

This handles quoted args, env prefixes, shell operators — everything. The startup command is treated as shell syntax as intended.

### 3. Reset terminal state before re-showing welcome

After the child exits and before re-entering the Clack menu:
- Run `stty sane` equivalent (or `process.stdout.write('\x1b[?1049l\x1b[?25h')` for alt-screen off + cursor visible)
- `setMouse(false)` is already called at loop top — that's good
- Clear screen before showing the welcome prompt

### 4. Update `terminal-server.js` to route startupCommand through welcome

In the `startupCommand` path (around line 654):

**Before:**
```js
ptyProcess.write(cmd + '\r')
```

**After:**
```js
const nameArg = prettyName ? ` --name "${prettyName}"` : ''
const welcomeCmd = `storyboard terminal-welcome --branch "${branch}" --canvas "${canvasId}"${nameArg} --startup ${JSON.stringify(cmd)}`
ptyProcess.write(welcomeCmd + '\r')
```

The readiness/postStartup logic stays where it is — it polls the tmux pane externally and sends keys, independent of what process is running inside.

### 5. Handle `shell` startupCommand

When `startupCommand === 'shell'`, the current code is a no-op (the pty already has a shell). With the supervisor, we'd want:
- `--startup shell` → skip the menu, user gets a bare shell. On shell exit → welcome screen.
- This is equivalent to the current "Start a new terminal session" menu option.

## Notes

- The supervisor is a thin layer — it doesn't grow into a full orchestration system. It just ensures the welcome screen is always reachable.
- `Ctrl-C` in the agent should kill the agent, not the supervisor. Since we spawn via `$SHELL -lc`, the child process group handles this correctly (the shell forwards SIGINT to the command).
- Future: the supervisor loop could be extended for lifecycle hooks (on-exit, on-crash), but that's out of scope for now.
