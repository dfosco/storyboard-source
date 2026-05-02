/**
 * Terminal Config — per-terminal context files for agent awareness.
 *
 * Each terminal widget gets a config at `.storyboard/terminals/{hash}.json`
 * that agents read on startup to understand their canvas context.
 *
 * Files are keyed by a stable hash (same as tmuxName) so renames don't break them.
 * The canvasId/widgetId are stored inside the JSON payload.
 *
 * Connected widgets are stored as IDs only — full widget data is resolved
 * from the materialized canvas state at read time to stay fresh.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, symlinkSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { findByWorktree } from '../worktree/serverRegistry.js'
import { detectWorktreeName } from '../worktree/port.js'
import { readCurrentViewport } from './selectedWidgets.js'

const TERMINALS_DIR = '.storyboard/terminals'

let rootDir = process.cwd()

/** Initialize with the project root directory */
export function initTerminalConfig(root) {
  rootDir = root
  const dir = join(rootDir, TERMINALS_DIR)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

/** Read storyboard.config.json for devDomain */
function readDevDomain() {
  try {
    const raw = readFileSync(join(rootDir, 'storyboard.config.json'), 'utf8')
    return JSON.parse(raw).devDomain || 'storyboard'
  } catch { return 'storyboard' }
}

/** Detect worktree name */
function getWorktreeName() {
  try {
    // Check if we're in a worktrees/ directory
    const cwd = rootDir
    const match = cwd.match(/worktrees\/([^/]+)/)
    return match ? match[1] : 'main'
  } catch { return 'main' }
}

/** Generate a stable filename from branch + canvasId + widgetId */
function configKey(branch, canvasId, widgetId) {
  const input = `${branch}::${canvasId}::${widgetId}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/** Get the config file path */
function configPath(branch, canvasId, widgetId) {
  return join(rootDir, TERMINALS_DIR, `${configKey(branch, canvasId, widgetId)}.json`)
}

/** Atomic write — write to temp then rename */
function atomicWrite(filePath, data) {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, filePath)
}

/**
 * Pre-reserve terminal identity at widget creation time.
 * Called from POST /widget when a terminal/agent widget is added to the canvas,
 * BEFORE the widget renders or the WebSocket connects.
 *
 * Writes a minimal config file at `.storyboard/terminals/{widgetId}.json` so
 * agents (especially hot-pool sessions) can find their identity immediately.
 * The `reserved` flag marks this as a pre-reserve — writeTerminalConfig() will
 * later overwrite it with the full config.
 */
export function preReserveTerminalIdentity({ widgetId, preDisplayName, canvasId, branch, serverUrl }) {
  const dir = join(rootDir, TERMINALS_DIR)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const fp = join(dir, `${widgetId}.json`)
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
    agentStatus: null,
    viewport: readCurrentViewport(rootDir) || null,
    updatedAt: new Date().toISOString(),
  }
  atomicWrite(fp, data)
}

/**
 * Write or update a terminal config file.
 * Called when a terminal widget is created or reconnected.
 */
export function writeTerminalConfig({ branch, canvasId, widgetId, canvasFile = null, serverUrl = null, tmuxName = null, widgetProps = null, displayName = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  const dir = dirname(fp)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  let existing = {}
  try {
    existing = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* new file */ }

  const worktree = getWorktreeName()
  const devDomain = readDevDomain()

  // Resolve server URL: use passed value, or query server registry, or default
  if (!serverUrl) {
    try {
      const name = detectWorktreeName()
      const servers = findByWorktree(name)
      if (servers.length > 0) serverUrl = `http://localhost:${servers[0].port}`
    } catch { /* empty */ }
  }
  if (!serverUrl) serverUrl = 'http://localhost:1234'

  const config = {
    ...existing,
    widgetId,
    displayName: displayName || existing.displayName || widgetProps?.prettyName || existing.widgetProps?.prettyName || null,
    canvasId,
    canvasFile: canvasFile || existing.canvasFile || null,
    branch,
    worktree,
    devDomain,
    serverUrl,
    workingDirectory: rootDir,
    deleted: false,
    widgetProps: widgetProps || existing.widgetProps || null,
    connectedWidgets: existing.connectedWidgets || [],
    agentStatus: existing.agentStatus || null,
    viewport: readCurrentViewport(rootDir) || existing.viewport || null,
    updatedAt: new Date().toISOString(),
  }

  atomicWrite(fp, config)

  // Create a widgetId-named symlink so agents can find their config directly
  const hashName = `${configKey(branch, canvasId, widgetId)}.json`
  const symPath = join(dir, `${widgetId}.json`)
  try {
    if (existsSync(symPath)) unlinkSync(symPath)
    symlinkSync(hashName, symPath)
  } catch { /* symlink creation is best-effort */ }

  // Create a tmuxName-named symlink so agents can resolve identity via tmux session name
  // (tmux session name is always available and never goes stale)
  if (tmuxName) {
    const tmuxSymPath = join(dir, `${tmuxName}.json`)
    try {
      if (existsSync(tmuxSymPath)) unlinkSync(tmuxSymPath)
      symlinkSync(hashName, tmuxSymPath)
    } catch { /* best-effort */ }
  }

  return config
}

/**
 * Update connected widgets for a terminal.
 * Called when connectors are added/removed.
 * Stores full widget objects (id, type, props, position) so agents
 * can read context directly without additional API calls.
 */
export function updateTerminalConnections({ branch, canvasId, widgetId, connectedWidgets, widgetProps = null, messaging = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  let config = {}
  try {
    config = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* file may not exist yet */ }

  if (widgetProps) {
    config.widgetProps = widgetProps
    // Promote displayName from prettyName
    if (widgetProps.prettyName) config.displayName = widgetProps.prettyName
  }
  config.connectedWidgets = connectedWidgets || []
  config.messaging = messaging || null
  config.viewport = readCurrentViewport(rootDir) || config.viewport || null
  config.updatedAt = new Date().toISOString()

  atomicWrite(fp, config)
  return config
}

/**
 * Mark a terminal config as deleted (tombstone).
 * Called when a terminal widget is deleted.
 */
export function markTerminalDeleted({ branch, canvasId, widgetId }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    const config = JSON.parse(readFileSync(fp, 'utf8'))
    config.deleted = true
    config.updatedAt = new Date().toISOString()
    atomicWrite(fp, config)
  } catch { /* file may not exist */ }
}

/**
 * Unmark a terminal config as deleted (undo).
 * Called when a deleted terminal widget is restored.
 */
export function unmarkTerminalDeleted({ branch, canvasId, widgetId }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    const config = JSON.parse(readFileSync(fp, 'utf8'))
    config.deleted = false
    config.updatedAt = new Date().toISOString()
    atomicWrite(fp, config)
  } catch { /* file may not exist */ }
}

/**
 * Read a terminal config. Connected widgets are already inline —
 * no additional resolution needed.
 */
export function readTerminalConfig({ branch, canvasId, widgetId }) {
  const fp = configPath(branch, canvasId, widgetId)
  try {
    return JSON.parse(readFileSync(fp, 'utf8'))
  } catch {
    return null
  }
}

/**
 * Update agent status in the terminal config.
 * Called by the signal endpoint.
 */
export function updateAgentStatus({ branch, canvasId, widgetId, status, message = null, data = null }) {
  const fp = configPath(branch, canvasId, widgetId)
  let config = {}
  try {
    config = JSON.parse(readFileSync(fp, 'utf8'))
  } catch { /* may not exist */ }

  config.agentStatus = {
    status,
    message,
    data,
    updatedAt: new Date().toISOString(),
  }
  config.updatedAt = new Date().toISOString()

  atomicWrite(fp, config)
  return config
}

/**
 * Read a terminal config by widget ID (searches by symlink).
 * @param {string} widgetId
 * @returns {Object|null}
 */
export function readTerminalConfigById(widgetId) {
  const dir = join(rootDir, TERMINALS_DIR)
  const symPath = join(dir, `${widgetId}.json`)
  try {
    return JSON.parse(readFileSync(symPath, 'utf8'))
  } catch {
    return null
  }
}

/**
 * Append a pending message to a terminal's config.
 * Messages are delivered when the agent starts or reconnects.
 * @param {string} widgetId
 * @param {{ from: string|null, fromName: string, message: string, createdAt: string }} msg
 */
export function updatePendingMessages(widgetId, msg) {
  const config = readTerminalConfigById(widgetId)
  if (!config) return

  if (!Array.isArray(config.pendingMessages)) config.pendingMessages = []
  config.pendingMessages.push(msg)
  config.updatedAt = new Date().toISOString()

  // Write back using the config's known path
  const fp = configPath(config.branch || 'unknown', config.canvasId || 'unknown', widgetId)
  atomicWrite(fp, config)
}

/**
 * Atomically read and clear pending messages from a terminal config.
 * Returns the messages array (empty if none). Safe to call from any process.
 * @param {string} widgetId
 * @returns {Array<{ from: string|null, fromName: string, message: string, createdAt: string }>}
 */
export function takePendingMessages(widgetId) {
  const config = readTerminalConfigById(widgetId)
  if (!config?.pendingMessages?.length) return []

  const messages = config.pendingMessages
  config.pendingMessages = []
  config.updatedAt = new Date().toISOString()

  // Write back via hash path (not symlink) to preserve symlink integrity
  const fp = configPath(config.branch || 'unknown', config.canvasId || 'unknown', widgetId)
  atomicWrite(fp, config)
  return messages
}

/**
 * Save the latest output from an agent for peers to read.
 * @param {string} widgetId
 * @param {{ content: string, summary: string, updatedAt: string }} output
 */
export function updateLatestOutput(widgetId, output) {
  const config = readTerminalConfigById(widgetId)
  if (!config) return

  config.latestOutput = output
  config.updatedAt = new Date().toISOString()

  const fp = configPath(config.branch || 'unknown', config.canvasId || 'unknown', widgetId)
  atomicWrite(fp, config)
}
