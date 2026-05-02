/**
 * Terminal Session Registry — persistent tracker for TMUX sessions.
 *
 * Stores session metadata in `.storyboard/terminal-sessions.json` (gitignored).
 * In-memory Map is the source of truth; JSON file is durability only.
 *
 * Each session entry:
 *   { tmuxName, name, branch, canvasId, widgetId, createdAt, lastConnectedAt,
 *     status, expiresAt, generation }
 *
 * `name` is a human-friendly identifier like "red-robin" or "blue-falcon",
 * unique across all sessions. Internal systems use tmuxName/widgetId.
 *
 * Status values:
 *   "live"       — actively connected to a widget WebSocket
 *   "background" — disconnected but tmux session alive
 *   "archived"   — widget deleted, session preserved with grace timer
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const REGISTRY_DIR = '.storyboard'
const REGISTRY_FILE = 'terminal-sessions.json'
const TMUX_PREFIX = 'sb-'

/** In-memory session store */
const sessions = new Map()

let registryPath = null
let orphanTimers = new Map()
let defaultGracePeriod = 5 * 60 * 1000 // 5 minutes

// ── Friendly name generation ──

const COLORS = [
  'red', 'blue', 'green', 'gold', 'violet', 'coral', 'cyan', 'amber',
  'rose', 'teal', 'plum', 'sage', 'rust', 'jade', 'peach', 'slate',
  'ivory', 'onyx', 'opal', 'ruby', 'moss', 'dusk', 'dawn', 'iron',
  'silver', 'bronze', 'copper', 'cobalt', 'crimson', 'indigo', 'scarlet',
  'pearl', 'ash', 'storm', 'sand', 'honey', 'maple', 'frost', 'ember', 'azure',
]

const BIRDS = [
  'robin', 'falcon', 'wren', 'hawk', 'sparrow', 'crane', 'finch', 'heron',
  'swift', 'lark', 'dove', 'raven', 'osprey', 'thrush', 'egret', 'magpie',
  'condor', 'owl', 'tern', 'kite', 'merlin', 'oriole', 'ibis', 'jay',
  'pipit', 'shrike', 'tanager', 'vireo', 'grouse', 'plover', 'avocet',
  'bunting', 'dipper', 'gannet', 'harrier', 'martin', 'petrel', 'puffin',
  'starling', 'warbler',
]

export function generateFriendlyName() {
  const usedNames = new Set()
  for (const entry of sessions.values()) {
    if (entry.name) usedNames.add(entry.name)
  }

  // Try random combinations first
  for (let i = 0; i < 100; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const bird = BIRDS[Math.floor(Math.random() * BIRDS.length)]
    const name = `${color}-${bird}`
    if (!usedNames.has(name)) return name
  }

  // Exhaustive fallback
  for (const color of COLORS) {
    for (const bird of BIRDS) {
      const name = `${color}-${bird}`
      if (!usedNames.has(name)) return name
    }
  }

  // Shouldn't happen (1600 combinations), but just in case
  return `session-${Date.now()}`
}

/**
 * Find a session by its friendly name.
 */
export function findByName(name) {
  for (const entry of sessions.values()) {
    if (entry.name === name) return entry
  }
  return null
}

/**
 * Generate a stable, opaque tmux session name from metadata.
 * Uses a short hash so names are safe for tmux and shell commands.
 */
export function generateTmuxName(branch, canvasId, widgetId) {
  const input = `${branch}::${canvasId}::${widgetId}`
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 12)
  return `${TMUX_PREFIX}${hash}`
}

/**
 * Initialize the registry. Call once at server startup.
 * @param {string} root — project root directory
 * @param {object} options — { gracePeriod?: number }
 */
export function initRegistry(root, options = {}) {
  if (options.gracePeriod != null) {
    defaultGracePeriod = options.gracePeriod * 1000
  }

  const dir = join(root, REGISTRY_DIR)
  registryPath = join(dir, REGISTRY_FILE)

  // Ensure .storyboard/ exists
  try { mkdirSync(dir, { recursive: true }) } catch { /* empty */ }

  // Load persisted state
  try {
    const raw = readFileSync(registryPath, 'utf8')
    const entries = JSON.parse(raw)
    for (const entry of entries) {
      sessions.set(entry.tmuxName, entry)
    }
  } catch {
    // No file or corrupt — start fresh
  }

  // Reconcile against live tmux sessions
  reconcile()
}

/**
 * Reconcile registry against actual tmux sessions.
 * - Registry entry with no tmux session → remove
 * - Persisted "live" after restart → downgrade to "background"
 * - Archived + expired → kill tmux and remove
 * - Tmux sessions not in registry with sb- prefix → import as unknown
 */
function reconcile() {
  const liveTmux = listTmuxSessions()
  const now = Date.now()

  // Check registry entries against live tmux
  for (const [name, entry] of sessions) {
    if (!liveTmux.has(name)) {
      // Tmux session gone — remove from registry
      sessions.delete(name)
      continue
    }

    // Downgrade any "live" to "background" (server restarted, all WS connections dead)
    if (entry.status === 'live') {
      entry.status = 'background'
      entry.generation = (entry.generation || 0) + 1
    }

    // Kill expired archived sessions
    if (entry.status === 'archived' && entry.expiresAt && now >= entry.expiresAt) {
      killTmuxSession(name)
      sessions.delete(name)
      continue
    }

    // Re-arm future expirations for non-expired archived sessions
    if (entry.status === 'archived' && entry.expiresAt && now < entry.expiresAt) {
      armOrphanTimer(name, entry.expiresAt - now)
    }

    liveTmux.delete(name)
  }

  // Import unknown sb- sessions (tmux exists but not in registry)
  for (const name of liveTmux) {
    if (name.startsWith(TMUX_PREFIX)) {
      sessions.set(name, {
        tmuxName: name,
        name: generateFriendlyName(),
        branch: 'unknown',
        canvasId: 'unknown',
        widgetId: 'unknown',
        createdAt: new Date().toISOString(),
        lastConnectedAt: null,
        status: 'background',
        expiresAt: null,
        generation: 0,
      })
    }
  }

  persist()
}

/**
 * Register a new session or update an existing one on connect.
 * Returns { entry, conflict } where conflict is set if the session
 * was live on a different branch.
 */
export function registerSession({ branch, canvasId, widgetId, prettyName }) {
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)
  const existing = sessions.get(tmuxName)
  let conflict = null

  if (existing) {
    // Conflict: session is live on a different branch
    if (existing.status === 'live' && existing.branch !== branch) {
      conflict = {
        currentBranch: existing.branch,
        currentCanvas: existing.canvasId,
        currentWidget: existing.widgetId,
      }
    }

    // Cancel any orphan timer
    cancelOrphanTimer(tmuxName)

    existing.branch = branch
    existing.canvasId = canvasId
    existing.widgetId = widgetId
    if (prettyName) existing.name = prettyName
    existing.lastConnectedAt = new Date().toISOString()
    existing.status = 'live'
    existing.expiresAt = null
    existing.generation = (existing.generation || 0) + 1

    persist()
    return { entry: existing, conflict }
  }

  const entry = {
    tmuxName,
    name: prettyName || generateFriendlyName(),
    branch,
    canvasId,
    widgetId,
    createdAt: new Date().toISOString(),
    lastConnectedAt: new Date().toISOString(),
    status: 'live',
    expiresAt: null,
    generation: 1,
  }

  sessions.set(tmuxName, entry)
  persist()
  return { entry, conflict }
}

/**
 * Mark a session as "background" on WebSocket disconnect.
 * Only applies if the given generation matches (prevents stale disconnects).
 */
export function disconnectSession(tmuxName, generation) {
  const entry = sessions.get(tmuxName)
  if (!entry) return
  if (entry.generation !== generation) return // stale disconnect
  if (entry.status !== 'live') return

  entry.status = 'background'
  persist()
}

/**
 * Orphan a session (widget deleted). Starts grace timer.
 * Session is NOT killed immediately.
 */
export function orphanSession(tmuxName, gracePeriod = defaultGracePeriod) {
  const entry = sessions.get(tmuxName)
  if (!entry) return

  entry.status = 'archived'
  entry.expiresAt = Date.now() + gracePeriod
  entry.generation = (entry.generation || 0) + 1
  persist()

  armOrphanTimer(tmuxName, gracePeriod)
}

/**
 * Orphan a session by widget ID (convenience for canvas server).
 */
export function orphanSessionByWidget(branch, canvasId, widgetId, gracePeriod) {
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)
  orphanSession(tmuxName, gracePeriod)
}

/**
 * Detach a session from its current widget (for reassignment).
 */
export function detachSession(tmuxName) {
  const entry = sessions.get(tmuxName)
  if (!entry) return null
  entry.status = 'background'
  entry.expiresAt = null
  cancelOrphanTimer(tmuxName)
  persist()
  return entry
}

/**
 * Immediately kill a session (tmux + registry).
 */
export function killSession(tmuxName) {
  cancelOrphanTimer(tmuxName)
  killTmuxSession(tmuxName)
  sessions.delete(tmuxName)
  persist()
}

/**
 * Bulk cleanup — kill all sessions matching the given statuses.
 * Returns { removed, remaining: { live, background, archived, total } }.
 */
export function bulkCleanup({ statuses }) {
  const statusSet = new Set(statuses)
  const toKill = []

  for (const [name, entry] of sessions) {
    if (statusSet.has(entry.status)) {
      toKill.push(name)
    }
  }

  for (const name of toKill) {
    cancelOrphanTimer(name)
    killTmuxSession(name)
    sessions.delete(name)
  }

  if (toKill.length > 0) persist()

  return { removed: toKill.length, remaining: getSessionStats() }
}

/**
 * Get session counts by status.
 */
export function getSessionStats() {
  let live = 0, background = 0, archived = 0
  for (const entry of sessions.values()) {
    if (entry.status === 'live') live++
    else if (entry.status === 'background') background++
    else if (entry.status === 'archived') archived++
  }
  return { live, background, archived, total: live + background + archived }
}

/**
 * Get a session entry by tmux name.
 */
export function getSession(tmuxName) {
  return sessions.get(tmuxName) || null
}

/**
 * Get a session by widget identity.
 */
export function getSessionByWidget(branch, canvasId, widgetId) {
  const tmuxName = generateTmuxName(branch, canvasId, widgetId)
  return sessions.get(tmuxName) || null
}

/**
 * List all sessions, optionally filtered by branch.
 */
export function listSessions(filterBranch = null) {
  const result = []
  for (const entry of sessions.values()) {
    if (filterBranch && entry.branch !== filterBranch) continue
    result.push({ ...entry })
  }
  // Sort: live first, then background, then archived
  const statusOrder = { live: 0, background: 1, archived: 2 }
  result.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))
  return result
}

/**
 * Find tmux name for a widget (used when the canvas server needs to
 * orphan a session on widget delete without knowing the full tmux name).
 */
export function findTmuxNameForWidget(widgetId) {
  for (const [name, entry] of sessions) {
    if (entry.widgetId === widgetId) return name
  }
  return null
}

// ── Internal helpers ──

function persist() {
  if (!registryPath) return
  try {
    const entries = Array.from(sessions.values())
    writeFileSync(registryPath, JSON.stringify(entries, null, 2))
  } catch { /* empty */ }
}

function listTmuxSessions() {
  const names = new Set()
  try {
    const output = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    for (const line of output.trim().split('\n')) {
      if (line) names.add(line)
    }
  } catch {
    // tmux not running or no sessions
  }
  return names
}

function killTmuxSession(name) {
  try {
    execSync(`tmux kill-session -t "${name}" 2>/dev/null`, { stdio: 'ignore' })
  } catch { /* empty */ }
}

function armOrphanTimer(tmuxName, delayMs) {
  cancelOrphanTimer(tmuxName)
  const timer = setTimeout(() => {
    const entry = sessions.get(tmuxName)
    if (!entry || entry.status !== 'archived') return

    // Check if processes are running inside
    if (hasRunningProcesses(tmuxName)) {
      // Keep alive but extend expiry
      entry.expiresAt = Date.now() + defaultGracePeriod
      armOrphanTimer(tmuxName, defaultGracePeriod)
      persist()
      return
    }

    killTmuxSession(tmuxName)
    sessions.delete(tmuxName)
    orphanTimers.delete(tmuxName)
    persist()
  }, delayMs)

  orphanTimers.set(tmuxName, timer)
}

function cancelOrphanTimer(tmuxName) {
  const timer = orphanTimers.get(tmuxName)
  if (timer) {
    clearTimeout(timer)
    orphanTimers.delete(tmuxName)
  }
}

function hasRunningProcesses(tmuxName) {
  try {
    // Check if there are child processes beyond the shell itself
    const output = execSync(
      `tmux list-panes -t "${tmuxName}" -F "#{pane_current_command}" 2>/dev/null`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const commands = output.trim().split('\n').filter(Boolean)
    // If only a shell is running (zsh, bash, fish), no meaningful processes
    const shells = new Set(['zsh', 'bash', 'fish', 'sh', 'dash'])
    return commands.some(cmd => !shells.has(cmd))
  } catch {
    return false
  }
}
