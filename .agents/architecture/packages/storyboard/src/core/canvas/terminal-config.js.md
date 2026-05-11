# `packages/storyboard/src/core/canvas/terminal-config.js`

<!--
source: packages/storyboard/src/core/canvas/terminal-config.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/terminal-config.js`](./terminal-config.js.md) is the persistent context layer for terminal-, prompt-, and agent-backed canvas widgets. It writes one JSON config per widget under `.storyboard/terminals/` so long-lived tmux sessions and CLI agents can recover their identity, canvas membership, viewport, messaging peers, and hub role information without asking the browser for live state.

This file sits between the structural graph logic in [`packages/storyboard/src/core/canvas/server.js`](./server.js.md), the session runtime in [`packages/storyboard/src/core/canvas/terminal-server.js`](./terminal-server.js.md), and external CLI helpers. The key architectural choice is stable hashed storage plus widget/tmux symlinks: canonical data lives at a branch+canvas+widget-derived hash path, while user-facing lookups can still resolve by widget ID or tmux name.

## Composition

Initialization is lightweight: set the project root and ensure `.storyboard/terminals` exists.

```js
export function initTerminalConfig(root) {
  rootDir = root
  const dir = join(rootDir, TERMINALS_DIR)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
```

The file naming contract is deterministic. `configKey()` hashes branch, canvas, and widget identity; `configPath()` turns that into the canonical JSON path:

```js
function configKey(branch, canvasId, widgetId) {
  const input = `${branch}::${canvasId}::${widgetId}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

function configPath(branch, canvasId, widgetId) {
  return join(rootDir, TERMINALS_DIR, `${configKey(branch, canvasId, widgetId)}.json`)
}
```

All writes go through an atomic tmp-and-rename helper:

```js
function atomicWrite(filePath, data) {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, filePath)
}
```

`preReserveTerminalIdentity()` is the earliest write path. It is called before a terminal widget has rendered or connected, creating a minimal placeholder that hot-pool agents can discover immediately:

```js
export function preReserveTerminalIdentity({ widgetId, preDisplayName, canvasId, branch, serverUrl }) {
  const data = {
    widgetId,
    preDisplayName,
    displayName: preDisplayName,
    canvasId,
    branch,
    serverUrl: serverUrl || null,
    reserved: true,
    connectedWidgets: [],
    messaging: null,
    role: null,
    hubs: [],
    agentStatus: null,
    viewport: readCurrentViewport(rootDir) || null,
    updatedAt: new Date().toISOString(),
  }
```

`writeTerminalConfig()` upgrades that placeholder into the canonical config, resolving the worktree, dev domain, server URL, widget props, and symlink aliases:

```js
export function writeTerminalConfig({ branch, canvasId, widgetId, canvasFile = null, serverUrl = null, tmuxName = null, widgetProps = null, displayName = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  let existing = {}
  try { existing = JSON.parse(readFileSync(fp, 'utf8')) } catch { /* new file */ }
```

```js
const config = {
  ...existing,
  widgetId,
  displayName: displayName || existing.displayName || widgetProps?.alias || widgetProps?.prettyName || existing.widgetProps?.prettyName || null,
  canvasId,
  canvasFile: canvasFile || existing.canvasFile || null,
  branch,
  worktree,
  devDomain,
  serverUrl,
  workingDirectory: rootDir,
  deleted: false,
```

After the hash file is written, lookup symlinks are created for both widget ID and tmux session name:

```js
const hashName = `${configKey(branch, canvasId, widgetId)}.json`
const symPath = join(dir, `${widgetId}.json`)
if (existsSync(symPath)) unlinkSync(symPath)
symlinkSync(hashName, symPath)
```

The server uses `updateTerminalConnections()` to stamp graph-derived peer info, messaging permissions, hub membership, and role assignments into the config:

```js
export function updateTerminalConnections({ branch, canvasId, widgetId, connectedWidgets, widgetProps = null, messaging = null, role = null, hubs = null }) {
  if (widgetProps) {
    config.widgetProps = widgetProps
    if (widgetProps.alias) config.displayName = widgetProps.alias
    else if (widgetProps.prettyName) config.displayName = widgetProps.prettyName
  }
  config.connectedWidgets = connectedWidgets || []
  config.messaging = messaging || null
```

The remainder of the API is operational state management: tombstoning (`markTerminalDeleted`, `unmarkTerminalDeleted`), reads (`readTerminalConfig`, `readTerminalConfigById`), agent status (`updateAgentStatus`), canvas-scoped agent listing (`listAgentsForCanvas`), pending peer messages (`updatePendingMessages`, `takePendingMessages`), and summarized output sharing (`updateLatestOutput`).

## Dependencies

- Node `fs`, `path`, and `crypto` for file storage and stable hashing.
- `../worktree/serverRegistry.js` and `../worktree/port.js` to infer the active local dev server URL.
- [`packages/storyboard/src/core/canvas/selectedWidgets.js`](./selectedWidgets.js.md) to capture the current viewport at write time.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js` — reserves identity, updates connector-derived config state, and lists agents on a canvas.
- `packages/storyboard/src/core/canvas/terminal-server.js` — writes session config during WebSocket attach and reads configs by widget ID.
- `packages/storyboard/src/core/cli/agent.js`
- `packages/storyboard/src/core/cli/terminal-messaging.js`
- `packages/storyboard/src/core/cli/terminal-welcome.js`

## Notes

The canonical file name is hash-based so renaming a widget or changing display text does not break session recovery. Symlinks provide ergonomic resolution while preserving that stable underlying storage.
