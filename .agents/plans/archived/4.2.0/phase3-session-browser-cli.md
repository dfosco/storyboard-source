# Phase 3: Session Browser UI — `storyboard sessions`

## Status: ✅ Implemented

### What was built

**`storyboard sessions` CLI** (`packages/core/src/cli/sessions.js`):
- Interactive Clack picker listing sessions from registry API
- Grouped by canvas, with status colors (Live=blue, Background=orange, Archived=dim)
- Actions: attach to background session, open tmux native manager, kill session
- Resolves dev server URL via Caddy proxy → direct port fallback
- Flags: `--all` for cross-branch, `--branch <name>` to filter

**Terminal API fix** (`packages/core/src/vite/server-plugin.js`):
- Fixed query string parsing in `/_storyboard/terminal/sessions?branch=` route

**CLI dispatcher** (`packages/core/src/cli/index.js`):
- Added `case 'sessions'` routing

## Remaining frontend work

### 1. New Terminal Prompt (Scene 0)

When a terminal widget connects and the session is new (no tmux session exists yet), the server should send a welcome message to the PTY that presents options:

```
storyboard terminal · branch: 4.2.0--tmux-management · canvas: terminal-widget-plan-v6

  [1] Start a new Copilot session    (runs: copilot)
  [2] Start a new terminal session   (opens shell)
  [3] Browse existing sessions       (runs: storyboard sessions)

Press 1, 2, or 3:
```

This is implemented server-side by writing to the PTY after tmux session creation.

### 2. Conflict handling

When the server detects a conflict (session live on another branch), it already sends a `{ type: "conflict" }` WS message. The TerminalWidget should display this as a banner or write a message to the terminal. For now, the server can write a warning directly to the PTY.

### Files

| File | Change |
|------|--------|
| `packages/core/src/canvas/terminal-server.js` | Write welcome prompt on new session, write conflict warning on reattach |

