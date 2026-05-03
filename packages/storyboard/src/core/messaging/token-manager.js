/**
 * Token Manager
 *
 * Message-level token assignment and resolution for ordered responses
 * within hub conversations.
 *
 * When the leader sends a request to the hub, message tokens are
 * created for each peer to respond in a specified order. Tokens track
 * response status and enforce timeouts.
 *
 * Token lifecycle:
 *   1. Leader publishes a message → tokens created for each peer
 *   2. Peer with order=0 gets notified first (token becomes "active")
 *   3. Peer responds → token status = resolved, next token activates
 *   4. All tokens resolved → round complete, leader gets aggregated result
 *   5. Tokens that exceed timeout → status = timed_out, skipped
 */

import { generateId } from './schema.js'

// ---------------------------------------------------------------------------
// In-memory token state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} MessageToken
 * @property {string} tokenId
 * @property {string} messageId - the originating message
 * @property {string} hubId
 * @property {string} widgetId - the peer that should respond
 * @property {number} order - response order (0-based)
 * @property {'pending'|'active'|'resolved'|'timed_out'|'skipped'|'delegating'} status
 * @property {string|null} responseId - ID of the response event
 * @property {string|null} parentMessageId - if this token is for a sub-request, the originating message
 * @property {string} createdAt
 * @property {string|null} resolvedAt
 */

/** @type {Map<string, MessageToken>} tokenId → token */
const tokens = new Map()

/** @type {Map<string, string[]>} messageId → ordered array of tokenIds */
const messageTokens = new Map()

/** @type {Map<string, Set<string>>} hubId → set of active messageIds */
const hubMessages = new Map()

/** @type {Map<string, NodeJS.Timeout>} tokenId → timeout handle */
const tokenTimers = new Map()

// Default timeout: 2 minutes
let defaultTimeoutMs = 120_000

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Set the default timeout for message tokens.
 * @param {number} ms
 */
export function setTokenTimeout(ms) {
  defaultTimeoutMs = ms
}

// ---------------------------------------------------------------------------
// Token creation
// ---------------------------------------------------------------------------

/**
 * Create message tokens for a hub request.
 *
 * @param {string} messageId - the originating message event ID
 * @param {string} hubId
 * @param {{ widgetId: string, order: number }[]} recipients - ordered list of peers
 * @param {{ timeoutMs?: number, onTimeout?: (token: MessageToken) => void, parentMessageId?: string }} opts
 * @returns {MessageToken[]} created tokens
 */
export function createMessageTokens(messageId, hubId, recipients, opts = {}) {
  const timeoutMs = opts.timeoutMs || defaultTimeoutMs
  const sorted = [...recipients].sort((a, b) => a.order - b.order)
  const tokenIds = []
  const created = []

  for (const { widgetId, order } of sorted) {
    const tokenId = `tok_${generateId()}`
    const token = {
      tokenId,
      messageId,
      hubId,
      widgetId,
      order,
      status: order === 0 ? 'active' : 'pending',
      responseId: null,
      parentMessageId: opts.parentMessageId || null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    }

    tokens.set(tokenId, token)
    tokenIds.push(tokenId)
    created.push(token)

    // Set timeout for active token
    if (token.status === 'active') {
      scheduleTimeout(tokenId, timeoutMs, opts.onTimeout)
    }
  }

  messageTokens.set(messageId, tokenIds)

  const msgs = hubMessages.get(hubId) || new Set()
  msgs.add(messageId)
  hubMessages.set(hubId, msgs)

  return created
}

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a message token (peer has responded).
 *
 * @param {string} tokenId
 * @param {string} responseId - ID of the response event
 * @returns {{ ok: boolean, error?: string, nextToken?: MessageToken, allResolved?: boolean }}
 */
export function resolveToken(tokenId, responseId) {
  const token = tokens.get(tokenId)
  if (!token) return { ok: false, error: `Token ${tokenId} not found` }
  if (token.status !== 'active' && token.status !== 'delegating') {
    return { ok: false, error: `Token ${tokenId} is ${token.status}, not active or delegating` }
  }

  token.status = 'resolved'
  token.responseId = responseId
  token.resolvedAt = new Date().toISOString()

  // Clear timeout
  clearTokenTimeout(tokenId)

  // Activate next pending token
  const tokenIds = messageTokens.get(token.messageId) || []
  const nextToken = activateNextPending(tokenIds)

  // Check if all tokens are resolved
  const allResolved = tokenIds.every((id) => {
    const t = tokens.get(id)
    return t && (t.status === 'resolved' || t.status === 'timed_out' || t.status === 'skipped')
  })

  return { ok: true, nextToken: nextToken || undefined, allResolved }
}

/**
 * Resolve a token by widgetId and messageId (convenience for agents).
 *
 * @param {string} messageId
 * @param {string} widgetId
 * @param {string} responseId
 * @returns {{ ok: boolean, error?: string, nextToken?: MessageToken, allResolved?: boolean }}
 */
export function resolveTokenByWidget(messageId, widgetId, responseId) {
  const tokenIds = messageTokens.get(messageId) || []
  for (const id of tokenIds) {
    const t = tokens.get(id)
    if (t && t.widgetId === widgetId && (t.status === 'active' || t.status === 'delegating')) {
      return resolveToken(id, responseId)
    }
  }
  return { ok: false, error: `No active token for widget ${widgetId} on message ${messageId}` }
}

// ---------------------------------------------------------------------------
// Token delegation
// ---------------------------------------------------------------------------

/**
 * Mark an active token as delegating — the holder is creating sub-requests
 * and will resolve this token after collecting sub-responses.
 *
 * @param {string} tokenId
 * @returns {{ ok: boolean, error?: string }}
 */
export function delegateToken(tokenId) {
  const token = tokens.get(tokenId)
  if (!token) return { ok: false, error: `Token ${tokenId} not found` }
  if (token.status !== 'active') {
    return { ok: false, error: `Token ${tokenId} is ${token.status}, not active` }
  }

  token.status = 'delegating'
  // Pause the timeout — delegation may take longer than standard response
  clearTokenTimeout(tokenId)
  return { ok: true }
}

/**
 * Mark a delegating token as active again (e.g., sub-request completed,
 * holder is ready to respond).
 *
 * @param {string} tokenId
 * @returns {{ ok: boolean, error?: string }}
 */
export function undelegateToken(tokenId) {
  const token = tokens.get(tokenId)
  if (!token) return { ok: false, error: `Token ${tokenId} not found` }
  if (token.status !== 'delegating') {
    return { ok: false, error: `Token ${tokenId} is ${token.status}, not delegating` }
  }

  token.status = 'active'
  scheduleTimeout(tokenId, defaultTimeoutMs)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Token queries
// ---------------------------------------------------------------------------

/**
 * Get a token by ID.
 * @param {string} tokenId
 * @returns {MessageToken|null}
 */
export function getToken(tokenId) {
  return tokens.get(tokenId) || null
}

/**
 * Get all tokens for a message.
 * @param {string} messageId
 * @returns {MessageToken[]}
 */
export function getTokensForMessage(messageId) {
  const ids = messageTokens.get(messageId) || []
  return ids.map((id) => tokens.get(id)).filter(Boolean)
}

/**
 * Get the pending token for a widget in a hub (if any).
 * @param {string} hubId
 * @param {string} widgetId
 * @returns {MessageToken|null}
 */
export function getPendingTokenForWidget(hubId, widgetId) {
  const msgs = hubMessages.get(hubId) || new Set()
  for (const msgId of msgs) {
    const tokenIds = messageTokens.get(msgId) || []
    for (const id of tokenIds) {
      const t = tokens.get(id)
      if (t && t.widgetId === widgetId && t.status === 'active') return t
    }
  }
  return null
}

/**
 * Get the current round status for a message.
 * @param {string} messageId
 * @returns {{ total: number, resolved: number, active: string|null, delegating: number, pending: number, allDone: boolean }}
 */
export function getRoundStatus(messageId) {
  const tokenIds = messageTokens.get(messageId) || []
  const all = tokenIds.map((id) => tokens.get(id)).filter(Boolean)
  const resolved = all.filter((t) => t.status === 'resolved' || t.status === 'timed_out' || t.status === 'skipped').length
  const activeToken = all.find((t) => t.status === 'active')
  const delegating = all.filter((t) => t.status === 'delegating').length
  const pending = all.filter((t) => t.status === 'pending').length

  return {
    total: all.length,
    resolved,
    active: activeToken?.widgetId || null,
    delegating,
    pending,
    allDone: resolved === all.length,
  }
}

// ---------------------------------------------------------------------------
// Token skip / cancel
// ---------------------------------------------------------------------------

/**
 * Skip a token (e.g., widget is no longer in the hub).
 * @param {string} tokenId
 * @returns {{ ok: boolean, nextToken?: MessageToken }}
 */
export function skipToken(tokenId) {
  const token = tokens.get(tokenId)
  if (!token) return { ok: false }

  token.status = 'skipped'
  token.resolvedAt = new Date().toISOString()
  clearTokenTimeout(tokenId)

  const tokenIds = messageTokens.get(token.messageId) || []
  const nextToken = activateNextPending(tokenIds)

  return { ok: true, nextToken: nextToken || undefined }
}

/**
 * Cancel all tokens for a message.
 * @param {string} messageId
 */
export function cancelMessageTokens(messageId) {
  const tokenIds = messageTokens.get(messageId) || []
  for (const id of tokenIds) {
    const t = tokens.get(id)
    if (t && (t.status === 'pending' || t.status === 'active')) {
      t.status = 'skipped'
      t.resolvedAt = new Date().toISOString()
      clearTokenTimeout(id)
    }
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Clean up all tokens for a hub (e.g., on dissolution).
 * @param {string} hubId
 */
export function cleanupHub(hubId) {
  const msgs = hubMessages.get(hubId) || new Set()
  for (const msgId of msgs) {
    const tokenIds = messageTokens.get(msgId) || []
    for (const id of tokenIds) {
      clearTokenTimeout(id)
      tokens.delete(id)
    }
    messageTokens.delete(msgId)
  }
  hubMessages.delete(hubId)
}

/**
 * Reset all token state (for tests).
 */
export function resetTokens() {
  for (const timer of tokenTimers.values()) clearTimeout(timer)
  tokens.clear()
  messageTokens.clear()
  hubMessages.clear()
  tokenTimers.clear()
  defaultTimeoutMs = 120_000
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function activateNextPending(tokenIds) {
  for (const id of tokenIds) {
    const t = tokens.get(id)
    if (t && t.status === 'pending') {
      t.status = 'active'
      scheduleTimeout(id, defaultTimeoutMs)
      return t
    }
  }
  return null
}

function scheduleTimeout(tokenId, ms, onTimeout) {
  clearTokenTimeout(tokenId)
  const timer = setTimeout(() => {
    const t = tokens.get(tokenId)
    if (t && t.status === 'active') {
      t.status = 'timed_out'
      t.resolvedAt = new Date().toISOString()
      tokenTimers.delete(tokenId)
      if (onTimeout) onTimeout(t)

      // Activate next pending
      const tokenIds = messageTokens.get(t.messageId) || []
      activateNextPending(tokenIds)
    }
  }, ms)
  tokenTimers.set(tokenId, timer)
}

function clearTokenTimeout(tokenId) {
  const timer = tokenTimers.get(tokenId)
  if (timer) {
    clearTimeout(timer)
    tokenTimers.delete(tokenId)
  }
}
