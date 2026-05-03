/**
 * Hub Manager
 *
 * Manages hub lifecycle for multi-agent hubs on a canvas.
 * A hub is a connected component of widgets linked by connectors.
 *
 * Responsibilities:
 *   - Materialize hub state from canvas widgets + connectors
 *   - Track hub membership, roles, and conversations
 *   - Provide hub state queries for routes and terminal config
 *
 * Hubs are computed on-demand from canvas data (connectors define topology).
 * State is ephemeral — rebuilt whenever connectors change.
 */

import { createHash } from 'node:crypto'
import { publish, registerEventNamespace } from './bus.js'

// Register hub event namespace
registerEventNamespace('hub', {
  events: [
    'hub:created',
    'hub:dissolved',
    'hub:member:joined',
    'hub:member:left',
    'hub:role:changed',
    'hub:goal:set',
  ],
})

registerEventNamespace('conversation', {
  events: [
    'conversation:start',
    'conversation:finality',
    'conversation:reopen',
  ],
})

// ---------------------------------------------------------------------------
// In-memory hub state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} HubMember
 * @property {string} widgetId
 * @property {string} displayName
 * @property {string} type - 'agent' | 'terminal' | 'prompt' | 'passive'
 * @property {string} role - role id from .agents/roles
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} status - 'active' | 'finalized' | 'reopened'
 * @property {string|null} summary
 * @property {string} startedAt
 * @property {string|null} finalizedAt
 */

/**
 * @typedef {Object} HubState
 * @property {string} hubId
 * @property {string} canvasId
 * @property {Map<string, HubMember>} members - widgetId → member
 * @property {string|null} tokenHolder - widgetId that holds the hub token
 * @property {string|null} goal
 * @property {Conversation|null} activeConversation
 * @property {string} channel - bus channel for hub events
 * @property {string} createdAt
 */

/** @type {Map<string, HubState>} hubId → state */
const hubs = new Map()

/** @type {Map<string, Set<string>>} canvasId → set of hubIds */
const canvasHubs = new Map()

// ---------------------------------------------------------------------------
// Stable hub ID
// ---------------------------------------------------------------------------

export function stableHubId(canvasId, widgetIds) {
  const sorted = [...widgetIds].sort()
  const hash = createHash('sha1').update(`${canvasId}::${sorted.join(',')}`).digest('hex').slice(0, 10)
  return `hub_${hash}`
}

// ---------------------------------------------------------------------------
// Connected component computation
// ---------------------------------------------------------------------------

/**
 * Compute connected components from widgets and connectors.
 * Returns array of Sets, each containing widget IDs in a component.
 */
export function computeComponents(widgets, connectors) {
  const ids = new Set(widgets.map((w) => w.id))
  const adj = new Map()
  for (const id of ids) adj.set(id, new Set())

  for (const conn of connectors) {
    const a = conn.start?.widgetId
    const b = conn.end?.widgetId
    if (!a || !b || !ids.has(a) || !ids.has(b) || a === b) continue
    adj.get(a).add(b)
    adj.get(b).add(a)
  }

  const seen = new Set()
  const components = []
  for (const id of ids) {
    if (seen.has(id)) continue
    const queue = [id]
    const comp = new Set()
    seen.add(id)
    while (queue.length > 0) {
      const cur = queue.shift()
      comp.add(cur)
      for (const next of adj.get(cur) || []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    components.push(comp)
  }
  return components
}

// ---------------------------------------------------------------------------
// Hub materialization
// ---------------------------------------------------------------------------

/**
 * Materialize hub state from canvas data.
 * Called whenever connectors change on a canvas.
 *
 * @param {string} canvasId
 * @param {object[]} widgets - all widgets on the canvas
 * @param {object[]} connectors - all connectors on the canvas
 * @param {{ roleByWidget?: Map<string,string>, defaultRole?: string }} roleInfo
 * @returns {{ created: string[], dissolved: string[], updated: string[] }}
 */
export function materializeHubs(canvasId, widgets, connectors, roleInfo = {}) {
  const widgetMap = new Map(widgets.map((w) => [w.id, w]))
  const agentTypes = new Set(['agent', 'terminal', 'prompt'])
  const components = computeComponents(widgets, connectors)

  const prevHubIds = canvasHubs.get(canvasId) || new Set()
  const nextHubIds = new Set()
  const created = []
  const dissolved = []
  const updated = []

  for (const comp of components) {
    const compWidgets = [...comp].map((id) => widgetMap.get(id)).filter(Boolean)
    const hasAgents = compWidgets.some((w) => agentTypes.has(w.type))
    if (!hasAgents || comp.size < 2) continue

    const hubId = stableHubId(canvasId, comp)
    nextHubIds.add(hubId)

    const members = new Map()
    for (const w of compWidgets) {
      const isAgent = agentTypes.has(w.type)
      members.set(w.id, {
        widgetId: w.id,
        displayName: w.props?.prettyName || w.id,
        type: isAgent ? w.type : 'passive',
        role: isAgent
          ? (roleInfo.roleByWidget?.get(w.id) || roleInfo.defaultRole || 'member')
          : 'passive',
      })
    }

    const channel = `hub:${canvasId.replace(/\//g, '--')}:${hubId}`
    const existing = hubs.get(hubId)

    if (existing) {
      // Update membership
      existing.members = members
      updated.push(hubId)
    } else {
      // Determine initial token holder (leader or first agent)
      let tokenHolder = null
      for (const [id, member] of members) {
        if (member.role === 'leader') { tokenHolder = id; break }
      }
      if (!tokenHolder) {
        // First agent widget connected by connector start
        const firstConn = connectors.find((c) => comp.has(c.start?.widgetId) && comp.has(c.end?.widgetId))
        if (firstConn) {
          const startW = widgetMap.get(firstConn.start.widgetId)
          if (startW && agentTypes.has(startW.type)) tokenHolder = startW.id
        }
      }
      if (!tokenHolder) {
        // Fallback: first agent in the component
        for (const [id, member] of members) {
          if (agentTypes.has(member.type)) { tokenHolder = id; break }
        }
      }

      hubs.set(hubId, {
        hubId,
        canvasId,
        members,
        tokenHolder,
        goal: null,
        activeConversation: null,
        channel,
        createdAt: new Date().toISOString(),
      })
      created.push(hubId)
    }
  }

  // Dissolve hubs that no longer exist
  for (const prevId of prevHubIds) {
    if (!nextHubIds.has(prevId)) {
      hubs.delete(prevId)
      dissolved.push(prevId)
    }
  }

  canvasHubs.set(canvasId, nextHubIds)
  return { created, dissolved, updated }
}

// ---------------------------------------------------------------------------
// Hub queries
// ---------------------------------------------------------------------------

/**
 * Get hub state by ID.
 * @param {string} hubId
 * @returns {HubState|null}
 */
export function getHub(hubId) {
  return hubs.get(hubId) || null
}

/**
 * Get all hubs for a canvas.
 * @param {string} canvasId
 * @returns {HubState[]}
 */
export function getHubsForCanvas(canvasId) {
  const ids = canvasHubs.get(canvasId)
  if (!ids) return []
  return [...ids].map((id) => hubs.get(id)).filter(Boolean)
}

/**
 * Get all hubs a widget belongs to.
 * @param {string} widgetId
 * @returns {HubState[]}
 */
export function getHubsForWidget(widgetId) {
  const result = []
  for (const hub of hubs.values()) {
    if (hub.members.has(widgetId)) result.push(hub)
  }
  return result
}

/**
 * Serialize a hub to a plain JSON-friendly object (for terminal config / API).
 * @param {HubState} hub
 * @param {string} [perspectiveWidgetId] - if set, omit this widget from peers
 * @returns {object}
 */
export function serializeHub(hub, perspectiveWidgetId) {
  const peers = []
  for (const [id, member] of hub.members) {
    if (id === perspectiveWidgetId) continue
    peers.push({ ...member })
  }
  const selfRole = perspectiveWidgetId
    ? (hub.members.get(perspectiveWidgetId)?.role || 'passive')
    : null

  return {
    hubId: hub.hubId,
    canvasId: hub.canvasId,
    role: selfRole,
    goal: hub.goal,
    peers,
    channel: hub.channel,
    activeConversationId: hub.activeConversation?.id || null,
    hasHubToken: hub.tokenHolder === perspectiveWidgetId,
    tokenHolder: hub.tokenHolder,
  }
}

// ---------------------------------------------------------------------------
// Hub token management
// ---------------------------------------------------------------------------

/**
 * Transfer the hub token to another widget.
 * @param {string} hubId
 * @param {string} fromWidgetId
 * @param {string} toWidgetId
 * @returns {{ ok: boolean, error?: string }}
 */
export async function transferHubToken(hubId, fromWidgetId, toWidgetId) {
  const hub = hubs.get(hubId)
  if (!hub) return { ok: false, error: `Hub ${hubId} not found` }
  if (hub.tokenHolder !== fromWidgetId) {
    return { ok: false, error: `Widget ${fromWidgetId} does not hold the hub token` }
  }
  if (!hub.members.has(toWidgetId)) {
    return { ok: false, error: `Widget ${toWidgetId} is not a member of hub ${hubId}` }
  }

  hub.tokenHolder = toWidgetId

  await publish(hub.channel, {
    channel: hub.channel,
    type: 'hub:token:transferred',
    senderId: fromWidgetId,
    body: `Hub token transferred from ${fromWidgetId} to ${toWidgetId}`,
    payload: { fromWidgetId, toWidgetId, hubId },
  })

  return { ok: true }
}

/**
 * Set the hub goal.
 * @param {string} hubId
 * @param {string} senderId
 * @param {string} goal
 * @returns {{ ok: boolean, error?: string }}
 */
export async function setHubGoal(hubId, senderId, goal) {
  const hub = hubs.get(hubId)
  if (!hub) return { ok: false, error: `Hub ${hubId} not found` }

  // Goal-setting is a leadership responsibility, not a token privilege
  const senderMember = hub.members.get(senderId)
  if (!senderMember || senderMember.role !== 'leader') {
    return { ok: false, error: `Only the leader can set the hub goal` }
  }

  hub.goal = goal

  await publish(hub.channel, {
    channel: hub.channel,
    type: 'hub:goal:set',
    senderId,
    body: goal,
    payload: { hubId, goal },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Conversation lifecycle
// ---------------------------------------------------------------------------

/**
 * Start a new conversation in a hub.
 * @param {string} hubId
 * @param {string} senderId
 * @returns {{ ok: boolean, conversationId?: string, error?: string }}
 */
export async function startConversation(hubId, senderId) {
  const hub = hubs.get(hubId)
  if (!hub) return { ok: false, error: `Hub ${hubId} not found` }

  const { generateId } = await import('./schema.js')
  const conversationId = `conv_${generateId()}`

  hub.activeConversation = {
    id: conversationId,
    status: 'active',
    summary: null,
    startedAt: new Date().toISOString(),
    finalizedAt: null,
  }

  await publish(hub.channel, {
    channel: hub.channel,
    type: 'conversation:start',
    senderId,
    body: `Conversation ${conversationId} started`,
    payload: { hubId, conversationId },
  })

  return { ok: true, conversationId }
}

/**
 * Signal finality for the active conversation.
 * @param {string} hubId
 * @param {string} senderId
 * @param {string} summary
 * @param {string|null} successor - next token holder
 * @returns {{ ok: boolean, error?: string }}
 */
export async function signalFinality(hubId, senderId, summary, successor) {
  const hub = hubs.get(hubId)
  if (!hub) return { ok: false, error: `Hub ${hubId} not found` }

  // Finality is gated on the leader ROLE, not the hub token.
  // Any agent can hold the token (speaking rights), but only the leader
  // can declare the conversation complete.
  const senderMember = hub.members.get(senderId)
  if (!senderMember || senderMember.role !== 'leader') {
    return { ok: false, error: `Only the leader can signal finality` }
  }
  if (!hub.activeConversation || hub.activeConversation.status === 'finalized') {
    return { ok: false, error: `No active conversation to finalize` }
  }

  const conversationId = hub.activeConversation.id
  hub.activeConversation.status = 'finalized'
  hub.activeConversation.summary = summary
  hub.activeConversation.finalizedAt = new Date().toISOString()

  if (successor && hub.members.has(successor)) {
    hub.tokenHolder = successor
  }

  await publish(hub.channel, {
    channel: hub.channel,
    type: 'conversation:finality',
    senderId,
    body: summary,
    payload: { hubId, conversationId, summary, successor },
  })

  return { ok: true }
}

/**
 * Reopen a finalized conversation.
 * @param {string} hubId
 * @param {string} senderId
 * @param {string} conversationId
 * @param {string} body
 * @returns {{ ok: boolean, error?: string }}
 */
export async function reopenConversation(hubId, senderId, conversationId, body) {
  const hub = hubs.get(hubId)
  if (!hub) return { ok: false, error: `Hub ${hubId} not found` }

  if (!hub.activeConversation || hub.activeConversation.id !== conversationId) {
    return { ok: false, error: `Conversation ${conversationId} not found in hub` }
  }
  if (hub.activeConversation.status !== 'finalized') {
    return { ok: false, error: `Conversation is not finalized` }
  }

  hub.activeConversation.status = 'reopened'
  hub.activeConversation.finalizedAt = null

  await publish(hub.channel, {
    channel: hub.channel,
    type: 'conversation:reopen',
    senderId,
    body,
    payload: { hubId, conversationId },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetHubs() {
  hubs.clear()
  canvasHubs.clear()
}
