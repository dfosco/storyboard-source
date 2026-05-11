# `packages/storyboard/src/core/canvas/terminal-server.js`

<!--
source: packages/storyboard/src/core/canvas/terminal-server.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/terminal-server.js`](./terminal-server.js.md) is the PTY/WebSocket backend for canvas terminal, prompt, and agent widgets. It binds browser WebSocket sessions to long-lived tmux sessions, manages reconnect semantics, captures terminal snapshots and private buffers, and injects canvas identity plus hub-role context into running agents.

This file is the runtime half of the terminal stack. [`packages/storyboard/src/core/canvas/server.js`](./server.js.md) mutates canvas structure and terminal metadata, while [`packages/storyboard/src/core/canvas/terminal-registry.js`](./terminal-registry.js.md), [`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md), and [`packages/storyboard/src/core/canvas/hot-pool.js`](./hot-pool.js.md) are orchestrated here to turn those structures into live terminal sessions with persistence across refreshes and transient disconnects.

## Composition

The module starts by optionally loading `ws`, `node-pty`, and checking `tmux` availability so the feature degrades cleanly when prerequisites are missing:

```js
let WebSocketServer
try {
  WebSocketServer = (await import('ws')).WebSocketServer
} catch {
  WebSocketServer = null
}
```

```js
let pty
try {
  pty = await import('node-pty')
} catch {
  pty = null
}
```

Shell theming and environment leakage are normalized before tmux sessions are spawned. The file strips prompt/theme variables and applies explicit tmux overrides:

```js
const SHELL_CONFIG_STRIP_RE = /^(ZDOTDIR|STARSHIP(_.*)?|GHOSTTY(_.*)?|POWERLEVEL.*|P9K_.*|P10K_.*|ZSH_THEME|BASH_ENV|... )$/

function cleanEnv() {
  const filtered = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (!isShellConfigVar(k) && !COLOR_SUPPRESS_VARS.has(k)) filtered[k] = v
  }
  return filtered
}
```

The module keeps rolling output buffers in memory so it can serve two retention windows: about five minutes for private buffers and one minute for public snapshots.

```js
const rollingBuffers = new Map()
const BUFFER_MAX_AGE_MS = 5 * 60 * 1000
const SNAPSHOT_MAX_AGE_MS = 1 * 60 * 1000
```

Identity and hub coordination are injected into running sessions through `tmux send-keys`, not through a side-channel protocol:

```js
function injectIdentityMessage(tmuxName, { widgetId, displayName, canvasId, branch: _branch, serverUrl }) {
  const configFile = `.storyboard/terminals/${widgetId}.json`
  const msg = `[System] Your terminal identity has been set. widgetId=${widgetId} ...`
  execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
}
```

Snapshot capture persists both private and public artifacts. Private buffers live in `.storyboard/terminal-buffers/`, while public snapshots live in `assets/.storyboard-public/terminal-snapshots/` unless the widget is marked private:

```js
function captureSnapshot({ tmuxName, widgetId, canvasId, prettyName, cols, rows, createdAt }) {
  const bufferPath = join(bufferDir(), `${widgetId}.buffer.json`)
  const snapshotPath = join(publicSnapshotDir(), `${widgetId}.snapshot.json`)
```

```js
if (isPrivate) {
  if (existsSync(snapshotPath)) {
    renameSync(snapshotPath, tildeSnapshotPath)
  }
  return
}
```

`spawnWithCleanup()` is the PTY pressure valve. On PTY exhaustion it tries registry-driven cleanup waves (`archived`, then `background`) before surfacing a resource-limited error with session stats.

Server attachment happens in `setupTerminalServer(httpServer, base, branch, hotPoolManager)`. It initializes the registry/config layers, applies tmux shell overrides, captures the eventual bound port, and attaches a `WebSocketServer` on the `/_storyboard/terminal/` upgrade path:

```js
export function setupTerminalServer(httpServer, base = '/', branch = 'unknown', hotPoolManager = null) {
  initRegistry(root, { gracePeriod: termCfg.orphanGracePeriod })
  initTerminalConfig(root)
  const wss = new WebSocketServer({ noServer: true })
  httpServer.on('upgrade', (req, socket, head) => {
    if (!pathname.startsWith(TERMINAL_PATH_PREFIX)) return
```

The upgrade handler splits into read-only observers and full interactive sessions:

```js
if (readOnly) {
  handleReadOnlyConnection(ws, sessionId, canvasId)
} else {
  handleConnection(ws, sessionId, canvasId, prettyName, widgetStartupCommand)
}
```

`orphanTerminalSession(widgetId)` is the deletion path: archive the session in the registry, close the WebSocket, and kill only the foreground PTY so the underlying tmux session can survive grace-period recovery.

## Dependencies

- Node `child_process`, `fs`, `path`, `url`, and `os`.
- `ws` and optional `node-pty` runtime dependencies.
- `../logger/devLogger.js` for diagnostics.
- [`packages/storyboard/src/core/canvas/terminal-registry.js`](./terminal-registry.js.md) for persistent session identity and cleanup.
- [`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md) for per-widget metadata.
- `../worktree/serverRegistry.js` and `../worktree/port.js` for local server URL detection.
- `../messaging/delivery.js` and `../messaging/presence.js` for hub/presence integration.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js` — orphans sessions when widgets are deleted.
- `packages/storyboard/src/core/vite/server-plugin.js` — boots the terminal WebSocket backend during dev-server startup.

## Notes

The file imports `tmpdir` from `node:os`, but the architecture is built around project-local persistence: terminal configs, buffers, and snapshots live under `.storyboard/` or `assets/.storyboard-public/`. The tmux-backed reconnect model is the main architectural decision here: browser disconnects kill PTYs, not canonical sessions.
