# TMUX Session Management Plan

## Problem

Terminal widgets use TMUX sessions named `sb-{widgetId}` with no awareness of which worktree/branch/canvas they belong to. This causes:

1. **Session collisions** — same canvas opened in two worktrees fights over the same TMUX session
2. **Lost sessions** — deleting a widget immediately kills its TMUX session, destroying running processes (including Copilot sessions)
3. **Orphan accumulation** — sessions pile up with no way to discover, browse, or reattach them
4. **No session mobility** — users can't move a session from one widget to another, or recover a session after accidentally deleting a widget

---

## Phases

### Phase 0 — Conceptual Overview
_This document._ Defines the problem, approach, file changes, and design decisions.

### Phase 1 — Prototyping (Story Components)
Interactive mock stories showing how the session management UI looks and behaves inside a terminal widget. Built as `TerminalSessionMock` story component with 7 scenes:

1. **Session Picker (This Canvas)** — default view, scoped to current canvas
2. **Session Picker (All Canvases)** — all sessions on current branch
3. **Session Picker (All Branches)** — cross-branch view with branch separators
4. **Cross-Worktree Conflict** — dialog when session is live on another branch
5. **Warm-Start Banner** — colleague opens canvas with committed `.session.md`
6. **Orphan Recovery** — delete widget → archived → undo → reconnected
7. **Full Lifecycle** — the complete journey from create to colleague handoff

Stories live at: `src/components/TerminalSessionMock/terminal-session-mock.story.jsx`

### Phase 2 — Implementation (Backend)
Server-side changes: session registry, scoped naming, orphan handling, HTTP API, conflict detection.

### Phase 3 — Implementation (Frontend)
Client-side changes: session picker UI, conflict dialog, new terminal prompt.

### Phase 4 — Future Development (Session Context & Handover)
_Not in scope for initial implementation._ Session context files (`.session.md`), warm-start banner, cross-user handover.

---

## Approach

### 1. Scoped Session Naming

**Current:** `sb-{widgetId}` (e.g. `sb-terminal-abc123`)

**New:** `sb-{branch}--{canvasId}--{widgetId}` (e.g. `sb-4.2.0--design-system--terminal-abc123`)

- Branch comes from the worktree's current branch (read at server startup or from Vite config)
- Canvas ID comes from the widget's canvas context (already available in canvas server)
- Widget ID remains the unique suffix
- This ensures no two widgets ever share a session, and sessions are trivially groupable by branch/canvas

**Files:**
- `packages/core/src/canvas/terminal-server.js` — change `toTmuxName()` to accept branch + canvas context
- `packages/core/src/vite/server-plugin.js` — pass branch name to terminal server on init
- `packages/react/src/canvas/widgets/TerminalWidget.jsx` — send canvas ID in WS connection (query param or initial message)

### 2. Session Registry (Server-Side)

A persistent JSON file (`.storyboard/terminal-sessions.json`) that tracks all known sessions:

```json
{
  "sb-4.2.0--design-system--terminal-abc123": {
    "branch": "4.2.0",
    "canvasId": "design-system",
    "widgetId": "terminal-abc123",
    "createdAt": "2026-04-19T10:00:00Z",
    "lastConnectedAt": "2026-04-19T10:05:00Z",
    "attachedWidgetId": "terminal-abc123",
    "status": "live" | "background" | "archived"
  }
}
```

- **attached**: actively connected to a widget's WebSocket
- **detached**: widget disconnected but session is alive in TMUX
- **orphaned**: widget was deleted; session kept alive with a grace timer

On server startup, reconcile this registry against actual `tmux list-sessions` output to catch stale entries.

**Files:**
- `packages/core/src/canvas/terminal-registry.js` (new) — CRUD for the session registry
- `packages/core/src/canvas/terminal-server.js` — update registry on connect/disconnect/kill

### 3. Graceful Orphan Handling

When a widget is deleted:

1. Mark the session as `orphaned` in the registry (don't kill TMUX)
2. Start a grace timer (configurable, default 5 minutes)
3. If the widget is re-added (undo) within the grace period, auto-reconnect
4. After the grace period, check if processes are still running inside the session:
   - If yes, keep alive but mark as `orphaned-active` (discoverable via session browser)
   - If no (just a shell prompt), kill the TMUX session and remove from registry

**Files:**
- `packages/core/src/canvas/terminal-server.js` — replace `killTerminalSession()` with `orphanTerminalSession()`
- `packages/core/src/canvas/server.js` — call orphan instead of kill on widget delete

### 4. Cross-Worktree Conflict Resolution

When a widget connects and the TMUX session exists but is `attached` to a different worktree:

1. Server detects the conflict (session registry shows different branch for `attachedWidgetId`)
2. Server sends a WebSocket message: `{ type: "conflict", currentBranch: "...", sessionBranch: "..." }`
3. Client shows a dialog: "This session is attached to worktree `X`. Detach from there and attach here?"
4. If user confirms, server detaches the other client (sends `detach` message to old WS) and reattaches

**Files:**
- `packages/core/src/canvas/terminal-server.js` — conflict detection in `handleConnection()`
- `packages/react/src/canvas/widgets/TerminalWidget.jsx` — handle conflict message, show dialog

### 5. Session Browser (Interactive List)

Modeled after `copilot --resume` UI (see reference image on canvas). A compact overlay/dropdown triggered from the terminal widget toolbar that displays sessions in a table with keyboard navigation.

**Layout:**

```
Select a session:

Sessions: This canvas   All canvases   All branches (tab to cycle)

  #   Status       Modified    Created     Summary
  ── This canvas ──────────────────────────────────────
❯ 1.  Live         2m ago      30m ago     Copilot: migrate Button to CSS Modules ! Live
  2.  Background   15m ago     1h ago      Shell: npm run build → tests
  ── Other canvases (this branch) ─────────────────────
  3.  Background   20m ago     2h ago      design-system › Copilot: refactor Dialog
  4.  Archived     1h ago      3h ago      design-system › Shell: debugging canvas perf

↑↓ navigate · Enter select · Esc cancel · / search · t open tmux (advanced)
```

When the user tabs to **All branches**, cross-branch sessions appear grouped horizontally by branch:

```
Sessions: This canvas   All canvases  [All branches] (tab to cycle)

  #   Status       Modified    Created     Summary
  ── 4.2.0 (current) ─────────────────────────────────
  ... (same as "All canvases" view)
  ── 4.1.0 ────────────────────────────────────────────
  5.  Archived     2h ago      1d ago      design-system › Copilot: fix viewfinder routing ! Active processes
  6.  Background   3h ago      2d ago      test › Shell: npm audit
  ── main ─────────────────────────────────────────────
  7.  Archived     1d ago      3d ago      examples › Shell: setup demo data

↑↓ navigate · Enter select · Esc cancel · / search · t open tmux (advanced)
```

**Columns:**
- **#** — row number
- **Status** — `Live` (green), `Background` (dim), `Archived` (yellow)
  - **Live** = TMUX `attached` — session is connected to a widget right now
  - **Background** = TMUX `detached` — session is alive but not connected to any widget
  - **Archived** = TMUX `orphaned` (widget deleted) — session preserved during grace period or because it has active processes
- **Modified** — last WebSocket activity (relative time)
- **Created** — when the TMUX session was first created (relative time)
- **Summary** — auto-generated from session activity: "Copilot: {last topic}" if a Copilot CLI session is detected, or "Shell: {last commands}" otherwise. Includes branch prefix for cross-branch sessions.

**Badges:**
- `! Live` (green) — session is currently attached to a widget somewhere
- `! Active processes` (yellow) — archived session still has running processes

**Grouping (tab to cycle):**
- **This canvas** (default) — sessions belonging to widgets on the current canvas
- **All canvases** — all sessions on the current worktree/branch, grouped by canvas
- **All branches** — includes sessions from other branches (shown with branch prefix)

**Interaction:**
- Arrow keys to navigate, Enter to select (detaches from previous widget if needed), Esc to dismiss
- `/` to search/filter by summary text
- `t` to open native tmux session manager (power users)
- When selecting a "Live" session, show confirmation: "This session is attached to another widget. Detach and move here?"

**Files:**
- `packages/react/src/canvas/widgets/TerminalSessionPicker.jsx` (new) — the interactive list component
- `packages/react/src/canvas/widgets/TerminalWidget.jsx` — integrate picker, add toolbar trigger button
- `packages/core/src/canvas/terminal-server.js` — add `GET /_storyboard/terminal/sessions` HTTP endpoint

### 6. API Endpoints

New HTTP endpoints on the canvas/terminal server:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/_storyboard/terminal/sessions` | List all sessions (filterable by branch) |
| POST | `/_storyboard/terminal/sessions/:id/detach` | Detach a session from its current widget |
| POST | `/_storyboard/terminal/sessions/:id/attach` | Attach a session to a widget |
| DELETE | `/_storyboard/terminal/sessions/:id` | Kill a session immediately |

**Files:**
- `packages/core/src/canvas/terminal-server.js` — add HTTP route handlers

---

## File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/core/src/canvas/terminal-server.js` | Major refactor | Scoped naming, registry integration, conflict detection, orphan handling, HTTP API |
| `packages/core/src/canvas/terminal-registry.js` | New file | Session registry (JSON persistence + in-memory cache) |
| `packages/core/src/canvas/server.js` | Minor edit | Call `orphanTerminalSession()` instead of `killTerminalSession()` on widget delete |
| `packages/core/src/vite/server-plugin.js` | Minor edit | Pass branch name to terminal server |
| `packages/react/src/canvas/widgets/TerminalWidget.jsx` | Moderate refactor | Send canvas context, handle conflict messages, integrate session picker |
| `packages/react/src/canvas/widgets/TerminalSessionPicker.jsx` | New file | Dropdown session browser component |
| `packages/react/src/canvas/widgets/TerminalSessionPicker.module.css` | New file | Styles for session picker |
| `packages/core/src/canvas/terminal-context.js` | New file | Generate/update `.session.md` context files from TMUX pane capture |
| `packages/react/src/canvas/widgets/TerminalSessionContext.jsx` | New file | Warm-start banner when context exists but no local session |

## Implementation Order

1. **Terminal Registry** — foundation for everything else
2. **Scoped Session Naming** — branch + canvas + widget prefix
3. **Graceful Orphan Handling** — replace kill with orphan + grace timer
4. **Session List API** — HTTP endpoint for browsing sessions
5. **Cross-Worktree Conflict Detection** — detect + resolve conflicts on connect
6. **Session Browser UI** — dropdown picker in terminal widget
7. **Session Context Files** — shareable `.session.md` files + warm-start UI

## Registry: Local-Only, Not Git-Committed

The registry file (`.storyboard/terminal-sessions.json`) is **machine-local state** and must NOT be committed to git. It already lives inside `.storyboard/` which is gitignored.

**Why not shared?**
- TMUX sessions are OS processes on a specific machine — they can't be "continued" on another machine
- Copilot CLI sessions inside TMUX are similarly local — they're tied to the terminal's PTY and the local CLI process. There's no way to hand off a running Copilot CLI session to another person
- The registry is ephemeral — it's reconstructed from live `tmux list-sessions` on every server startup, so it self-heals if the file is deleted

**What IS shared (via git)?**
- The canvas `.jsonl` files — which contain the terminal widget definitions (position, size, widget ID)
- **Session context files** (see below) — committed markdown that describes what a session was doing, so another user can reconstruct it

### 7. Session Context Files (Shareable via Git)

When a terminal widget has an active session, the system generates and commits a **session context file** at:

```
assets/terminal-sessions/{canvasId}/{widgetId}.session.md
```

Example content:

```markdown
# Terminal Session: design-system / terminal-abc123

## Snapshot

- **Last Commit:** `a1b2c3d` — "refactor: migrate Button to CSS modules" (2026-04-19T10:30:00Z)
- **Branch:** 4.2.0
- **Canvas:** design-system (storyboarding/terminal-widget-plan-v6)
- **Canvas Widgets at Time of Snapshot:** 12 widgets (3 sticky-notes, 2 markdown, 1 terminal, 6 story)

## What Was Planned

- Migrate all `sx` styled-components in Button, Dialog, and Header to CSS Modules
- Update corresponding stories to reflect new class names

## What Was Implemented

- Button component fully migrated to CSS Modules
- Button.story.jsx updated and passing
- Dialog migration started (Dialog.module.css created, 3 of 7 style blocks converted)

## What Was Interrupted / Future Steps

- Dialog migration incomplete — remaining: overlay backdrop, close button, footer actions, responsive breakpoints
- Header migration not started
- Need to verify dark mode theming works with CSS Modules (untested)

## Last Working Directory
/Users/dfosco/workspace/storyboard-core/.worktrees/4.2.0

## Shell History (last 20 commands)
- npm run build
- copilot "refactor Button component to use CSS modules"
- git diff --stat
- npm test -- --run src/components/Button/Button.test.js

## Running Processes
- copilot (Copilot CLI session — was mid-conversation about Dialog migration)

## Environment
- Shell: /bin/zsh
- Node: v22.x

## How to Continue
This session was migrating components from sx to CSS Modules. To continue:
1. Open this canvas and click the terminal widget
2. A fresh session will start — the Dialog migration is half-done (see "Interrupted" above)
3. Or paste this file's content into Copilot CLI as context to resume where the previous session left off
```

**How it works:**
- **Snapshot trigger:** Context file is generated/updated on session disconnect, widget delete, or explicit "save context" action
- **Last commit:** Captured via `git rev-parse HEAD` + `git log -1 --format="%s"` in the session's cwd
- **Canvas state:** Read from canvas server API at snapshot time — widget count and type summary
- **Planned / Implemented / Interrupted:** Extracted from Copilot CLI conversation history if available (the CLI can export session summaries), or from a structured comment the user leaves in the terminal before disconnecting. If neither is available, the system generates a best-effort summary from shell history (e.g., files edited, tests run, build commands)
- **Shell history:** Read from TMUX via `tmux capture-pane -p -t {session}` (last N lines of scrollback)
- The file is written to `assets/terminal-sessions/` which IS committed to git
- When another user opens the canvas and sees the terminal widget, if no local TMUX session exists, the widget shows the session context as a "warm start" prompt: "This terminal had an active session. [View context] [Start fresh] [Regenerate from context]"
- "Regenerate from context" feeds the `.session.md` into the new shell session (e.g., cd to the directory, optionally replay commands)

**What a colleague sees when opening your canvas:**
1. The terminal widget renders normally
2. Instead of a blank shell, they see a banner: "Previous session by @dfosco — [View context] [Start fresh]"
3. "View context" shows the `.session.md` content inline
4. "Start fresh" opens a normal new session
5. If Copilot CLI is available, a third option: "Continue with Copilot" feeds the context markdown to a new Copilot session

**Files:**
- `packages/core/src/canvas/terminal-context.js` (new) — generates/updates `.session.md` files
- `packages/react/src/canvas/widgets/TerminalWidget.jsx` — show warm-start UI when context file exists but no local session
- `packages/react/src/canvas/widgets/TerminalSessionContext.jsx` (new) — the warm-start banner/viewer component

## Resolved Questions

- **Grace period:** 5 minutes default, configurable via `storyboard.config.json` (e.g. `terminal.orphanGracePeriod: 300`)
- **Default session filter:** This canvas (current branch only). Cross-branch sessions only shown when user tabs to "All branches"
- **TMUX session name length:** Max 256 chars. Truncate branch names and hash if the full `sb-{branch}--{canvasId}--{widgetId}` exceeds the limit (e.g. `sb-{hash8}--{canvasId}--{widgetId}`)
