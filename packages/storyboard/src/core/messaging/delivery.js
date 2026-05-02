/**
 * Delivery Bridge — server-side subscriber that delivers bus messages to tmux.
 *
 * Subscribes in-process to terminal inbox channels and injects messages
 * via tmux send-keys. Maintains durable cursors (lastDeliveredEventId)
 * so messages survive server restarts with at-least-once delivery.
 *
 * Hot-pool aware: rebinds when widget identity changes (not just on start/stop).
 *
 * Channel naming: `terminal:{branch}:{canvasId}:{widgetId}`
 */

import fs from 'node:fs'
import path from 'node:path'
import { subscribe, read, publish, registerEventNamespace } from './bus.js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURSORS_DIR = '.storyboard/messages/cursors'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Binding
 * @property {string} widgetId
 * @property {string} tmuxName - tmux session:window.pane target
 * @property {string} channel - The inbox channel for this widget
 * @property {string} branch
 * @property {string} canvasId
 * @property {() => void} unsub - Unsubscribe from the bus channel
 * @property {string|null} cursor - Last delivered event ID
 */

/** @type {Map<string, Binding>} widgetId → Binding */
const bindings = new Map()

/** @type {string} Project root directory */
let rootDir = ''

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the delivery bridge. Call once after initBus().
 * @param {{ root: string }} opts
 */
export function initDeliveryBridge({ root }) {
  rootDir = root
  registerEventNamespace('message', {
    events: ['message:request', 'message:delivered', 'message:failed'],
  })

  // Ensure cursors directory exists
  const cursorsDir = path.join(root, CURSORS_DIR)
  fs.mkdirSync(cursorsDir, { recursive: true })
}

// ---------------------------------------------------------------------------
// Widget binding
// ---------------------------------------------------------------------------

/**
 * Bind a widget to the delivery bridge. Subscribes to the widget's inbox
 * channel and delivers messages via tmux.
 *
 * On bind:
 * 1. Reads the durable cursor (lastDeliveredEventId)
 * 2. Backfills any missed messages from the bus log
 * 3. Subscribes for live messages going forward
 *
 * @param {Object} opts
 * @param {string} opts.widgetId
 * @param {string} opts.tmuxName
 * @param {string} opts.branch
 * @param {string} opts.canvasId
 * @param {string} [opts.displayName]
 */
export async function bindWidget({ widgetId, tmuxName, branch, canvasId, displayName }) {
  // Unbind previous binding if hot-pool reassigned
  if (bindings.has(widgetId)) {
    unbindWidget(widgetId)
  }

  const channel = terminalChannel(branch, canvasId, widgetId)
  const cursor = readCursor(widgetId)

  // Backfill missed messages since last cursor
  try {
    const opts = cursor ? { since: cursor } : {}
    const missed = await read(channel, opts)
    for (const event of missed) {
      if (shouldDeliver(event, widgetId)) {
        const ok = await deliverToTmux(tmuxName, event)
        if (ok) {
          saveCursor(widgetId, event.id)
        } else {
          break // Stop backfill on first failure — retry on next bind
        }
      }
    }
  } catch {
    // Channel may not exist yet — no backfill needed
  }

  // Subscribe for live messages
  const unsub = subscribe(channel, async (event) => {
    if (!shouldDeliver(event, widgetId)) return
    const binding = bindings.get(widgetId)
    if (!binding) return

    const success = await deliverToTmux(binding.tmuxName, event)
    if (success) {
      saveCursor(widgetId, event.id)
      // Publish delivery acknowledgement
      try {
        await publish(channel, {
          type: 'message:delivered',
          senderId: widgetId,
          senderName: displayName || widgetId,
          correlationId: event.id,
          status: 'resolved',
          body: `Delivered to ${widgetId}`,
        })
      } catch {
        // Non-critical — ack is best-effort
      }
    } else {
      // Publish failure notice (don't advance cursor — retry on next bind)
      try {
        await publish(channel, {
          type: 'message:failed',
          senderId: widgetId,
          senderName: displayName || widgetId,
          correlationId: event.id,
          status: 'failed',
          body: `tmux delivery failed for ${widgetId}`,
        })
      } catch {
        // Non-critical
      }
    }
  })

  bindings.set(widgetId, {
    widgetId,
    tmuxName,
    channel,
    branch,
    canvasId,
    unsub,
    cursor: readCursor(widgetId),
  })

  return { channel }
}

/**
 * Unbind a widget from the delivery bridge.
 * @param {string} widgetId
 */
export function unbindWidget(widgetId) {
  const binding = bindings.get(widgetId)
  if (binding) {
    binding.unsub()
    bindings.delete(widgetId)
  }
}

/**
 * Rebind a widget to a new tmux session (hot-pool reassignment).
 * Preserves the cursor — only updates the tmux target.
 *
 * @param {string} widgetId
 * @param {string} newTmuxName
 */
export function rebindWidget(widgetId, newTmuxName) {
  const binding = bindings.get(widgetId)
  if (binding) {
    binding.tmuxName = newTmuxName
  }
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/**
 * Check if an event should be delivered to a widget.
 * Only deliver incoming message:request events from other senders.
 */
function shouldDeliver(event, widgetId) {
  return (
    event.type === 'message:request' &&
    event.senderId !== widgetId
  )
}

/**
 * Deliver a message to a tmux session via send-keys.
 * @param {string} tmuxName
 * @param {object} event
 * @returns {Promise<boolean>} true if delivered successfully
 */
async function deliverToTmux(tmuxName, event) {
  try {
    const { execSync } = await import('node:child_process')
    const senderName = event.senderName || event.senderId || 'unknown'
    const body = event.body || ''
    const excerpt = body.length > 200 ? body.slice(0, 200) + '…' : body
    const formatted = `📩 ${senderName}: ${excerpt}`

    execSync(`tmux send-keys -t ${JSON.stringify(tmuxName)} -l ${JSON.stringify(formatted)}`, { stdio: 'ignore', timeout: 5000 })
    execSync(`tmux send-keys -t ${JSON.stringify(tmuxName)} Enter`, { stdio: 'ignore', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Durable cursors
// ---------------------------------------------------------------------------

/**
 * Read the last delivered event ID for a widget.
 * @param {string} widgetId
 * @returns {string|null}
 */
function readCursor(widgetId) {
  try {
    const fp = cursorPath(widgetId)
    if (!fs.existsSync(fp)) return null
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
    return data.lastDeliveredEventId || null
  } catch {
    return null
  }
}

/**
 * Save the last delivered event ID for a widget.
 * @param {string} widgetId
 * @param {string} eventId
 */
function saveCursor(widgetId, eventId) {
  try {
    const fp = cursorPath(widgetId)
    fs.mkdirSync(path.dirname(fp), { recursive: true })
    fs.writeFileSync(fp, JSON.stringify({ lastDeliveredEventId: eventId, updatedAt: new Date().toISOString() }))
  } catch {
    // Non-critical — worst case we redeliver on restart
  }
}

function cursorPath(widgetId) {
  return path.join(rootDir, CURSORS_DIR, `${widgetId}.json`)
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/**
 * Get the inbox channel name for a widget.
 * @param {string} branch
 * @param {string} canvasId
 * @param {string} widgetId
 * @returns {string}
 */
export function terminalChannel(branch, canvasId, widgetId) {
  return `terminal:${branch}:${canvasId}:${widgetId}`
}

/**
 * Check if a widget is bound to the delivery bridge.
 * @param {string} widgetId
 * @returns {boolean}
 */
export function isBound(widgetId) {
  return bindings.has(widgetId)
}

/**
 * Get all current bindings (for debugging/status).
 * @returns {Array<{ widgetId: string, tmuxName: string, channel: string }>}
 */
export function getBindings() {
  return [...bindings.values()].map(b => ({
    widgetId: b.widgetId,
    tmuxName: b.tmuxName,
    channel: b.channel,
  }))
}

// ---------------------------------------------------------------------------
// Shutdown / Reset
// ---------------------------------------------------------------------------

/**
 * Unbind all widgets and reset state.
 */
export function resetDeliveryBridge() {
  for (const binding of bindings.values()) {
    binding.unsub()
  }
  bindings.clear()
  rootDir = ''
}
