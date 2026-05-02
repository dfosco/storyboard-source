# Terminal Agents — Background Agentic Flows on Canvas

## Current State (4.2.0 baseline)

### Phase 0 — TMUX Session Management: ✅ DONE
Already implemented on `4.2.0`:

- ✅ **Scoped session naming** — `sb-{hash(branch+canvas+widget)}` in `terminal-server.js`
- ✅ **Session registry** — `terminal-registry.js` with `live`/`background`/`archived` statuses, friendly names, in-memory Map + JSON persistence, tmux reconciliation on startup
- ✅ **Graceful orphan handling** — `orphanTerminalSession()` in server.js on widget delete, grace timer, `orphanSession()` / `orphanSessionByWidget()` in registry
- ✅ **Session List API** — `GET /_storyboard/terminal/sessions`, `POST .../detach`, `POST .../orphan`, `DELETE .../sessions/:name`
- ✅ **Terminal CLI** — `storyboard terminal {close|open|remove} --id`, `storyboard sessions` (interactive browser)
- ✅ **Widget lifecycle hooks** — auto-assign pretty name on terminal create, orphan on delete
- ✅ **Server plugin integration** — branch detection, terminal server init with branch, session API routes
- ✅ **Canvas context** — TerminalWidget sends `canvasId` as WS query param
- ✅ **Widget config** — terminal type in `widgets.config.json` with resize, connectors, interactGate

### Not yet implemented from Phase 0:
- ❌ **Cross-worktree conflict resolution** — conflict dialog when session exists on different worktree
- ❌ **Session browser UI** — dropdown picker in terminal widget (CLI exists, but no in-widget UI)
- ❌ **Session context files** — `.session.md` files committed to git for warm-start

---

## Phase 1 — Terminal Context & Communication Bus

### Concept
Builds on Phase 0's registry to add **semantic context awareness** and a **communication bus** for agents.

**Terminal config files**: `.storyboard/terminals/{canvasId}-{widgetId}.json`
- widgetId, canvasId, canvasFile, connectedWidgets[]
- Updated on connector add/remove
- Agents read this on startup for context

**Communication bus** (API, not magic output strings):
- `POST /_storyboard/canvas/agent/signal` — `{ widgetId, canvasId, status: done|error|running, message?, data? }`
- `npx storyboard agent signal --widget --canvas --status --message`
- Server pushes to canvas clients (HMR v1, WebSocket later)

**Canvas ↔ Agent I/O**:
- In: Props + connected widgets + prompt → terminal config
- Out: Agent calls canvas server API (⚠️ NEVER write .canvas.jsonl directly)

**Startup sequences**: Configurable per widget via `terminalScaffolding` prop. Default in `storyboard.config.json` → `canvas.terminal.defaultStartupSequence`.

### Implementation

1. **terminal-config.js** — `packages/core/src/canvas/terminal-config.js` (NEW)
   - `writeTerminalConfig()`, `updateTerminalConnections()`, `markTerminalDeleted()`, `readTerminalConfig()`
   - Writes to `.storyboard/terminals/`

2. **Agent signal endpoint** — `packages/core/src/canvas/server.js`
   - `POST /_storyboard/canvas/agent/signal` — store status, push to clients
   - `GET /_storyboard/canvas/agent/status?widgetId=...` — poll fallback

3. **Agent signal CLI** — `packages/core/src/cli/agent.js` (NEW)
   - `npx storyboard agent signal --widget --canvas --status --message`
   - Wire into CLI index.js

4. **Connector lifecycle hooks** — `packages/core/src/canvas/server.js`
   - POST /connector: if terminal end → `updateTerminalConnections()`
   - DELETE /connector: update connections
   - Resolve connected widget objects from materialized canvas state

5. **Terminal agent instructions** — `.storyboard/terminal-agent.md` (template)
   - Read terminal config, resolve connected widgets by type
   - Call `npx storyboard agent signal --status done` when finished

6. **PTY env vars** — `packages/core/src/canvas/terminal-server.js`
   - Add `STORYBOARD_WIDGET_ID`, `STORYBOARD_CANVAS_ID` to PTY env

7. **Default startup sequence** — `storyboard.config.json`
   - `canvas.terminal.defaultStartupSequence`

8. **Startup sequence executor** — `packages/core/src/canvas/terminal-server.js`
   - `executeStartupSequence(pty, ws, sequence)` — iterate steps, handle waits
   - After `renderAfterStep` → send `{ type: 'render' }` over WS

**Order**: 1 → 6 → 2 → 3 → 4 → 5 → 7 → 8

---

## Phase 2 — Background Agents & Smart Actions

### Concept
Smart Action Widget: predefined prompt, headless tmux+copilot, invisible to user. Uses Phase 0's registry for session management and Phase 1's bus for signaling.

User clicks "Run" → spawn headless tmux → copilot (autopilot) → execute prompt → call canvas API → signal done → tear down.

**Error recovery**: error indicator on widget → click to peek (reconnect headless tmux to visible terminal via Phase 0 attach API). 5-min idle timeout.

**Concurrent agents**: each widget gets own scoped tmux session.

### Implementation

1. **Agent spawn endpoint** — `POST /_storyboard/canvas/agent/spawn`
   - `{ canvasId, widgetId, prompt, autopilot: true }`
   - Create scoped tmux via registry, write terminal config, launch copilot

2. **Agent spawn CLI** — `npx storyboard agent spawn --widget --canvas --prompt`

3. **Agent teardown** — auto cleanup on done, keep alive on error, 5-min idle timeout

4. **Agent peek endpoint** — `POST /_storyboard/canvas/agent/peek`
   - Find tmux via registry → attach to new terminal widget on canvas

5. **Action widget config** — `packages/core/widgets.config.json`
   - New `action` widget type: prompt, label, autoRun, connectedContext

6. **ActionWidget.jsx** — Run → spawn, status display, peek on error

7. **Agent instructions template** — `.storyboard/agent-instructions.md`
   - Template vars: {widgetId}, {canvasId}, {prompt}, {connectedWidgets}

8. **Widget error UI** — error badge, click → peek, dismiss → teardown

**Order**: 1 → 2 → 3 → 7 → 6 → 5 → 4 → 8
