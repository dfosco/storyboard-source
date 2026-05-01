# TMUX Session Management — Implementation Report

> Branch: `4.2.0--tmux-management` · 29 commits · ~3,000 lines added across 17 files

## Overview

Complete terminal session management system for Storyboard canvas terminal widgets. Solves session collisions across worktrees, session loss on widget deletion, orphaned session accumulation, and the lack of session discoverability.

---

## Architecture

### Session Registry (`packages/core/src/canvas/terminal-registry.js`)

Persistent tracker for all TMUX sessions. In-memory Map backed by JSON file at `.storyboard/terminal-sessions.json` (gitignored).

**Key design decisions:**
- **Opaque tmux names** — `sb-{sha256_hash}` instead of encoding branch/canvas in the name. Avoids shell injection, special character issues, and instability from renames.
- **Generation tokens** — each session binding gets a monotonically increasing `generation` counter. Prevents stale WebSocket disconnects from flipping a session that was already rebound.
- **Restart-safe orphan handling** — persists `expiresAt` timestamp instead of relying on `setTimeout`. On server restart, expired sessions are killed and future timers re-armed.
- **Process detection** — before killing an archived session, checks `tmux list-panes -F "#{pane_current_command}"` to detect if non-shell processes are running. Keeps alive if so.
- **Friendly names** — 40 colors × 40 birds (1,600 combinations). Generated on widget creation, saved as `props.prettyName` in JSONL, passed to registry via WS query param.

**Reconciliation on startup:**
1. Registry entries with no live tmux session → removed
2. Live tmux sessions not in registry → imported as `background`
3. Persisted `live` status → downgraded to `background` (server restarted = all WS dead)
4. Expired archived sessions → killed

### Terminal Server (`packages/core/src/canvas/terminal-server.js`)

Refactored from 236 to ~450 lines. Key changes:

- **Scoped sessions** — sessions keyed by `generateTmuxName(branch, canvasId, widgetId)`
- **Conflict detection** — `registerSession()` returns `conflict` if session was live on a different branch
- **Legacy migration** — auto-renames `sb-{widgetId}` sessions to the new hash-based name on connect
- **Welcome prompt** — new sessions run `storyboard terminal-welcome` inside tmux
- **Orphan on delete** — `orphanTerminalSession()` replaces `killTerminalSession()`: archives with grace timer instead of immediate kill
- **Correct cwd** — `tmux new-session -c {cwd}` so shells start in the worktree root

### HTTP API (`packages/core/src/vite/server-plugin.js`)

New `/_storyboard/terminal/` route handler:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions` | List all sessions (optional `?branch=` filter) |
| POST | `/sessions/:name/detach` | Detach a session from its widget |
| POST | `/sessions/:name/orphan` | Archive a session with grace timer |
| DELETE | `/sessions/:name` | Permanently destroy a session |

Branch name read via `git branch --show-current` at server startup.

### CLI Commands (`packages/core/src/cli/`)

**`storyboard terminal`** — interactive Clack session browser
- Lists sessions grouped by canvas, with status colors (Live=blue, Background=orange, Archived=dim)
- Detects current tmux session and marks it `(current)`
- Shows friendly names instead of internal IDs
- Resolves dev server URL via Caddy proxy first, then direct port fallback

**`storyboard terminal start`** — launches the welcome prompt
- Clack `select()` with three options: Copilot / Shell / Browse sessions
- Loops back after Copilot or session browser exits
- Shows metadata (name, branch, canvas) after selection

**`storyboard terminal close --id <name>`** (alias: `archive`)
- Archives a session with grace timer
- Detaches if currently live

**`storyboard terminal open --id <name>`**
- Attaches to a session via `tmux switch-client`
- Warns if session is live on another widget

**`storyboard terminal remove --id <name>`**
- Permanently destroys tmux session + removes canvas widget
- Requires confirmation with warning about widget removal

All `--id` flags resolve against: friendly name → tmux name → widget ID.

### Terminal Widget (`packages/react/src/canvas/widgets/TerminalWidget.jsx`)

- **Passes `canvasId`** via WS query param for session scoping
- **Passes `prettyName`** via WS query param so registry gets the name from the widget
- **Session-ended overlay** — shows animated `z z z` floating upward with "Start terminal session" hint on hover. Solid `#0d1117` background covers terminal residue.
- **Wake-up animation** — 1.5s hold showing "Waking up..." before reconnecting
- **No auto-connect on page load** — persisted widgets (with `prettyName`) start in zzz state. Only new widgets auto-connect.
- **Title bar** — absolutely positioned above the widget (`top: -28px`), outside the selection border. Shows `terminal · {prettyName}`. Turns accent blue when widget is selected.
- **Selection border radius** — matches terminal's 16px rounded corners via `:has()` selector on the widget slot
- **JSON control messages** — intercepted and not rendered to terminal

### Canvas Server (`packages/core/src/canvas/server.js`)

- **Auto-assigns `prettyName`** on terminal widget creation via `generateFriendlyName()`
- **Widget delete → orphan** instead of immediate kill

### Skills Updated

- **Canvas skill** — Step 5 (Confirm) now requires providing a direct widget URL (`{baseURL}canvas/{canvasName}#{widgetId}`) after every widget add. Missing ID = creation failure → retry.
- **Create skill** — Cross-references the same URL verification requirement.

---

## Prototyping (Story Components)

8 mock story scenes at `src/components/TerminalSessionMock/`:

1. **NewTerminalPrompt** — Clack welcome prompt with 3 options
2. **SessionPickerThisCanvas** — session list scoped to current canvas
3. **SessionPickerAllCanvases** — all sessions on current branch
4. **SessionPickerAllBranches** — cross-branch view with branch separators
5. **ConflictDialog** — cross-worktree conflict with detach/new/delete options
6. **WarmStartBanner** — (future dev) colleague picks up from `.session.md`
7. **OrphanRecovery** — delete → archived → undo → reconnected
8. **FullLifecycle** — 6-step overview grid

---

## Deferred (Future Development)

- **Session context files** (`.session.md`) — committed markdown capturing last commit, canvas state, planned/implemented/interrupted work, shell history
- **Warm-start banner** — colleague opens canvas, sees previous session context
- **"Continue with Copilot"** — feeds context to new Copilot session

---

## Files Changed

| File | Lines | Description |
|------|-------|-------------|
| `packages/core/src/canvas/terminal-registry.js` | +427 | Session registry (new) |
| `packages/core/src/canvas/terminal-server.js` | +212/-40 | Refactored server |
| `packages/core/src/cli/sessions.js` | +339 | Session browser CLI (new) |
| `packages/core/src/cli/terminal-commands.js` | +276 | close/open/remove commands (new) |
| `packages/core/src/cli/terminal-welcome.js` | +100 | Welcome prompt CLI (new) |
| `packages/core/src/cli/index.js` | +30 | CLI dispatcher + help screen |
| `packages/core/src/vite/server-plugin.js` | +56/-4 | HTTP API + branch detection |
| `packages/core/src/canvas/server.js` | +15/-4 | prettyName + orphan on delete |
| `packages/react/.../TerminalWidget.jsx` | +80/-12 | Client-side session management |
| `packages/react/.../TerminalWidget.module.css` | +86/-4 | Overlay, zzz, title bar styles |
| `.../TerminalSessionMock/` (3 files) | +1,011 | Prototyping story components |
| `.github/skills/canvas/SKILL.md` | +15 | Widget URL verification |
| `.github/plans/4.2.0/` (2 files) | +372 | Planning documents |

**Total: ~3,000 lines added, ~60 lines removed across 17 files.**
