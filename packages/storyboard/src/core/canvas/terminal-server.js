/**
 * Terminal Server — WebSocket PTY backend for terminal canvas widgets.
 *
 * Uses tmux for session persistence across page refreshes. Each terminal
 * widget gets a tmux session with an opaque name (hash of branch + canvas +
 * widget). On disconnect the pty process is killed (detaching from tmux)
 * but the tmux session stays alive. On reconnect the existing tmux session
 * is reattached.
 *
 * Session lifecycle is managed by terminal-registry.js which persists
 * session metadata to `.storyboard/terminal-sessions.json`.
 *
 * Falls back to direct shell spawn when tmux is not available.
 *
 * Dev-only — this runs inside the Vite dev server, same trust model.
 *
 * Protocol:
 *   Client → Server:  text (stdin to PTY)
 *   Client → Server:  JSON { type: "resize", cols, rows }
 *   Server → Client:  text (stdout from PTY)
 *   Server → Client:  JSON { type: "conflict", ... }
 *   Server → Client:  JSON { type: "session-info", ... }
 */

import { execSync } from 'node:child_process'
import { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { devLog } from '../logger/devLogger.js'

let WebSocketServer
try {
  WebSocketServer = (await import('ws')).WebSocketServer
} catch {
  WebSocketServer = null
}
import {
  initRegistry,
  registerSession,
  disconnectSession,
  orphanSession,
  generateTmuxName,
  findTmuxNameForWidget,
  killSession,
  bulkCleanup,
  getSessionStats,
} from './terminal-registry.js'
import {
  writeTerminalConfig as writeTermConfig,
  initTerminalConfig,
  readTerminalConfigById,
} from './terminal-config.js'
import { findByWorktree } from '../worktree/serverRegistry.js'
import { detectWorktreeName } from '../worktree/port.js'

let pty
try {
  pty = await import('node-pty')
} catch {
  pty = null
}

/** Check if tmux is available on the system */
let hasTmux = false
try {
  execSync('which tmux', { stdio: 'ignore' })
  hasTmux = true
} catch {
  hasTmux = false
}

const TERMINAL_PATH_PREFIX = '/_storyboard/terminal/'

/**
 * Env var prefixes/names from external terminal emulators and shell configs
 * that must be stripped before spawning tmux or shell processes — they leak
 * custom theming, prompts, and shell integrations into the storyboard terminal.
 */
const SHELL_CONFIG_STRIP_RE = /^(ZDOTDIR|STARSHIP(_.*)?|GHOSTTY(_.*)?|POWERLEVEL.*|P9K_.*|P10K_.*|ZSH_THEME|BASH_ENV|ITERM(_.*)?|KITTY(_.*)?|ALACRITTY(_.*)?|WEZTERM(_.*)?|PROMPT_COMMAND|RPROMPT|RPS1)$/

function isShellConfigVar(key) {
  return SHELL_CONFIG_STRIP_RE.test(key) || key === 'ENV'
}

/**
 * Overrides injected into tmux global env to neutralize external shell themes.
 * Applied after the tmux server is guaranteed to exist.
 */
const TMUX_SHELL_OVERRIDES = {
  STARSHIP_CONFIG: '/dev/null',
  POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
  ZSH_THEME: '',
  TERM_PROGRAM: 'storyboard',
}

/** Apply shell-config overrides to the tmux server's global environment */
function applyTmuxShellOverrides() {
  for (const [key, val] of Object.entries(TMUX_SHELL_OVERRIDES)) {
    try { execSync(`tmux set-environment -g ${key} "${val}" 2>/dev/null`, { stdio: 'ignore' }) } catch { /* empty */ }
  }
  // Unset vars that should not exist at all inside storyboard terminals
  for (const key of Object.keys(process.env)) {
    if (isShellConfigVar(key) && !(key in TMUX_SHELL_OVERRIDES)) {
      try { execSync(`tmux set-environment -g -u ${key} 2>/dev/null`, { stdio: 'ignore' }) } catch { /* empty */ }
    }
  }
}

/** Filter process.env, removing shell-config vars that would leak into PTY */
function cleanEnv() {
  const filtered = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (!isShellConfigVar(k)) filtered[k] = v
  }
  return filtered
}

/** Read terminal config from storyboard.config.json */
function readTerminalConfig() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    return config?.canvas?.terminal ?? {}
  } catch {
    return {}
  }
}

/** Active PTY processes keyed by tmuxName (not tmux sessions — those persist independently) */
const ptyProcesses = new Map()

/** WebSocket connections keyed by tmuxName, for conflict notification */
const wsConnections = new Map()

/** Branch name for this worktree, set during setup */
let currentBranch = 'unknown'

/** Actual server port, resolved from httpServer at setup time */
let actualServerPort = null

/** Hot pool manager reference (set by setupTerminalServer) */
let hotPoolRef = null

// ── PTY exhaustion detection & recovery ──

const PTY_ERROR_PATTERNS = [
  /ENXIO/, /posix_openpt/, /Device not configured/,
  /no available pty/i, /too many pty/i, /out of pty/i,
]

function isPtyExhausted(err) {
  const msg = err?.message || ''
  return PTY_ERROR_PATTERNS.some(p => p.test(msg))
}

/**
 * Spawn a PTY process with automatic cleanup on PTY exhaustion.
 * On failure: kills archived sessions → retries → kills background → retries → throws.
 * If all cleanup attempts fail, throws an error with `err.resourceLimited = true`
 * and `err.stats` containing session counts.
 */
function spawnWithCleanup(command, args, opts) {
  try {
    return pty.spawn(command, args, opts)
  } catch (err) {
    if (!isPtyExhausted(err)) throw err

    devLog().logEvent('warn', 'PTY exhaustion detected, attempting cleanup', { error: err.message })

    // Wave 1: clean archived sessions
    const wave1 = bulkCleanup({ statuses: ['archived'] })
    if (wave1.removed > 0) {
      devLog().logEvent('info', `Cleaned ${wave1.removed} archived sessions, retrying spawn`)
      try { return pty.spawn(command, args, opts) } catch (e) {
        if (!isPtyExhausted(e)) throw e
      }
    }

    // Wave 2: clean background sessions
    const wave2 = bulkCleanup({ statuses: ['background'] })
    if (wave2.removed > 0) {
      devLog().logEvent('info', `Cleaned ${wave2.removed} background sessions, retrying spawn`)
      try { return pty.spawn(command, args, opts) } catch (e) {
        if (!isPtyExhausted(e)) throw e
      }
    }

    // All cleanup exhausted — throw with resource-limited metadata
    const resourceErr = new Error('No PTY devices available — all cleanup attempts exhausted')
    resourceErr.resourceLimited = true
    resourceErr.stats = getSessionStats()
    throw resourceErr
  }
}

/** Active snapshot intervals keyed by tmuxName */
const snapshotIntervals = new Map()

/**
 * Time-windowed rolling buffer — accumulates raw PTY output with timestamps
 * so we can trim by age (5 min for private buffer, 1 min for public snapshot).
 * Each entry is { ts: number, data: string }.
 */
const rollingBuffers = new Map()

/** Max buffer age in ms (5 minutes for private buffer) */
const BUFFER_MAX_AGE_MS = 5 * 60 * 1000

/** Max snapshot age in ms (1 minute for public snapshot) */
const SNAPSHOT_MAX_AGE_MS = 1 * 60 * 1000

/** Append PTY output to the rolling buffer for a session */
function appendToRollingBuffer(tmuxName, data) {
  let entries = rollingBuffers.get(tmuxName)
  if (!entries) {
    entries = []
    rollingBuffers.set(tmuxName, entries)
  }
  entries.push({ ts: Date.now(), data })
  // Eagerly trim entries older than the max (buffer cap = 5 min)
  const cutoff = Date.now() - BUFFER_MAX_AGE_MS
  while (entries.length > 0 && entries[0].ts < cutoff) {
    entries.shift()
  }
}

/** Get concatenated buffer content within a time window */
function getRollingBufferContent(tmuxName, maxAgeMs = BUFFER_MAX_AGE_MS) {
  const entries = rollingBuffers.get(tmuxName)
  if (!entries || entries.length === 0) return ''
  const cutoff = Date.now() - maxAgeMs
  return entries
    .filter((e) => e.ts >= cutoff)
    .map((e) => e.data)
    .join('')
}

/** Strip ANSI escape sequences from a string */
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(\x07|\x1b\\)|\x1b[()][0-9A-B]|\x1b[>=<]|\x1b\[[?]?[0-9;]*[hlsur]/g, '')
}

/**
 * Inject a [System] identity message into a running agent's stdin via tmux send-keys.
 * Called from BOTH hot and cold paths after the tmux session is bound and config is written.
 * Uses the same pattern as messaging (📩) and skill injection (📡).
 *
 * Only injected for agent/prompt widgets — bare terminals skip this to avoid
 * cluttering the shell with system messages a human would see.
 */
function injectIdentityMessage(tmuxName, { widgetId, displayName, canvasId, branch: _branch, serverUrl }) {
  void _branch
  if (!hasTmux) return
  const configFile = `.storyboard/terminals/${widgetId}.json`
  const msg = `[System] Your terminal identity has been set. widgetId=${widgetId} displayName=${displayName} canvasId=${canvasId} configFile=${configFile} serverUrl=${serverUrl} — this is a configuration step, no response needed.`
  try {
    execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
    execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
  } catch { /* best effort */ }
}

/** Safe directory name from canvasId (replace `/` with `--`) */
function safeCanvasDir(canvasId) {
  return canvasId.replace(/\//g, '--')
}

/** Snapshot directory for a canvas (legacy — kept for fallback reads) */
function legacySnapshotDir(canvasId) {
  return join(process.cwd(), '.storyboard', 'terminal-snapshots', safeCanvasDir(canvasId))
}

/** Private buffer directory — .storyboard/ (gitignored) */
function bufferDir() {
  return join(process.cwd(), '.storyboard', 'terminal-buffers')
}

/** Public snapshot directory — assets/.storyboard-public/terminal-snapshots/ (committed) */
function publicSnapshotDir() {
  return join(process.cwd(), 'assets', '.storyboard-public', 'terminal-snapshots')
}

/**
 * Read the `private` prop for a widget from the terminal config.
 * Returns true if the widget has props.private === true.
 */
function isWidgetPrivate(widgetId, _canvasId) {
  void _canvasId
  try {
    const config = readTerminalConfigById(widgetId)
    if (config?.widgetProps?.private) return true
  } catch { /* empty */ }
  return false
}

/**
 * Capture terminal content and write both buffer + snapshot files.
 *
 * Buffer (private):  .storyboard/terminal-buffers/<widgetId>.buffer.json  — 5-min scrollback, full metadata
 * Snapshot (public):  assets/.storyboard-public/terminal-snapshots/<widgetId>.snapshot.json  — 1-min scrollback, stripped ANSI
 *                     assets/.storyboard-public/terminal-snapshots/<widgetId>.snapshot.txt   — human-readable text
 *
 * When widget is private, the public snapshot is skipped and any existing
 * snapshot file is renamed to ~<filename> (tilde prefix = gitignored).
 */
function captureSnapshot({ tmuxName, widgetId, canvasId, prettyName, cols, rows, createdAt }) {
  let paneContent = ''
  try {
    paneContent = execSync(`tmux capture-pane -t "${tmuxName}" -p -e`, {
      encoding: 'utf8',
      timeout: 3000,
    })
  } catch {
    // tmux capture failed — rolling buffer is the only source
  }

  const now = new Date().toISOString()
  const rawTail = getRollingBufferContent(tmuxName, BUFFER_MAX_AGE_MS)

  // ── Private buffer (.storyboard/terminal-buffers/<widgetId>.buffer.json) ──
  const bDir = bufferDir()
  const bufferPath = join(bDir, `${widgetId}.buffer.json`)
  const bufferTmpPath = bufferPath + '.tmp'

  const bufferData = {
    widgetId,
    canvasId,
    tmuxName,
    prettyName: prettyName || null,
    createdAt: createdAt || now,
    timestamp: now,
    cols: cols || 80,
    rows: rows || 24,
    paneContent,
    scrollback: rawTail,
  }

  try {
    mkdirSync(bDir, { recursive: true })
    writeFileSync(bufferTmpPath, JSON.stringify(bufferData, null, 2), 'utf8')
    renameSync(bufferTmpPath, bufferPath)
  } catch (err) {
    devLog().logEvent('error', 'Failed to write private buffer', { widgetId, error: err.message, path: bufferPath })
    try { if (existsSync(bufferTmpPath)) unlinkSync(bufferTmpPath) } catch {} // eslint-disable-line no-empty
  }

  // ── Plain-text buffer (.storyboard/terminal-buffers/<widgetId>.buffer.txt) ──
  // Agent-readable raw text: screen first, then scrollback history.
  const txtPath = join(bDir, `${widgetId}.buffer.txt`)
  const txtTmpPath = txtPath + '.tmp'
  try {
    const screen = stripAnsi(paneContent).replace(/\r\n/g, '\n').replace(/\n+$/, '')
    const history = stripAnsi(rawTail).replace(/\r\n/g, '\n').replace(/\n+$/, '')

    let txt = `[${widgetId}${prettyName ? ' | ' + prettyName : ''} | ${now}]\n\n`
    txt += '--- screen ---\n'
    txt += (screen || '(empty)') + '\n'
    if (history) {
      txt += '\n--- scrollback ---\n'
      txt += history + '\n'
    }

    writeFileSync(txtTmpPath, txt, 'utf8')
    renameSync(txtTmpPath, txtPath)
  } catch (err) {
    devLog().logEvent('error', 'Failed to write private buffer txt', { widgetId, error: err.message })
    try { if (existsSync(txtTmpPath)) unlinkSync(txtTmpPath) } catch {} // eslint-disable-line no-empty
  }

  // ── Public snapshot (assets/.storyboard-public/terminal-snapshots/) ──
  const isPrivate = isWidgetPrivate(widgetId, canvasId)
  const sDir = publicSnapshotDir()
  const snapshotPath = join(sDir, `${widgetId}.snapshot.json`)
  const snapshotTxtPath = join(sDir, `${widgetId}.snapshot.txt`)
  const tildeSnapshotPath = join(sDir, `~${widgetId}.snapshot.json`)
  const tildeSnapshotTxtPath = join(sDir, `~${widgetId}.snapshot.txt`)

  if (isPrivate) {
    // Rename existing public snapshots to tilde-prefixed (gitignored) versions
    if (existsSync(snapshotPath)) {
      try { renameSync(snapshotPath, tildeSnapshotPath) } catch {} // eslint-disable-line no-empty
    }
    if (existsSync(snapshotTxtPath)) {
      try { renameSync(snapshotTxtPath, tildeSnapshotTxtPath) } catch {} // eslint-disable-line no-empty
    }
    return
  }

  // If un-privated, restore from tilde if the public files don't exist yet
  if (existsSync(tildeSnapshotPath) && !existsSync(snapshotPath)) {
    try { renameSync(tildeSnapshotPath, snapshotPath) } catch {} // eslint-disable-line no-empty
  }
  if (existsSync(tildeSnapshotTxtPath) && !existsSync(snapshotTxtPath)) {
    try { renameSync(tildeSnapshotTxtPath, snapshotTxtPath) } catch {} // eslint-disable-line no-empty
  }

  const snapshotScrollback = getRollingBufferContent(tmuxName, SNAPSHOT_MAX_AGE_MS)
  const strippedPane = stripAnsi(paneContent)
  const strippedScrollback = stripAnsi(snapshotScrollback)

  // ── JSON snapshot ──
  const snapshotData = {
    widgetId,
    canvasId,
    prettyName: prettyName || null,
    timestamp: now,
    cols: cols || 80,
    rows: rows || 24,
    paneContent: strippedPane,
    scrollback: strippedScrollback,
  }

  try {
    mkdirSync(sDir, { recursive: true })
  } catch (err) {
    devLog().logEvent('error', 'Failed to create public snapshot dir', { dir: sDir, error: err.message })
    return
  }

  const snapshotTmpPath = snapshotPath + '.tmp'
  try {
    writeFileSync(snapshotTmpPath, JSON.stringify(snapshotData, null, 2), 'utf8')
    renameSync(snapshotTmpPath, snapshotPath)
  } catch (err) {
    devLog().logEvent('error', 'Failed to write public snapshot JSON', { widgetId, error: err.message, path: snapshotPath })
    try { if (existsSync(snapshotTmpPath)) unlinkSync(snapshotTmpPath) } catch {} // eslint-disable-line no-empty
  }

  // ── Human-readable text snapshot ──
  const snapshotTxtTmpPath = snapshotTxtPath + '.tmp'
  try {
    const screenText = strippedPane.replace(/\r\n/g, '\n').replace(/\n+$/, '')
    const scrollText = strippedScrollback.replace(/\r\n/g, '\n').replace(/\n+$/, '')
    const sep = '='.repeat(80)

    let snpTxt = ''
    snpTxt += `SESSION: ${widgetId}${prettyName ? ' | ' + prettyName : ''}\n`
    snpTxt += `CANVAS:  ${canvasId}\n`
    snpTxt += `BRANCH:  ${currentBranch}\n`
    snpTxt += `TIME:    ${now}\n`
    snpTxt += '\n'
    snpTxt += sep + '\n'
    snpTxt += 'SCREEN\n'
    snpTxt += sep + '\n'
    snpTxt += '\n'
    snpTxt += (screenText || '(empty)') + '\n'

    if (scrollText) {
      snpTxt += '\n'
      snpTxt += sep + '\n'
      snpTxt += 'SCROLLBACK (last 60s)\n'
      snpTxt += sep + '\n'
      snpTxt += '\n'
      snpTxt += scrollText + '\n'
    }

    writeFileSync(snapshotTxtTmpPath, snpTxt, 'utf8')
    renameSync(snapshotTxtTmpPath, snapshotTxtPath)
  } catch (err) {
    devLog().logEvent('error', 'Failed to write public snapshot txt', { widgetId, error: err.message })
    try { if (existsSync(snapshotTxtTmpPath)) unlinkSync(snapshotTxtTmpPath) } catch {} // eslint-disable-line no-empty
  }
}

/** Start periodic snapshot capture for a session */
function startSnapshotCapture(opts) {
  const { tmuxName } = opts
  if (snapshotIntervals.has(tmuxName)) return

  const termCfg = readTerminalConfig()
  const interval = termCfg.snapshotInterval ?? 5000

  const id = setInterval(() => captureSnapshot(opts), interval)
  snapshotIntervals.set(tmuxName, id)
}

/** Stop periodic snapshot capture and do a final capture */
function stopSnapshotCapture(tmuxName, finalOpts) {
  const id = snapshotIntervals.get(tmuxName)
  if (id) {
    clearInterval(id)
    snapshotIntervals.delete(tmuxName)
  }
  if (finalOpts) {
    captureSnapshot(finalOpts)
  }
  rollingBuffers.delete(tmuxName)
}

/** Check if a tmux session with the given name exists */
function tmuxSessionExists(name) {
  try {
    execSync(`tmux has-session -t "${name}" 2>/dev/null`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Orphan a terminal session by widget ID. Called when a terminal widget is
 * deleted. The tmux session is preserved with a grace timer.
 */
export function orphanTerminalSession(widgetId) {
  const tmuxName = findTmuxNameForWidget(widgetId)
  if (!tmuxName) {
    devLog().logEvent('warn', 'orphanTerminalSession: no registry entry for widget', { widgetId })
    legacyKillSession(widgetId)
    return
  }

  console.log(`[storyboard] orphanTerminalSession: archiving ${tmuxName} (widget: ${widgetId})`)

  // Set archived status FIRST (bumps generation so WS onclose won't override)
  orphanSession(tmuxName)

  // Close the WS connection if any (notifies client)
  const ws = wsConnections.get(tmuxName)
  if (ws && ws.readyState <= 1) {
    try { ws.close() } catch { /* empty */ }
  }
  wsConnections.delete(tmuxName)

  // Kill the PTY process (detaches from tmux)
  const proc = ptyProcesses.get(tmuxName)
  if (proc) {
    try { proc.kill() } catch { /* empty */ }
    ptyProcesses.delete(tmuxName)
  }
}

/** Kill legacy sb-{widgetId} sessions for backwards compat */
function legacyKillSession(widgetId) {
  const legacyName = `sb-${widgetId}`
  try {
    execSync(`tmux kill-session -t "${legacyName}" 2>/dev/null`, { stdio: 'ignore' })
  } catch { /* empty */ }
}

/**
 * Attach the terminal WebSocket server to a Vite HTTP server.
 * @param {object} httpServer
 * @param {string} base — Vite base path
 * @param {string} branch — current git branch name
 */
export function setupTerminalServer(httpServer, base = '/', branch = 'unknown', hotPoolManager = null) {
  if (!pty || !WebSocketServer) {
    if (!pty) devLog().logEvent('warn', 'node-pty not available — terminal widgets disabled')
    if (!WebSocketServer) devLog().logEvent('warn', 'ws not available — terminal widgets disabled')
    return
  }

  currentBranch = branch
  hotPoolRef = hotPoolManager

  // Capture the actual port from the running HTTP server
  try {
    const addr = httpServer.address()
    if (addr && addr.port) actualServerPort = addr.port
  } catch { /* empty */ }

  // Ensure node-pty spawn-helper has execute permission (npm install can strip it)
  try {
    const nodePtyDir = resolve(process.cwd(), 'node_modules/node-pty/prebuilds')
    execSync(`chmod +x "${nodePtyDir}"/darwin-*/spawn-helper 2>/dev/null || true`, { stdio: 'ignore' })
  } catch { /* empty */ }

  // Initialize registry and terminal config
  const root = process.cwd()
  const termCfg = readTerminalConfig()
  initRegistry(root, { gracePeriod: termCfg.orphanGracePeriod })
  initTerminalConfig(root)

  // Best-effort: apply shell-config overrides if a tmux server already exists
  // from a previous dev server run. If no server exists, this fails silently —
  // overrides are applied again in createTerminal() after the first new-session.
  if (hasTmux) {
    applyTmuxShellOverrides()
  }

  const mode = hasTmux ? 'tmux (persistent sessions)' : 'node-pty (no persistence)'
  console.log(`[storyboard] terminal server ready (${mode}) [branch: ${branch}]`)

  const wss = new WebSocketServer({ noServer: true })
  const baseNoTrail = (base || '/').replace(/\/$/, '')

  httpServer.on('upgrade', (req, socket, head) => {
    let pathname = req.url || ''
    if (baseNoTrail && pathname.startsWith(baseNoTrail)) {
      pathname = pathname.slice(baseNoTrail.length) || '/'
    }

    if (!pathname.startsWith(TERMINAL_PATH_PREFIX)) return

    // Parse sessionId and query params
    const pathAndQuery = pathname.slice(TERMINAL_PATH_PREFIX.length)
    const [sessionId, queryStr] = pathAndQuery.split('?')
    if (!sessionId) {
      socket.destroy()
      return
    }

    const params = new URLSearchParams(queryStr || '')
    const canvasId = params.get('canvas') || 'unknown'
    const prettyName = params.get('name') || null
    const widgetStartupCommand = params.get('startupCommand') || null
    const readOnly = params.get('readOnly') === '1'

    wss.handleUpgrade(req, socket, head, (ws) => {
      if (readOnly) {
        handleReadOnlyConnection(ws, sessionId, canvasId)
      } else {
        handleConnection(ws, sessionId, canvasId, prettyName, widgetStartupCommand)
      }
    })
  })
}

/**
 * Read-only WebSocket connection — attaches to an existing tmux session
 * for output-only streaming. Does NOT close existing WS connections,
 * does NOT kill existing pty processes, does NOT register in the session registry.
 * Used by the PromptWidget's inline terminal viewer.
 */
function handleReadOnlyConnection(ws, widgetId, canvasId) {
  const branch = currentBranch
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)

  if (!hasTmux || !tmuxSessionExists(tmuxName)) {
    try {
      ws.send(JSON.stringify({ type: 'error', message: 'No active session to observe' }))
      ws.close()
    } catch { /* empty */ }
    return
  }

  // Track read-only connections separately so they don't interfere with the primary
  const roKey = `${tmuxName}:ro`
  const existingRo = wsConnections.get(roKey)
  if (existingRo && existingRo !== ws && existingRo.readyState <= 1) {
    try { existingRo.close() } catch { /* empty */ }
  }
  wsConnections.set(roKey, ws)

  let ptyProcess
  try {
    ptyProcess = pty.spawn('tmux', ['-f', '/dev/null', 'attach-session', '-t', tmuxName, '-r'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color' },
    })
  } catch (err) {
    try {
      ws.send(JSON.stringify({ type: 'error', message: `Failed to attach: ${err.message}` }))
      ws.close()
    } catch { /* empty */ }
    return
  }

  // Forward pty output to WS (one-way only)
  ptyProcess.onData((data) => {
    if (ws.readyState === 1) {
      try { ws.send(data) } catch { /* empty */ }
    }
  })

  ptyProcess.onExit(() => {
    wsConnections.delete(roKey)
    if (ws.readyState <= 1) {
      try { ws.close() } catch { /* empty */ }
    }
  })

  // Handle resize from client (needed for correct rendering)
  ws.on('message', (msg) => {
    try {
      const str = typeof msg === 'string' ? msg : msg.toString()
      if (!str.startsWith('{')) return // ignore non-JSON (input data)
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows)
      }
    } catch { /* empty */ }
    // All other input is silently dropped (read-only)
  })

  ws.on('close', () => {
    wsConnections.delete(roKey)
    try { ptyProcess.kill() } catch { /* empty */ }
  })

  ws.on('error', () => {
    wsConnections.delete(roKey)
    try { ptyProcess.kill() } catch { /* empty */ }
  })

  // Send session info
  try {
    ws.send(JSON.stringify({ type: 'session-info', tmuxName, readOnly: true }))
  } catch { /* empty */ }
}

function handleConnection(ws, widgetId, canvasId, prettyName, widgetStartupCommand = null) {
  const branch = currentBranch
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)

  // Register in registry, check for conflicts
  const { entry, conflict } = registerSession({ branch, canvasId, widgetId, prettyName })

  // Resolve server URL deterministically:
  // 1. Use the actual port from httpServer (set at setup time)
  // 2. Fall back to server registry (tracks running dev servers)
  // 3. Last resort: default port 1234
  let serverPort = actualServerPort
  if (!serverPort) {
    try {
      const name = detectWorktreeName()
      const servers = findByWorktree(name)
      if (servers.length > 0) serverPort = servers[0].port
    } catch { /* empty */ }
  }
  if (!serverPort) serverPort = 1234
  const serverUrl = `http://localhost:${serverPort}`

  // Write terminal config for agent context
  writeTermConfig({ branch, canvasId, widgetId, serverUrl, tmuxName, displayName: prettyName || null, widgetProps: prettyName ? { prettyName } : null })

  // Close any existing WS for this session (one viewer at a time)
  const existingWs = wsConnections.get(tmuxName)
  if (existingWs && existingWs !== ws && existingWs.readyState <= 1) {
    try { existingWs.close() } catch { /* empty */ }
  }
  wsConnections.set(tmuxName, ws)

  // Kill any existing pty process for this session (stale connection)
  const existing = ptyProcesses.get(tmuxName)
  if (existing) {
    try { existing.kill() } catch { /* empty */ }
    ptyProcesses.delete(tmuxName)
  }

  const cwd = process.cwd()
  const shell = process.env.SHELL || '/bin/zsh'
  const termCfg = readTerminalConfig()
  const prompt = termCfg.prompt || '$ '

  // Shared identity env vars for both tmux and direct paths
  const identityEnv = {
    STORYBOARD_WIDGET_ID: widgetId,
    STORYBOARD_CANVAS_ID: canvasId,
    STORYBOARD_BRANCH: branch,
    STORYBOARD_SERVER_URL: serverUrl,
  }

  // Env for the tmux path — cleaned of external shell config + neutralizing overrides.
  // These env vars are inherited by the shell spawned inside new-session (NOT by the
  // tmux server global env). Verified: tmux new-session passes the spawning process's
  // env to the session shell. This does NOT contaminate other tmux sessions.
  const zdotdir = join(tmpdir(), 'storyboard-terminal')
  try {
    mkdirSync(zdotdir, { recursive: true })
    writeFileSync(join(zdotdir, '.zshenv'), '')
    writeFileSync(join(zdotdir, '.zshrc'), `export PS1='${prompt.replace(/'/g, "'\\''")}'\nunset RPS1\n`)
  } catch { /* best effort */ }

  const tmuxEnv = {
    ...cleanEnv(),
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    ZDOTDIR: zdotdir,
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
    BASH_ENV: '',
    ENV: '',
    ...identityEnv,
  }

  // Full env for the direct-shell fallback (no tmux).
  const directEnv = {
    ...cleanEnv(),
    TERM: 'xterm-256color',
    TERM_PROGRAM: 'storyboard',
    ZDOTDIR: zdotdir,
    STARSHIP_CONFIG: '/dev/null',
    POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD: 'true',
    ZSH_THEME: '',
    BASH_ENV: '',
    ENV: '',
    PS1: prompt,
    ...identityEnv,
  }
  let ptyProcess
  let isNewSession = false
  let usedWarmAgent = false // true when session came from a pre-warmed agent pool

  try {
  if (hasTmux) {
    const reattach = tmuxSessionExists(tmuxName)

    // Also check for legacy sb-{widgetId} sessions and migrate
    const legacyName = `sb-${widgetId}`
    const hasLegacy = !reattach && tmuxSessionExists(legacyName)
    let actualName = hasLegacy ? legacyName : tmuxName

    // If no existing session, try to acquire from the hot pool
    let poolSession = null
    let poolId = null
    if (!reattach && !hasLegacy && hotPoolRef) {
      const startupCommand = widgetStartupCommand ?? readTerminalConfig().startupCommand ?? null

      // Resolve startup command to agent ID for pool lookup
      if (startupCommand && startupCommand !== 'shell') {
        try {
          const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
          const agentsConfig = JSON.parse(raw)?.canvas?.agents
          if (agentsConfig && typeof agentsConfig === 'object') {
            for (const [id, cfg] of Object.entries(agentsConfig)) {
              if (cfg.startupCommand && startupCommand.startsWith(cfg.startupCommand.split(' ')[0])) {
                poolId = id
                break
              }
            }
          }
        } catch { /* empty */ }
      }

      // Try agent pool first, then fall back to terminal pool for bare shells
      const targetPool = poolId || (startupCommand ? null : 'terminal')
      if (targetPool && hotPoolRef.has(targetPool)) {
        poolSession = hotPoolRef.acquire(targetPool)
      }

      // If we got a warm session, rename it to the canonical tmux name
      if (poolSession?.tmuxName) {
        try {
          try { execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' }) } catch { /* empty */ }
          execSync(`tmux rename-session -t "${poolSession.tmuxName}" "${tmuxName}"`, { stdio: 'ignore' })
          hotPoolRef.consume(targetPool, poolSession.id)
          usedWarmAgent = !!poolId // only true for agent pools, not terminal pools
        } catch {
          hotPoolRef.release(targetPool, poolSession.id)
          poolSession = null
        }
      }
    }

    // -f /dev/null skips user tmux.conf; 'set status off' hides the status bar
    const args = (reattach || hasLegacy || poolSession)
      ? ['-f', '/dev/null', 'attach-session', '-t', actualName]
      : ['-f', '/dev/null', 'new-session', '-s', tmuxName, '-c', cwd]

    // If migrating from legacy, rename the tmux session
    if (hasLegacy) {
      try {
        execSync(`tmux rename-session -t "${legacyName}" "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
      } catch { /* empty */ }
    }

    ptyProcess = spawnWithCleanup('tmux', args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: tmuxEnv,
    })

    // Hide status bar + apply shell-config overrides
    const targetName = (reattach || hasLegacy) ? actualName : tmuxName
    isNewSession = !(reattach || hasLegacy) || !!poolSession
    const hideStatus = () => {
      try {
        execSync(`tmux set-option -t "${targetName}" status off 2>/dev/null`, { stdio: 'ignore' })
        execSync(`tmux set-option -t "${targetName}" set-clipboard off 2>/dev/null`, { stdio: 'ignore' })
        // Only enable mouse for reattach sessions. For new sessions, mouse on
        // is deferred — tmux mouse events crash Clack prompts in the welcome script.
        if (!isNewSession) {
          execSync(`tmux set-option -t "${targetName}" mouse on 2>/dev/null`, { stdio: 'ignore' })
        }

        // Apply shell-config overrides to the tmux server's global env.
        // This is the reliable call — the tmux server is guaranteed to exist
        // after pty.spawn('tmux', ...) above.
        applyTmuxShellOverrides()

        // Update tmux session env vars so new shells (and agents reading $STORYBOARD_WIDGET_ID)
        // always reflect the current widget identity — even after reassignment.
        const tmuxEnvVars = {
          STORYBOARD_WIDGET_ID: widgetId,
          STORYBOARD_CANVAS_ID: canvasId,
          STORYBOARD_BRANCH: branch,
          STORYBOARD_SERVER_URL: serverUrl,
        }
        for (const [key, val] of Object.entries(tmuxEnvVars)) {
          execSync(`tmux set-environment -t "${targetName}" ${key} "${val}" 2>/dev/null`, { stdio: 'ignore' })
        }
        // Write a sourceable env file keyed by tmux session name.
        // Running shells can source this to get fresh identity without restarting.
        const envDir = join(cwd, '.storyboard', 'terminals')
        try {
          const envContent = Object.entries(tmuxEnvVars)
            .map(([k, v]) => `export ${k}="${v}"`)
            .join('\n') + '\n'
          writeFileSync(join(envDir, `${targetName}.env`), envContent)
        } catch { /* best effort */ }

        // Write shell aliases for `start` and agent shorthand commands.
        // Written on every connection (not just new sessions) so the file
        // is always available and up-to-date for manual sourcing.
        const canvasArg = canvasId !== 'unknown' ? canvasId : ''
        const nameArgVal = prettyName ? ` --name "${prettyName}"` : ''
        const welcomeBase = `storyboard terminal-welcome --branch "${branch}" --canvas "${canvasArg}"${nameArgVal}`

        // Write real executable scripts to .storyboard/terminals/bin/ and
        // prepend that dir to PATH via tmux set-environment. This makes
        // `start`, `copilot`, `claude`, `codex` available in ANY shell
        // inside the tmux session — even bare shells after a crash.
        const binDir = join(envDir, 'bin')
        try { mkdirSync(binDir, { recursive: true }) } catch { /* empty */ }

        // `start` — opens welcome screen (no args) or launches a command.
        // Uses `exec` to REPLACE the current shell, preventing nested
        // welcome→shell→welcome→shell stacking. The parent welcome (if any)
        // sees its child close and loops back to its menu.
        const startScript = [
          '#!/usr/bin/env sh',
          `if [ $# -eq 0 ]; then`,
          `  exec ${welcomeBase}`,
          `else`,
          `  exec ${welcomeBase} --startup "$*"`,
          `fi`,
        ].join('\n') + '\n'
        try {
          writeFileSync(join(binDir, 'start'), startScript, { mode: 0o755 })
        } catch { /* empty */ }

        // Agent shorthand scripts (copilot, claude, codex, etc.)
        try {
          const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
          const agentsConfig = JSON.parse(raw)?.canvas?.agents
          if (agentsConfig && typeof agentsConfig === 'object') {
            for (const [id, cfg] of Object.entries(agentsConfig)) {
              if (!cfg.startupCommand) continue
              const agentScript = [
                '#!/usr/bin/env sh',
                `exec start ${cfg.startupCommand} "$@"`,
              ].join('\n') + '\n'
              try {
                writeFileSync(join(binDir, id), agentScript, { mode: 0o755 })
              } catch { /* empty */ }
            }
          }
        } catch { /* empty */ }

        // Prepend bin dir to PATH in the tmux session environment.
        // Every new shell in this session will inherit the updated PATH.
        try {
          const currentPath = process.env.PATH || '/usr/bin:/bin'
          if (!currentPath.includes(binDir)) {
            execSync(`tmux set-environment -t "${targetName}" PATH "${binDir}:${currentPath}" 2>/dev/null`, { stdio: 'ignore' })
          }
        } catch { /* empty */ }

        // Also keep the sourceable aliases file for backwards compatibility
        const aliasLines = [
          '# Storyboard terminal aliases — auto-generated, do not edit',
          `start() { if [ $# -eq 0 ]; then ${welcomeBase}; else ${welcomeBase} --startup "$*"; fi; }`,
        ]
        try {
          const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
          const agentsConfig = JSON.parse(raw)?.canvas?.agents
          if (agentsConfig && typeof agentsConfig === 'object') {
            for (const [id, cfg] of Object.entries(agentsConfig)) {
              if (!cfg.startupCommand) continue
              aliasLines.push(`${id}() { start ${cfg.startupCommand} "$@"; }`)
            }
          }
        } catch { /* empty */ }
        const aliasFile = join(envDir, `${widgetId}.aliases.sh`)
        try { writeFileSync(aliasFile, aliasLines.join('\n') + '\n') } catch { /* empty */ }
      } catch { /* empty */ }
    }
    setTimeout(hideStatus, 200)

    // For new sessions, either run startupCommand (skip welcome) or show the welcome screen
    if (isNewSession) {
      const startupCommand = widgetStartupCommand ?? termCfg.startupCommand ?? null

      // Build the welcome command base — used by all paths below
      const canvasArg = canvasId !== 'unknown' ? canvasId : ''
      const nameArg = prettyName ? ` --name "${prettyName}"` : ''
      const welcomeBase = `storyboard terminal-welcome --branch "${branch}" --canvas "${canvasArg}"${nameArg}`

      if (usedWarmAgent) {
        // ── Hot pool path: agent is already running and ready ──
        // Skip agent launch, readiness polling, and postStartup (all done by pool).
        // Inject identity via [System] message so the agent knows who it is.
        setTimeout(() => {
          injectIdentityMessage(tmuxName, { widgetId, displayName: prettyName, canvasId, branch, serverUrl })
          setTimeout(() => deliverPendingMessages(tmuxName, widgetId), 1000)
        }, 500)
      } else {
        // ── Cold path: standard startup flow ──

        // Export identity env vars + shell-config overrides into the shell via send-keys.
        // pty.spawn sets env on the tmux client process, but the session's
        // shell doesn't inherit those — it starts from the tmux server env.
        // send-keys is the only reliable way to set vars in the running shell.
        // Shell-config overrides (STARSHIP_CONFIG, etc.) must also be sent here
        // because the shell's .zshrc has already run by the time tmux global env
        // overrides are applied.
        const envParts = [
          `export STORYBOARD_WIDGET_ID="${widgetId}"`,
          `export STORYBOARD_CANVAS_ID="${canvasId}"`,
          `export STORYBOARD_BRANCH="${branch}"`,
          `export STORYBOARD_SERVER_URL="${serverUrl}"`,
          ...Object.entries(TMUX_SHELL_OVERRIDES).map(([k, v]) => `export ${k}="${v}"`),
        ]

        // Prepend the bin dir to PATH for the initial shell (tmux set-environment
        // handles future shells, but the first shell is already running)
        const binDir = join(cwd, '.storyboard', 'terminals', 'bin')
        envParts.push(`export PATH="${binDir}:$PATH"`)

        // Chain clear into env exports so it runs synchronously after exports
        // complete, avoiding a timing race where clear leaks into the agent prompt
        if (startupCommand) envParts.push('clear')
        const envExports = envParts.join(' && ')

        setTimeout(() => {
          try {
            execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(envExports)}`, { stdio: 'ignore' })
            execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          } catch { /* empty */ }
        }, 300)

        if (startupCommand) {

          // Look up agent config for this startup command
          const agentCfg = (() => {
            try {
              const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
              const agentsConfig = JSON.parse(raw)?.canvas?.agents
              if (!agentsConfig || typeof agentsConfig !== 'object') return null
              for (const cfg of Object.values(agentsConfig)) {
                if (cfg.startupCommand && startupCommand.startsWith(cfg.startupCommand.split(' ')[0])) return cfg
              }
            } catch { /* empty */ }
            return null
          })()

          if (startupCommand === 'shell') {
            // Plain shell — route through welcome with --startup shell so it
            // returns to the welcome screen on exit
            setTimeout(() => {
              const cmd = `${welcomeBase} --startup shell`
              try {
                execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(cmd)}`, { stdio: 'ignore' })
                execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
              } catch { /* empty */ }
            }, 800)
          } else if (agentCfg || startupCommand !== 'shell') {
            // Agent or custom command — route through welcome with --startup
            // so the welcome screen appears when the agent exits
            const cmd = agentCfg?.startupCommand || startupCommand
            const postStartup = agentCfg?.postStartup || null
            const readinessSignal = agentCfg?.readinessSignal || null

            setTimeout(() => {
              const welcomeCmd = `${welcomeBase} --startup ${JSON.stringify(cmd)}`
              try {
                execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(welcomeCmd)}`, { stdio: 'ignore' })
                execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
              } catch { /* empty */ }

              if (readinessSignal) {
                // Poll for readiness, then send postStartup command and deliver messages
                let sent = false
                const pollInterval = setInterval(() => {
                  if (sent) { clearInterval(pollInterval); return }
                  try {
                    const paneContent = execSync(
                      `tmux capture-pane -t "${tmuxName}" -p`,
                      { encoding: 'utf8', timeout: 1000 }
                    )
                    if (paneContent.includes(readinessSignal)) {
                      sent = true
                      clearInterval(pollInterval)
                      setTimeout(() => {
                        if (postStartup) {
                          try {
                            execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(postStartup)}`, { stdio: 'ignore' })
                            execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                          } catch { /* empty */ }
                        }
                        // Inject identity, then deliver pending messages
                        injectIdentityMessage(tmuxName, { widgetId, displayName: prettyName, canvasId, branch, serverUrl })
                        setTimeout(() => deliverPendingMessages(tmuxName, widgetId), 2000)
                      }, 500)
                    }
                  } catch { /* empty */ }
                }, 2000)
                setTimeout(() => { if (!sent) { sent = true; clearInterval(pollInterval) } }, 30000)
              } else {
                // No readiness signal — inject identity and deliver messages after a delay
                setTimeout(() => {
                  injectIdentityMessage(tmuxName, { widgetId, displayName: prettyName, canvasId, branch, serverUrl })
                  setTimeout(() => deliverPendingMessages(tmuxName, widgetId), 2000)
                }, 5000)
              }
            }, 900)
          }
        } else {
          // No startupCommand — show the welcome screen as before.
          // Use tmux send-keys (not ptyProcess.write) so the command goes through
          // the same input path as the env exports, avoiding interleave races.
          // Prepend 'clear' so the exported env vars are cleared from the screen.
          setTimeout(() => {
            try {
              execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(`clear && ${welcomeBase}`)}`, { stdio: 'ignore' })
              execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
            } catch { /* empty */ }
          }, 800)
        }
      }

      // Execute startup sequence if configured (after welcome or startupCommand)
      const startupSeq = termCfg.defaultStartupSequence
      if (startupSeq?.steps?.length) {
        setTimeout(() => {
          executeStartupSequence(tmuxName, ws, startupSeq)
        }, startupCommand ? 1500 : 1500)
      }
    }

    // Write conflict warning if session was live elsewhere
    if (conflict) {
      setTimeout(() => {
        const warning = [
          '',
          `\x1b[33m⚠ Session conflict\x1b[0m`,
          `\x1b[2mThis session was\x1b[0m \x1b[34mLive\x1b[0m \x1b[2mon branch\x1b[0m \x1b[34m${conflict.currentBranch}\x1b[0m \x1b[2m(canvas: ${conflict.currentCanvas})\x1b[0m`,
          `\x1b[2mDetached from there and attached here.\x1b[0m`,
          '',
        ].join('\r\n')
        if (ws.readyState === ws.OPEN) {
          ws.send(warning)
        }
      }, 300)
    }
  } else {
    const noRcFlag = shell.endsWith('/zsh') ? '--no-rcs' : shell.endsWith('/bash') ? '--norc' : ''
    const shellArgs = noRcFlag ? [noRcFlag] : []
    ptyProcess = spawnWithCleanup(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: directEnv,
    })
  }
  } catch (spawnErr) {
    devLog().logEvent('error', 'Terminal spawn failed', { error: spawnErr.message })

    // Roll back registry — mark as background (not live) since spawn failed
    disconnectSession(tmuxName, entry.generation)

    if (ws.readyState === ws.OPEN) {
      if (spawnErr.resourceLimited) {
        // PTY exhaustion — send structured error so browser can show cleanup UI
        sendJson(ws, {
          type: 'resource-limited',
          message: 'No PTY devices available. Too many terminal sessions are open.',
          counts: spawnErr.stats || getSessionStats(),
        })
      } else {
        ws.send(`\r\n\x1b[31m✖ Terminal failed to start: ${spawnErr.message}\x1b[0m\r\n`)
        ws.send(`\x1b[2mTry: chmod +x node_modules/node-pty/prebuilds/darwin-*/spawn-helper\x1b[0m\r\n`)
      }
      ws.close()
    }
    return
  }

  const generation = entry.generation
  ptyProcesses.set(tmuxName, ptyProcess)

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data)
    }
    // Maintain time-windowed rolling buffer
    appendToRollingBuffer(tmuxName, data)
  })

  // Start periodic snapshot capture (works for both tmux and direct pty —
  // tmux capture-pane fails gracefully, rolling buffer provides content either way)
  const snapshotOpts = { tmuxName, widgetId, canvasId, prettyName, cols: 80, rows: 24, createdAt: new Date().toISOString() }
  startSnapshotCapture(snapshotOpts)

  ptyProcess.onExit(() => {
    ptyProcesses.delete(tmuxName)
    if (ws.readyState === ws.OPEN) {
      ws.close()
    }
  })

  ws.on('message', (msg) => {
    const str = typeof msg === 'string' ? msg : msg.toString('utf-8')
    try {
      const parsed = JSON.parse(str)
      if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows)
        // Update snapshot dimensions
        snapshotOpts.cols = parsed.cols
        snapshotOpts.rows = parsed.rows
        return
      }
    } catch {
      // Not JSON — raw stdin
    }

    ptyProcess.write(str)
  })

  // On disconnect: final snapshot, kill the pty (detaches from tmux) but leave the tmux session alive
  ws.on('close', () => {
    stopSnapshotCapture(tmuxName, snapshotOpts)
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    const proc = ptyProcesses.get(tmuxName)
    if (proc === ptyProcess) {
      try { ptyProcess.kill() } catch { /* empty */ }
      ptyProcesses.delete(tmuxName)
    }
    disconnectSession(tmuxName, generation)
  })

  ws.on('error', () => {
    stopSnapshotCapture(tmuxName, snapshotOpts)
    if (wsConnections.get(tmuxName) === ws) {
      wsConnections.delete(tmuxName)
    }
    try { ptyProcess.kill() } catch { /* empty */ }
    ptyProcesses.delete(tmuxName)
    disconnectSession(tmuxName, generation)
  })
}

/** Send a JSON message over WebSocket */
function sendJson(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

/**
 * Deliver any pending messages queued for this terminal.
 * Called after agent startup is complete.
 */
function deliverPendingMessages(tmuxName, widgetId) {
  if (!hasTmux) return
  try {
    const config = readTerminalConfigById(widgetId)
    if (!config?.pendingMessages?.length) return

    const messages = config.pendingMessages
    // Clear pending messages from config
    config.pendingMessages = []
    config.updatedAt = new Date().toISOString()

    // Write back via symlink path
    const symPath = join(process.cwd(), '.storyboard', 'terminals', `${widgetId}.json`)
    try { writeFileSync(symPath, JSON.stringify(config, null, 2)) } catch { /* empty */ }

    // Deliver each message with a small delay between them
    messages.forEach((msg, i) => {
      setTimeout(() => {
        try {
          const excerpt = msg.message.length > 200 ? msg.message.slice(0, 200) + '…' : msg.message
          const formatted = `📩 [${msg.fromName || msg.from || 'unknown'} → you]\n\`\`\`\n${excerpt}\n\`\`\`${msg.from ? `\nFull context: cat .storyboard/terminals/${msg.from}.json | jq '.latestOutput.content'` : ''}`
          execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(formatted)}`, { stdio: 'ignore' })
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
        } catch { /* empty */ }
      }, i * 1500)
    })
  } catch { /* empty */ }
}

/**
 * Execute a startup sequence for a new terminal session.
 * Runs server-side via tmux send-keys. Only called for new sessions.
 *
 * Step types:
 *   command   — send text + \n to the shell
 *   keystroke — send raw keys (e.g. {enter}, {tab})
 *   wait      — pause for ms or until output matches a pattern
 *   tmux      — run a tmux command against the session
 *   env       — set env var (must be before shell starts, so this is a pre-step)
 *
 * @param {string} tmuxName — tmux session name
 * @param {object} ws — WebSocket connection
 * @param {object} sequence — { steps: [], renderAfterStep?: number }
 */
async function executeStartupSequence(tmuxName, ws, sequence) {
  if (!sequence?.steps?.length) return
  if (!hasTmux) return

  const { steps, renderAfterStep } = sequence
  const shouldGateRender = typeof renderAfterStep === 'number' && renderAfterStep >= 0

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]

    try {
      switch (step.type) {
        case 'command':
          // Use -l for literal text to avoid shell interpretation issues
          execSync(
            `tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(step.value)}`,
            { stdio: 'ignore' }
          )
          execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          break

        case 'keystroke': {
          const keyMap = { '{enter}': 'Enter', '{tab}': 'Tab', '{escape}': 'Escape', '{space}': 'Space' }
          const key = keyMap[step.value] || step.value
          execSync(`tmux send-keys -t "${tmuxName}" ${key}`, { stdio: 'ignore' })
          break
        }

        case 'wait':
          if (step.until === 'ready' || step.until === 'output') {
            const timeout = step.timeout || 10000
            const start = Date.now()
            const match = step.match || null
            while (Date.now() - start < timeout) {
              await new Promise(r => setTimeout(r, 500))
              if (match) {
                try {
                  const capture = execSync(
                    `tmux capture-pane -t "${tmuxName}" -p`,
                    { encoding: 'utf8', timeout: 2000 }
                  )
                  if (capture.includes(match)) break
                } catch { /* continue waiting */ }
              }
            }
          } else {
            await new Promise(r => setTimeout(r, step.ms || 1000))
          }
          break

        case 'tmux':
          execSync(`tmux ${step.value}`, { stdio: 'ignore' })
          break

        default:
          devLog().logEvent('warn', `Unknown startup step type: ${step.type}`, { stepType: step.type })
      }
    } catch (err) {
      devLog().logEvent('warn', `Startup sequence step ${i} (${step.type}) failed`, { step: i, stepType: step.type, error: err.message })
      // Non-fatal — continue to next step
    }

    // Send render signal after the specified step
    if (shouldGateRender && i === renderAfterStep) {
      sendJson(ws, { type: 'render' })
    }
  }

  // If renderAfterStep was beyond all steps, send it now
  if (shouldGateRender && renderAfterStep >= steps.length) {
    sendJson(ws, { type: 'render' })
  }
}

// Re-export for backwards compat (canvas server uses this name)
export { killSession as killTerminalSession }

// Export for REST endpoint in canvas server
export { legacySnapshotDir as terminalSnapshotDir }

/**
 * Read a terminal buffer file by widget ID.
 * Returns the parsed JSON or null if not found.
 * Optionally truncates scrollback to `maxLength` chars.
 */
export function readTerminalBuffer(widgetId, { maxLength } = {}) {
  const filePath = join(bufferDir(), `${widgetId}.buffer.json`)
  try {
    if (!existsSync(filePath)) return null
    const data = JSON.parse(readFileSync(filePath, 'utf8'))
    if (maxLength && typeof maxLength === 'number') {
      if (data.scrollback && data.scrollback.length > maxLength) {
        data.scrollback = data.scrollback.slice(-maxLength)
      }
      if (data.paneContent && data.paneContent.length > maxLength) {
        data.paneContent = data.paneContent.slice(-maxLength)
      }
    }
    return data
  } catch {
    return null
  }
}

/**
 * Read a terminal public snapshot by widget ID.
 * Checks new path first, falls back to legacy path.
 */
export function readTerminalSnapshot(widgetId, canvasId) {
  // New path: assets/.storyboard-public/terminal-snapshots/<widgetId>.snapshot.json
  const newPath = join(publicSnapshotDir(), `${widgetId}.snapshot.json`)
  try {
    if (existsSync(newPath)) {
      return JSON.parse(readFileSync(newPath, 'utf8'))
    }
  } catch { /* empty */ }

  // Legacy fallback: .storyboard/terminal-snapshots/<canvasDir>/<widgetId>.json
  if (canvasId) {
    const legacyPath = join(legacySnapshotDir(canvasId), `${widgetId}.json`)
    try {
      if (existsSync(legacyPath)) {
        return JSON.parse(readFileSync(legacyPath, 'utf8'))
      }
    } catch { /* empty */ }
  }

  return null
}
