/**
 * Hub Maintenance
 *
 * Background interval tasks for hub health:
 *   - Conversation timeout: finalize idle conversations
 *   - Token timeout: already handled by token-manager's per-token timers
 *
 * Started once during server init, stopped on shutdown.
 */

import { publish } from './bus.js'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {NodeJS.Timeout|null} */
let maintenanceTimer = null

/** @type {{ conversationTimeoutMs: number, intervalMs: number }} */
let config = {
  conversationTimeoutMs: 30 * 60 * 1000, // 30 minutes
  intervalMs: 60 * 1000, // check every 60 seconds
}

// ---------------------------------------------------------------------------
// Conversation timeout
// ---------------------------------------------------------------------------

/**
 * Check all hubs for idle conversations and time them out.
 * An active conversation that hasn't received any activity since
 * `conversationTimeoutMs` is auto-finalized.
 *
 * @param {Map<string, import('./hub-manager.js').HubState>} hubs
 */
async function checkConversationTimeouts(hubs) {
  const now = Date.now()

  for (const hub of hubs.values()) {
    const conv = hub.activeConversation
    if (!conv || conv.status === 'finalized') continue

    const startedAt = new Date(conv.startedAt).getTime()
    const age = now - startedAt

    if (age > config.conversationTimeoutMs) {
      conv.status = 'finalized'
      conv.summary = 'Conversation timed out due to inactivity'
      conv.finalizedAt = new Date().toISOString()

      try {
        await publish(hub.channel, {
          channel: hub.channel,
          type: 'conversation:timeout',
          senderId: 'system',
          body: 'Conversation timed out due to inactivity',
          payload: {
            hubId: hub.hubId,
            conversationId: conv.id,
            timeoutMs: config.conversationTimeoutMs,
          },
        })
      } catch { /* best effort */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Maintenance loop
// ---------------------------------------------------------------------------

/**
 * Start the background maintenance loop.
 *
 * @param {Map<string, import('./hub-manager.js').HubState>} hubs - reference to hub state map
 * @param {{ conversationTimeoutMinutes?: number }} [opts]
 */
export function startMaintenance(hubs, opts = {}) {
  if (maintenanceTimer) return // already running

  if (opts.conversationTimeoutMinutes) {
    config.conversationTimeoutMs = opts.conversationTimeoutMinutes * 60 * 1000
  }

  maintenanceTimer = setInterval(async () => {
    try {
      await checkConversationTimeouts(hubs)
    } catch (err) {
      console.error('[hub-maintenance] Error during maintenance cycle:', err)
    }
  }, config.intervalMs)

  // Don't block process exit
  if (maintenanceTimer.unref) maintenanceTimer.unref()
}

/**
 * Stop the background maintenance loop.
 */
export function stopMaintenance() {
  if (maintenanceTimer) {
    clearInterval(maintenanceTimer)
    maintenanceTimer = null
  }
}
