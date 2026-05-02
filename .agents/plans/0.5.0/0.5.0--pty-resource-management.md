# PTY Resource Management & Session Cleanup

## Problem

Terminal sessions accumulate (archived, background) and exhaust macOS PTY devices (≈512 limit). When this happens:

1. **Browser**: Terminal widgets show `zzz → waking up → zzz` with no explanation — the user doesn't know they're resource-limited
2. **TUI**: The session list is very long and there's no quick way to bulk-clean sessions
3. **Server**: No automatic remediation — `pty.spawn()` just fails and the error is swallowed
4. Even `bash` stops working: `posix_openpt failed: Device not configured`

## Approach

Three layers of defense:

1. **Manual cleanup (TUI)** — Tab shortcut in session list for instant bulk cleanup
2. **Reactive cleanup (Server)** — Auto-cleanup when `pty.spawn()` fails + retry
3. **User feedback (Browser)** — Informative error + "Close background sessions" button

Cleanup operations apply to **all session types equally** (terminal, agent, prompt).

## Implementation

### 1. Add bulk cleanup to terminal registry

**File:** `packages/core/src/canvas/terminal-registry.js`

- Add `bulkCleanup({ statuses })` — kill matching sessions, return stats
- Add `getSessionStats()` — return `{ live, background, archived, total }`

### 2. Server batch cleanup API

**File:** `packages/core/src/vite/server-plugin.js`

- `POST /_storyboard/terminal/sessions/cleanup` — bulk kill by status
- `GET /_storyboard/terminal/sessions/stats` — quick counts

### 3. Auto-cleanup on PTY spawn failure

**File:** `packages/core/src/canvas/terminal-server.js`

- Catch PTY spawn errors → progressive cleanup (archived → background) → retry → structured error

### 4. TUI Tab shortcut in session list

**File:** `packages/core/src/cli/sessions.js`

- Pre-prompt: Tab → cleanup flow, Enter → browse sessions
- Cleanup submenu with confirmation

### 5. Browser resource-limited UX

**File:** `packages/react/src/canvas/widgets/TerminalWidget.jsx`

- Handle `resource-limited` WS message
- Show informative overlay + "Close background sessions" button
