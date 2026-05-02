# Plan: Unified Terminal Identity — Pre-reserve + Typed Injection

## Problem

Hot-pool agent sessions have no widget identity. The agent's `$STORYBOARD_WIDGET_ID` is never set because the pool session was created before the widget existed. When the agent tries to read its config, it falls back to `ls -t .storyboard/terminals/*.env | head -1` — grabbing **whichever env file was written most recently** — which could belong to any widget on the canvas.

The cold path (no hot pool) has a different but related fragility: it exports env vars via `tmux send-keys` *after* the agent has already started, creating a race window where the agent could read stale identity.

The two paths (hot vs cold) diverge significantly in `terminal-server.js` lines 732–835, making the system hard to debug.

## Approach

Unify hot and cold paths into a single identity flow:

1. **Pre-reserve** the widget ID + displayName in a `{tmuxName}.json` file at canvas widget creation time (before the terminal WebSocket connects)
2. **Inject** identity into the agent via a typed `[System]` message after the tmux session is bound to the widget (works for both hot and cold paths since the agent is already consuming stdin at that point)
3. **Simplify** by removing the divergent hot/cold identity branches — both paths use the same "bind tmux → write config → type system message" sequence

## Current Flow (broken)

```
COLD PATH:
  1. Widget renders → WS connects → handleConnection()
  2. tmux new-session created
  3. writeTermConfig() writes {hash}.json + {widgetId}.json symlink
  4. tmux send-keys exports env vars into the shell
  5. Shell runs startup command (e.g., `copilot --agent terminal-agent`)
  6. Agent reads $STORYBOARD_WIDGET_ID → finds config ✅

HOT PATH:
  1. Hot pool creates tmux session `sb-pool-{id}` (no widget identity)
  2. Agent CLI launched inside pool session (no widget ID, no display name)
  3. Agent is READY and waiting for user input
  4. Widget renders → WS connects → handleConnection()
  5. tmux session renamed to canonical name
  6. writeTermConfig() writes {hash}.json + {widgetId}.json symlink
  7. tmux set-environment sets vars (only for future shells, not current one)
  8. .env file written ✅
  9. Agent reads $STORYBOARD_WIDGET_ID → EMPTY → falls back to ls -t *.env → WRONG IDENTITY ❌
```

## Proposed Flow (unified)

```
BOTH PATHS:
  1. POST /widget creates agent widget on canvas
     → generateWidgetId('agent') → e.g., agent-y1foc2
     → generateFriendlyName() → e.g., maple-martin
     → PRE-RESERVE: write identity file (NEW)
  2. Widget renders → WS connects → handleConnection()
  3a. HOT: acquire pool session, rename tmux to canonical name
  3b. COLD: create new tmux session, export env vars, run startup command
  4. writeTermConfig() writes full config ({hash}.json + {widgetId}.json symlink)
  5. Write .env file with all STORYBOARD_* vars
  6. TYPE SYSTEM MESSAGE into agent stdin (NEW — same for both paths):
     "[System] Your identity: widgetId=agent-y1foc2, displayName=maple-martin, canvasId=..., configFile=.storyboard/terminals/agent-y1foc2.json"
  7. Agent reads the system message → knows who it is → reads config file ✅
```

## Implementation Todos

### 1. Pre-reserve identity at widget creation time
**File:** `packages/core/src/canvas/server.js` — POST `/widget` handler (~line 536)

When a terminal/agent widget is added to the canvas, write a preliminary identity file immediately — before the widget renders or connects.

- After `generateWidgetId(type)` and `generateFriendlyName()`, call a new `preReserveTerminalIdentity()` function
- This writes a minimal JSON file at `.storyboard/terminals/{widgetId}.json` containing `{ widgetId, preDisplayName, canvasId, branch, reserved: true }`
- The `reserved: true` flag distinguishes pre-reserved configs from fully-populated ones
- This ensures the config file exists by the time the agent needs it, even for hot-pool sessions

### 2. Create `preReserveTerminalIdentity()` in terminal-config.js
**File:** `packages/core/src/canvas/terminal-config.js`

New exported function:
```js
export function preReserveTerminalIdentity({ widgetId, preDisplayName, canvasId, branch, serverUrl }) {
  // Write directly to the widgetId-named file (not the hash-keyed one)
  // This is the file the agent will read via its system message
  const dir = join(rootDir, TERMINALS_DIR)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  
  const fp = join(dir, `${widgetId}.json`)
  const data = {
    widgetId,
    preDisplayName,       // promoted to displayName when writeTerminalConfig() runs
    displayName: preDisplayName, // also set immediately so agents can read it right away
    canvasId,
    branch,
    reserved: true,
    connectedWidgets: [],
    messaging: null,
    agentStatus: null,
    updatedAt: new Date().toISOString(),
  }
  atomicWrite(fp, data)
}
```

The existing `writeTerminalConfig()` will later overwrite this with the full config (hash-keyed file + symlink), promoting it from reserved → fully populated.

### 3. Unify identity injection in terminal-server.js
**File:** `packages/core/src/canvas/terminal-server.js` — `handleConnection()` (~line 441)

Create a new `injectIdentityMessage()` function that types a system message into the tmux session. Call it from BOTH hot and cold paths, after the tmux session is bound and the config is written.

```js
function injectIdentityMessage(tmuxName, { widgetId, displayName, canvasId, branch, serverUrl }) {
  if (!hasTmux) return
  
  const configFile = `.storyboard/terminals/${widgetId}.json`
  const msg = `[System] Your terminal identity has been set. widgetId=${widgetId} displayName=${displayName} canvasId=${canvasId} configFile=${configFile}`
  
  try {
    execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
    execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
  } catch { /* best effort */ }
}
```

**Hot path changes** (line ~732):
- Remove the comment about "agent reads config files by tmux session name"
- After renaming tmux session and writing config, call `injectIdentityMessage()`
- Keep `deliverPendingMessages()` after identity injection

**Cold path changes** (line ~739):
- After env exports and startup command launch, once the agent is ready (readiness signal or delay), call `injectIdentityMessage()`
- This replaces the reliance on `$STORYBOARD_WIDGET_ID` env var as the primary identity source

### 4. Same treatment for prompt/spawn
**File:** `packages/core/src/canvas/server.js` — POST `/prompt/spawn` handler (~line 2077)

The prompt spawn path already writes the config and env file. Add `injectIdentityMessage()` call after the prompt agent command is sent:

- After `sendCmd()` in both warm and cold paths, schedule `injectIdentityMessage()` with a delay (warm: 500ms, cold: after readiness)

### 5. Update agent instructions
**File:** `packages/core/src/canvas/terminal-agent-instructions.md`

Update Step 1 to teach agents the new identity resolution:

```markdown
## Step 1: Read terminal config

Your identity is provided via a [System] message when you start. It includes your
widgetId and config file path. Read your config:

\`\`\`bash
cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json
\`\`\`

If the env var is empty, resolve via your tmux session:
\`\`\`bash
TMUX_NAME=$(tmux display-message -p '#{session_name}' 2>/dev/null)
cat .storyboard/terminals/${TMUX_NAME}.json
\`\`\`
```

### 6. Update AGENTS.md agent instructions template
**File:** Root-level agent instructions in AGENTS.md (the system prompt template injected into agents)

Update the Step 1 fallback chain to:
1. `$STORYBOARD_WIDGET_ID` (env var — works for cold path shells)
2. `[System]` message (injected text — works for hot+cold agents)  
3. tmux session name → `.storyboard/terminals/{tmuxName}.json` (ultimate fallback)

Remove the `ls -t *.env | head -1` fallback entirely — it's the root cause of the identity confusion.

### 7. Naming convention: `preDisplayName` → `displayName`
**Files:** All widget creation + terminal config paths

The field is always `displayName` everywhere. At pre-reserve time (before the widget renders), we write it as `preDisplayName` to signal it was assigned early. When `writeTerminalConfig()` runs later at connection time, it promotes `preDisplayName` → `displayName` (or just overwrites with the same value). This keeps a clear audit trail: if you see `preDisplayName` still present in a config, the widget never connected.

## Notes

- The `[System]` message pattern is already proven: messaging (`📩 senderName: message`) and skill injection (`📡 [Two-way messaging ACTIVE...]`) both use `tmux send-keys` to type formatted text into agent stdin. This is the same mechanism.
- The system message is fire-and-forget — the agent sees it as a user message in its conversation context. It doesn't need to "respond" to it.
- For cold-path bare terminals (no agent running), `injectIdentityMessage()` would type into a shell prompt. This is harmless (just prints an unrecognized command error) but we could guard it behind an `isAgent` check. However, keeping it uniform simplifies debugging — the message is visible in the terminal scrollback either way.
- The pre-reserve step ensures config files are available before the agent reads them, eliminating the race condition where the config doesn't exist yet when the agent first tries to load it.
- Consider gating `injectIdentityMessage()` for agent/prompt types only (skip bare terminals) to avoid cluttering terminal scrollback with system messages that a human user would see.
