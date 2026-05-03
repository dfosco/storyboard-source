/**
 * Cluster Manager
 *
 * Manages cluster lifecycle for multi-agent hubs on a canvas.
 * A cluster is a connected component of widgets linked by connectors.
 *
 * Responsibilities:
 *   - Materialize cluster state from canvas widgets + connectors
 *   - Track cluster membership, roles, and conversations
 *   - Provide cluster state queries for routes and terminal config
 *
 * Clusters are computed on-demand from canvas data (connectors define topology).
 * State is ephemeral — rebuilt whenever connectors change.
 */

import { createHash } from 'node:crypto'
import { publish, registerEventNamespace } from './bus.js'

// Register cluster event namespace
registerEventNamespace('cluster', {
  events: [
    'cluster:created',
    'cluster:dissolved',
    'cluster:member:joined',
    'cluster:member:left',
    'cluster:role:changed',
    'cluster:goal:set',
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
// In-memory cluster state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ClusterMember
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
 * @typedef {Object} ClusterState
 * @property {string} clusterId
 * @property {string} canvasId
 * @property {Map<string, ClusterMember>} members - widgetId → member
 * @property {string|null} tokenHolder - widgetId that holds the cluster token
 * @property {string|null} goal
 * @property {Conversation|null} activeConversation
 * @property {string} channel - bus channel for cluster events
 * @property {string} createdAt
 */

/** @type {Map<string, ClusterState>} clusterId → state */
const clusters = new Map()

/** @type {Map<string, Set<string>>} canvasId → set of clusterIds */
const canvasClusters = new Map()

// ---------------------------------------------------------------------------
// Stable cluster ID
// ---------------------------------------------------------------------------

export function stableClusterId(canvasId, widgetIds) {
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
// Cluster materialization
// ---------------------------------------------------------------------------

/**
 * Materialize cluster state from canvas data.
 * Called whenever connectors change on a canvas.
 *
 * @param {string} canvasId
 * @param {object[]} widgets - all widgets on the canvas
 * @param {object[]} connectors - all connectors on the canvas
 * @param {{ roleByWidget?: Map<string,string>, defaultRole?: string }} roleInfo
 * @returns {{ created: string[], dissolved: string[], updated: string[] }}
 */
export function materializeClusters(canvasId, widgets, connectors, roleInfo = {}) {
  const widgetMap = new Map(widgets.map((w) => [w.id, w]))
  const agentTypes = new Set(['agent', 'terminal', 'prompt'])
  const components = computeComponents(widgets, connectors)

  const prevClusterIds = canvasClusters.get(canvasId) || new Set()
  const nextClusterIds = new Set()
  const created = []
  const dissolved = []
  const updated = []

  for (const comp of components) {
    const compWidgets = [...comp].map((id) => widgetMap.get(id)).filter(Boolean)
    const hasAgents = compWidgets.some((w) => agentTypes.has(w.type))
    if (!hasAgents || comp.size < 2) continue

    const clusterId = stableClusterId(canvasId, comp)
    nextClusterIds.add(clusterId)

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

    const channel = `cluster:${canvasId.replace(/\//g, '--')}:${clusterId}`
    const existing = clusters.get(clusterId)

    if (existing) {
      // Update membership
      existing.members = members
      updated.push(clusterId)
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

      clusters.set(clusterId, {
        clusterId,
        canvasId,
        members,
        tokenHolder,
        goal: null,
        activeConversation: null,
        channel,
        createdAt: new Date().toISOString(),
      })
      created.push(clusterId)
    }
  }

  // Dissolve clusters that no longer exist
  for (const prevId of prevClusterIds) {
    if (!nextClusterIds.has(prevId)) {
      clusters.delete(prevId)
      dissolved.push(prevId)
    }
  }

  canvasClusters.set(canvasId, nextClusterIds)
  return { created, dissolved, updated }
}

// ---------------------------------------------------------------------------
// Cluster queries
// ---------------------------------------------------------------------------

/**
 * Get cluster state by ID.
 * @param {string} clusterId
 * @returns {ClusterState|null}
 */
export function getCluster(clusterId) {
  return clusters.get(clusterId) || null
}

/**
 * Get all clusters for a canvas.
 * @param {string} canvasId
 * @returns {ClusterState[]}
 */
export function getClustersForCanvas(canvasId) {
  const ids = canvasClusters.get(canvasId)
  if (!ids) return []
  return [...ids].map((id) => clusters.get(id)).filter(Boolean)
}

/**
 * Get all clusters a widget belongs to.
 * @param {string} widgetId
 * @returns {ClusterState[]}
 */
export function getClustersForWidget(widgetId) {
  const result = []
  for (const cluster of clusters.values()) {
    if (cluster.members.has(widgetId)) result.push(cluster)
  }
  return result
}

/**
 * Serialize a cluster to a plain JSON-friendly object (for terminal config / API).
 * @param {ClusterState} cluster
 * @param {string} [perspectiveWidgetId] - if set, omit this widget from peers
 * @returns {object}
 */
export function serializeCluster(cluster, perspectiveWidgetId) {
  const peers = []
  for (const [id, member] of cluster.members) {
    if (id === perspectiveWidgetId) continue
    peers.push({ ...member })
  }
  const selfRole = perspectiveWidgetId
    ? (cluster.members.get(perspectiveWidgetId)?.role || 'passive')
    : null

  return {
    clusterId: cluster.clusterId,
    canvasId: cluster.canvasId,
    role: selfRole,
    goal: cluster.goal,
    peers,
    channel: cluster.channel,
    activeConversationId: cluster.activeConversation?.id || null,
    hasClusterToken: cluster.tokenHolder === perspectiveWidgetId,
    tokenHolder: cluster.tokenHolder,
  }
}

// ---------------------------------------------------------------------------
// Cluster token management
// ---------------------------------------------------------------------------

/**
 * Transfer the cluster token to another widget.
 * @param {string} clusterId
 * @param {string} fromWidgetId
 * @param {string} toWidgetId
 * @returns {{ ok: boolean, error?: string }}
 */
export async function transferClusterToken(clusterId, fromWidgetId, toWidgetId) {
  const cluster = clusters.get(clusterId)
  if (!cluster) return { ok: false, error: `Cluster ${clusterId} not found` }
  if (cluster.tokenHolder !== fromWidgetId) {
    return { ok: false, error: `Widget ${fromWidgetId} does not hold the cluster token` }
  }
  if (!cluster.members.has(toWidgetId)) {
    return { ok: false, error: `Widget ${toWidgetId} is not a member of cluster ${clusterId}` }
  }

  cluster.tokenHolder = toWidgetId

  await publish(cluster.channel, {
    channel: cluster.channel,
    type: 'cluster:token:transferred',
    senderId: fromWidgetId,
    body: `Cluster token transferred from ${fromWidgetId} to ${toWidgetId}`,
    payload: { fromWidgetId, toWidgetId, clusterId },
  })

  return { ok: true }
}

/**
 * Set the cluster goal.
 * @param {string} clusterId
 * @param {string} senderId
 * @param {string} goal
 * @returns {{ ok: boolean, error?: string }}
 */
export async function setClusterGoal(clusterId, senderId, goal) {
  const cluster = clusters.get(clusterId)
  if (!cluster) return { ok: false, error: `Cluster ${clusterId} not found` }

  // Goal-setting is a leadership responsibility, not a token privilege
  const senderMember = cluster.members.get(senderId)
  if (!senderMember || senderMember.role !== 'leader') {
    return { ok: false, error: `Only the leader can set the cluster goal` }
  }

  cluster.goal = goal

  await publish(cluster.channel, {
    channel: cluster.channel,
    type: 'cluster:goal:set',
    senderId,
    body: goal,
    payload: { clusterId, goal },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Conversation lifecycle
// ---------------------------------------------------------------------------

/**
 * Start a new conversation in a cluster.
 * @param {string} clusterId
 * @param {string} senderId
 * @returns {{ ok: boolean, conversationId?: string, error?: string }}
 */
export async function startConversation(clusterId, senderId) {
  const cluster = clusters.get(clusterId)
  if (!cluster) return { ok: false, error: `Cluster ${clusterId} not found` }

  const { generateId } = await import('./schema.js')
  const conversationId = `conv_${generateId()}`

  cluster.activeConversation = {
    id: conversationId,
    status: 'active',
    summary: null,
    startedAt: new Date().toISOString(),
    finalizedAt: null,
  }

  await publish(cluster.channel, {
    channel: cluster.channel,
    type: 'conversation:start',
    senderId,
    body: `Conversation ${conversationId} started`,
    payload: { clusterId, conversationId },
  })

  return { ok: true, conversationId }
}

/**
 * Signal finality for the active conversation.
 * @param {string} clusterId
 * @param {string} senderId
 * @param {string} summary
 * @param {string|null} successor - next token holder
 * @returns {{ ok: boolean, error?: string }}
 */
export async function signalFinality(clusterId, senderId, summary, successor) {
  const cluster = clusters.get(clusterId)
  if (!cluster) return { ok: false, error: `Cluster ${clusterId} not found` }

  // Finality is gated on the leader ROLE, not the cluster token.
  // Any agent can hold the token (speaking rights), but only the leader
  // can declare the conversation complete.
  const senderMember = cluster.members.get(senderId)
  if (!senderMember || senderMember.role !== 'leader') {
    return { ok: false, error: `Only the leader can signal finality` }
  }
  if (!cluster.activeConversation || cluster.activeConversation.status === 'finalized') {
    return { ok: false, error: `No active conversation to finalize` }
  }

  const conversationId = cluster.activeConversation.id
  cluster.activeConversation.status = 'finalized'
  cluster.activeConversation.summary = summary
  cluster.activeConversation.finalizedAt = new Date().toISOString()

  if (successor && cluster.members.has(successor)) {
    cluster.tokenHolder = successor
  }

  await publish(cluster.channel, {
    channel: cluster.channel,
    type: 'conversation:finality',
    senderId,
    body: summary,
    payload: { clusterId, conversationId, summary, successor },
  })

  return { ok: true }
}

/**
 * Reopen a finalized conversation.
 * @param {string} clusterId
 * @param {string} senderId
 * @param {string} conversationId
 * @param {string} body
 * @returns {{ ok: boolean, error?: string }}
 */
export async function reopenConversation(clusterId, senderId, conversationId, body) {
  const cluster = clusters.get(clusterId)
  if (!cluster) return { ok: false, error: `Cluster ${clusterId} not found` }

  if (!cluster.activeConversation || cluster.activeConversation.id !== conversationId) {
    return { ok: false, error: `Conversation ${conversationId} not found in cluster` }
  }
  if (cluster.activeConversation.status !== 'finalized') {
    return { ok: false, error: `Conversation is not finalized` }
  }

  cluster.activeConversation.status = 'reopened'
  cluster.activeConversation.finalizedAt = null

  await publish(cluster.channel, {
    channel: cluster.channel,
    type: 'conversation:reopen',
    senderId,
    body,
    payload: { clusterId, conversationId },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Reset (for tests)
// ---------------------------------------------------------------------------

export function resetClusters() {
  clusters.clear()
  canvasClusters.clear()
}
