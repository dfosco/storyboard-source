/**
 * Messaging Bus HTTP Routes
 *
 * Provides REST API for the messaging bus with TOON content negotiation.
 *
 * Endpoints:
 *   POST /publish       — Publish a single event
 *   POST /send          — Publish + wait for correlated response (chained)
 *   POST /batch         — Publish N events + read from M channels
 *   GET  /read/:channel — Read events from a channel (supports multi-channel via ?channels=)
 *   GET  /namespaces    — List registered event namespaces
 */

import { publish, subscribe, read, readMulti } from './bus.js'
import { negotiateFormat, serializeResponse, parseRequestBody } from './toon.js'
import { getPresent, isPresent, getAllPresent } from './presence.js'
import { getBindings } from './delivery.js'
import {
  getHub,
  getHubsForCanvas,
  transferHubToken,
  setHubGoal,
  startConversation,
  signalFinality,
  reopenConversation,
  serializeHub,
  dissolveHubsForCanvas,
} from './hub-manager.js'
import {
  createMessageTokens,
  resolveTokenByWidget,
  getRoundStatus,
  delegateToken,
  undelegateToken,
} from './token-manager.js'

/** @type {Set<{ res: any, unsub: () => void, timer: NodeJS.Timeout }>} Active SSE connections */
const sseConnections = new Set()

/**
 * Create the messaging route handler.
 *
 * @param {{ sendJson: Function }} opts
 * @returns {(req: any, res: any, ctx: any) => Promise<void>}
 */
export function createMessagingRoutes({ sendJson }) {
  return async (req, res, ctx) => {
    const { method, path: routePath, body } = ctx
    const subpath = (routePath || '/').replace(/^\//, '').split('?')[0]

    try {
      // POST /publish — publish a single event to a channel
      if (method === 'POST' && subpath === 'publish') {
        return await handlePublish(req, res, body, sendJson)
      }

      // POST /send — publish and wait for correlated response
      if (method === 'POST' && subpath === 'send') {
        return await handleSend(req, res, body, sendJson)
      }

      // POST /batch — publish N events + read from M channels
      if (method === 'POST' && subpath === 'batch') {
        return await handleBatch(req, res, body, sendJson)
      }

      // GET /subscribe — SSE stream of live events
      if (method === 'GET' && (subpath === 'subscribe' || subpath.startsWith('subscribe/'))) {
        return handleSubscribe(req, res, ctx, sendJson)
      }

      // GET /read — read events (channel from query or path)
      if (method === 'GET' && (subpath === 'read' || subpath.startsWith('read/'))) {
        return await handleRead(req, res, ctx, sendJson)
      }

      // GET /presence — list present agents (optionally filtered by canvas)
      if (method === 'GET' && (subpath === 'presence' || subpath.startsWith('presence/'))) {
        return await handlePresence(req, res, ctx, sendJson)
      }

      // GET /bindings — list active delivery bridge bindings
      if (method === 'GET' && subpath === 'bindings') {
        return await sendNegotiated(req, res, 200, { bindings: getBindings() })
      }

      // GET /hub/:canvasId — get hub state for a canvas
      if (method === 'GET' && subpath.startsWith('hub/')) {
        return await handleHubState(req, res, ctx, sendJson)
      }

      // POST /hub/token — transfer hub token
      if (method === 'POST' && subpath === 'hub/token') {
        return await handleHubTokenTransfer(req, res, body, sendJson)
      }

      // POST /hub/goal — set hub goal
      if (method === 'POST' && subpath === 'hub/goal') {
        return await handleHubGoal(req, res, body, sendJson)
      }

      // POST /hub/send — send message with tokens to hub peers
      if (method === 'POST' && subpath === 'hub/send') {
        return await handleHubSend(req, res, body, sendJson)
      }

      // POST /hub/respond — respond to a message token
      if (method === 'POST' && subpath === 'hub/respond') {
        return await handleHubRespond(req, res, body, sendJson)
      }

      // POST /hub/delegate — mark a token as delegating (holder is creating sub-requests)
      if (method === 'POST' && subpath === 'hub/delegate') {
        return await handleHubDelegate(req, res, body, sendJson)
      }

      // POST /hub/undelegate — mark a delegating token as active again
      if (method === 'POST' && subpath === 'hub/undelegate') {
        return await handleHubUndelegate(req, res, body, sendJson)
      }

      // POST /conversation/start — start a new conversation
      if (method === 'POST' && subpath === 'conversation/start') {
        return await handleConversationStart(req, res, body, sendJson)
      }

      // POST /conversation/finality — signal conversation finality
      if (method === 'POST' && subpath === 'conversation/finality') {
        return await handleConversationFinality(req, res, body, sendJson)
      }

      // POST /conversation/reopen — reopen a finalized conversation
      if (method === 'POST' && subpath === 'conversation/reopen') {
        return await handleConversationReopen(req, res, body, sendJson)
      }

      // POST /hub/dissolve — dissolve all hubs for a canvas
      if (method === 'POST' && subpath === 'hub/dissolve') {
        return handleHubDissolve(req, res, body, sendJson)
      }

      sendJson(res, 404, { error: `Unknown messaging route: ${method} ${subpath}` })
    } catch (err) {
      sendJson(res, 500, { error: err.message || 'Internal messaging error' })
    }
  }
}

// ---------------------------------------------------------------------------
// SSE subscribe
// ---------------------------------------------------------------------------

const SSE_HEARTBEAT_INTERVAL = 30_000 // 30s keepalive

/**
 * GET /subscribe/:channel — Stream live events as Server-Sent Events.
 *
 * Supports reconnection:
 *   - `Last-Event-ID` header → replay missed events before going live
 *   - `?since=ULID` query param → same as Last-Event-ID
 *   - `?type=prefix` → filter events by type prefix
 *
 * Each SSE message uses the event id as the SSE `id:` field so clients can
 * reconnect with `Last-Event-ID`.
 */
function handleSubscribe(req, res, ctx, sendJson) {
  const url = new URL(`http://localhost${ctx.path || '/'}`)
  const subpath = (ctx.path || '/').replace(/^\//, '').split('?')[0]
  const channel = subpath.startsWith('subscribe/') ? decodeURIComponent(subpath.slice(10)) : url.searchParams.get('channel')

  if (!channel) {
    return sendJson(res, 400, { error: 'Missing channel. Use /subscribe/{channel} or ?channel=name' })
  }

  const typeFilter = url.searchParams.get('type') || undefined
  const since = req.headers['last-event-id'] || url.searchParams.get('since') || undefined

  // Start SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // disable nginx buffering
  })
  if (typeof res.flushHeaders === 'function') res.flushHeaders()

  // Backfill missed events if reconnecting
  if (since) {
    read(channel, { since, type: typeFilter }).then((missed) => {
      for (const event of missed) {
        if (!res.destroyed) {
          writeSseEvent(res, event)
        }
      }
    }).catch((err) => {
      console.error('[messaging-bus] SSE backfill error:', err)
    })
  }

  // Subscribe to live events
  const unsub = subscribe(channel, (event) => {
    if (res.destroyed) { unsub(); return }
    if (typeFilter && (!event.type || !event.type.startsWith(typeFilter))) return
    writeSseEvent(res, event)
  })

  // Periodic heartbeat to keep connection alive through proxies
  const timer = setInterval(() => {
    if (res.destroyed) { clearInterval(timer); unsub(); return }
    res.write(':\n\n')
  }, SSE_HEARTBEAT_INTERVAL)

  // Track connection for cleanup
  const conn = { res, unsub, timer }
  sseConnections.add(conn)

  // Cleanup on disconnect
  res.on('close', () => {
    unsub()
    clearInterval(timer)
    sseConnections.delete(conn)
  })

  res.on('error', () => {
    unsub()
    clearInterval(timer)
    sseConnections.delete(conn)
  })
}

/**
 * Write a single SSE event frame.
 */
function writeSseEvent(res, event) {
  try {
    res.write(`id: ${event.id}\n`)
    res.write(`event: message\n`)
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  } catch {
    // Connection likely dead — cleanup will happen via res.on('close')
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * POST /publish — Publish a single event.
 * Body: { channel, type, senderId, body?, payload?, status?, correlationId?, ...domainFields }
 */
async function handlePublish(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])

  if (!parsed.channel) {
    return sendJson(res, 400, { error: 'Missing required field: channel' })
  }

  const event = await publish(parsed.channel, parsed)
  return await sendNegotiated(req, res, 201, { ok: true, event })
}

/**
 * POST /send — Publish a request and wait for correlated response.
 * Body: { channel, type, senderId, body?, timeout?, ...domainFields }
 *
 * The server publishes the message, sets correlationId to the new event's id,
 * then subscribes for a response with that correlationId. Returns when a
 * response arrives or timeout expires.
 */
async function handleSend(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])

  if (!parsed.channel) {
    return sendJson(res, 400, { error: 'Missing required field: channel' })
  }

  const timeout = parsed.timeout || 30000 // 30s default
  delete parsed.timeout

  // Publish the request — correlationId self-references the new event
  const requestEvent = await publish(parsed.channel, {
    ...parsed,
    status: parsed.status || 'pending',
  })

  // Subscribe and wait for a correlated response
  const responsePromise = new Promise((resolve) => {
    let timer

    const unsub = subscribe(parsed.channel, (event) => {
      if (
        event.correlationId === requestEvent.id &&
        event.id !== requestEvent.id &&
        (event.type?.endsWith(':response') || event.status === 'resolved' || event.status === 'failed')
      ) {
        clearTimeout(timer)
        unsub()
        resolve({ ok: true, response: event })
      }
    })

    timer = setTimeout(() => {
      unsub()
      resolve({ ok: false, error: 'timeout', timeout })
    }, timeout)
  })

  const result = await responsePromise

  if (result.ok) {
    return await sendNegotiated(req, res, 200, result)
  }
  return await sendNegotiated(req, res, 408, result)
}

/**
 * POST /batch — Publish events and/or read from channels in one call.
 * Body: {
 *   publish?: Array<{ channel, type, senderId, ... }>,
 *   read?: Array<{ channel, since?, limit?, type? }> | { channels: string[], since?, limit?, type? }
 * }
 */
async function handleBatch(req, res, body) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const result = { published: [], read: {} }

  // Publish events
  if (Array.isArray(parsed.publish)) {
    for (const eventFields of parsed.publish) {
      if (!eventFields.channel) continue
      const event = await publish(eventFields.channel, eventFields)
      result.published.push(event)
    }
  }

  // Read from channels
  if (parsed.read) {
    if (Array.isArray(parsed.read)) {
      // Array of { channel, since?, limit?, type? }
      for (const readOpts of parsed.read) {
        if (!readOpts.channel) continue
        result.read[readOpts.channel] = await read(readOpts.channel, readOpts)
      }
    } else if (parsed.read.channels) {
      // { channels: [...], since?, limit?, type? }
      const opts = { since: parsed.read.since, limit: parsed.read.limit, type: parsed.read.type }
      result.read = await readMulti(parsed.read.channels, opts)
    }
  }

  return await sendNegotiated(req, res, 200, result)
}

/**
 * GET /read — Read events from one or multiple channels.
 * Query params: ?channel=X or ?channels=X,Y,Z&since=ULID&limit=N&type=prefix
 * Path param: /read/{channel}
 */
async function handleRead(req, res, ctx, sendJson) {
  const url = new URL(`http://localhost${ctx.path || '/'}`)
  const subpath = (ctx.path || '/').replace(/^\//, '').split('?')[0]

  // Extract channel from path (/read/{channel}) or query
  const pathChannel = subpath.startsWith('read/') ? decodeURIComponent(subpath.slice(5)) : null
  const queryChannel = url.searchParams.get('channel')
  const queryChannels = url.searchParams.get('channels')

  const since = url.searchParams.get('since') || undefined
  const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit'), 10) : undefined
  const type = url.searchParams.get('type') || undefined
  const opts = { since, limit, type }

  // Multi-channel read
  if (queryChannels) {
    const channels = queryChannels.split(',').map((c) => c.trim()).filter(Boolean)
    const result = await readMulti(channels, opts)
    return await sendNegotiated(req, res, 200, result)
  }

  // Single channel read
  const channel = pathChannel || queryChannel
  if (!channel) {
    return sendJson(res, 400, { error: 'Missing channel. Use /read/{channel} or ?channel=name' })
  }

  const events = await read(channel, opts)
  return await sendNegotiated(req, res, 200, { channel, events })
}

// ---------------------------------------------------------------------------
// Presence endpoint
// ---------------------------------------------------------------------------

/**
 * GET /presence — List currently-present agents.
 * Path variants:
 *   /presence                         — all present agents across all canvases
 *   /presence/:branch/:canvasId       — agents on a specific canvas
 *   /presence/:branch/:canvasId/:wid  — check if a specific agent is present
 */
async function handlePresence(req, res, ctx, sendJson) {
  const subpath = (ctx.path || '/').replace(/^\//, '').split('?')[0]
  const parts = subpath.split('/').slice(1) // remove 'presence' prefix

  if (parts.length === 0 || (parts.length === 1 && !parts[0])) {
    // All present agents
    return await sendNegotiated(req, res, 200, { agents: getAllPresent() })
  }

  if (parts.length >= 2) {
    const branch = decodeURIComponent(parts[0])
    const canvasId = decodeURIComponent(parts[1])

    if (parts.length >= 3 && parts[2]) {
      // Specific widget
      const widgetId = decodeURIComponent(parts[2])
      const entry = isPresent(widgetId)
      if (entry && entry.branch === branch && entry.canvasId === canvasId) {
        return await sendNegotiated(req, res, 200, { present: true, agent: entry })
      }
      return await sendNegotiated(req, res, 200, { present: false, agent: null })
    }

    // All agents on a canvas
    const agents = getPresent(branch, canvasId)
    return await sendNegotiated(req, res, 200, { agents })
  }

  sendJson(res, 400, { error: 'Use /presence, /presence/:branch/:canvasId, or /presence/:branch/:canvasId/:widgetId' })
}

// ---------------------------------------------------------------------------
// Hub endpoints
// ---------------------------------------------------------------------------

/**
 * GET /hub/:canvasId — Get hub state for a canvas.
 * Optional query: ?hubId=X&widgetId=Y
 */
async function handleHubState(req, res, ctx, sendJson) {
  const subpath = (ctx.path || '/').replace(/^\//, '').split('?')[0]
  const parts = subpath.split('/').slice(1) // remove 'hub' prefix
  const canvasId = decodeURIComponent(parts.join('/'))

  if (!canvasId) {
    return sendJson(res, 400, { error: 'Missing canvasId in path' })
  }

  const url = new URL(`http://localhost${ctx.path || '/'}`)
  const hubId = url.searchParams.get('hubId')
  const widgetId = url.searchParams.get('widgetId')

  if (hubId) {
    const hub = getHub(hubId)
    if (!hub || hub.canvasId !== canvasId) {
      return sendJson(res, 404, { error: `Hub ${hubId} not found on canvas ${canvasId}` })
    }
    return await sendNegotiated(req, res, 200, { hub: serializeHub(hub, widgetId) })
  }

  const hubs = getHubsForCanvas(canvasId)
  return await sendNegotiated(req, res, 200, {
    hubs: hubs.map((c) => serializeHub(c, widgetId)),
  })
}

/**
 * POST /hub/token — Transfer the hub token.
 * Body: { hubId, fromWidgetId, toWidgetId }
 */
async function handleHubTokenTransfer(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, fromWidgetId, toWidgetId } = parsed

  if (!hubId || !fromWidgetId || !toWidgetId) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, fromWidgetId, toWidgetId' })
  }

  const result = await transferHubToken(hubId, fromWidgetId, toWidgetId)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

/**
 * POST /hub/goal — Set the hub goal.
 * Body: { hubId, senderId, goal }
 */
async function handleHubGoal(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, senderId, goal } = parsed

  if (!hubId || !senderId || !goal) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, senderId, goal' })
  }

  const result = await setHubGoal(hubId, senderId, goal)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

/**
 * POST /hub/send — Send a message to hub peers with ordered tokens.
 * Body: { hubId, senderId, body, recipients: [{ widgetId, order }], timeoutMs?, parentMessageId? }
 */
async function handleHubSend(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, senderId, recipients, timeoutMs, parentMessageId } = parsed

  if (!hubId || !senderId || !parsed.body) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, senderId, body' })
  }

  const hub = getHub(hubId)
  if (!hub) return sendJson(res, 404, { error: `Hub ${hubId} not found` })

  // Publish the message to the hub channel
  const event = await publish(hub.channel, {
    channel: hub.channel,
    type: 'hub:message:request',
    senderId,
    body: parsed.body,
    payload: { hubId, parentMessageId: parentMessageId || null },
  })

  // Create ordered message tokens for recipients
  const recipientList = recipients || [...hub.members.keys()]
    .filter((id) => id !== senderId)
    .map((id, i) => ({ widgetId: id, order: i }))

  const tokens = createMessageTokens(event.id, hubId, recipientList, { timeoutMs, parentMessageId })

  return await sendNegotiated(req, res, 201, {
    ok: true,
    messageId: event.id,
    parentMessageId: parentMessageId || null,
    tokens: tokens.map((t) => ({ tokenId: t.tokenId, widgetId: t.widgetId, order: t.order, status: t.status })),
  })
}

/**
 * POST /hub/respond — Respond to a message token.
 * Body: { hubId, messageId, widgetId, body }
 */
async function handleHubRespond(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, messageId, widgetId } = parsed

  if (!hubId || !messageId || !widgetId || !parsed.body) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, messageId, widgetId, body' })
  }

  const hub = getHub(hubId)
  if (!hub) return sendJson(res, 404, { error: `Hub ${hubId} not found` })

  // Publish the response to the hub channel
  const event = await publish(hub.channel, {
    channel: hub.channel,
    type: 'hub:message:response',
    senderId: widgetId,
    body: parsed.body,
    correlationId: messageId,
    payload: { hubId, messageId },
  })

  // Resolve the token
  const result = resolveTokenByWidget(messageId, widgetId, event.id)
  if (!result.ok) return sendJson(res, 400, { error: result.error })

  const roundStatus = getRoundStatus(messageId)

  return await sendNegotiated(req, res, 200, {
    ok: true,
    responseId: event.id,
    round: roundStatus,
    nextToken: result.nextToken ? {
      tokenId: result.nextToken.tokenId,
      widgetId: result.nextToken.widgetId,
      order: result.nextToken.order,
    } : null,
    allResolved: result.allResolved,
  })
}

/**
 * POST /hub/delegate — Mark a token as delegating.
 * Body: { tokenId }
 */
async function handleHubDelegate(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { tokenId } = parsed

  if (!tokenId) {
    return sendJson(res, 400, { error: 'Missing required field: tokenId' })
  }

  const result = delegateToken(tokenId)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

/**
 * POST /hub/undelegate — Mark a delegating token as active again.
 * Body: { tokenId }
 */
async function handleHubUndelegate(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { tokenId } = parsed

  if (!tokenId) {
    return sendJson(res, 400, { error: 'Missing required field: tokenId' })
  }

  const result = undelegateToken(tokenId)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

/**
 * POST /conversation/start — Start a new conversation.
 * Body: { hubId, senderId }
 */
async function handleConversationStart(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, senderId } = parsed

  if (!hubId || !senderId) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, senderId' })
  }

  const result = await startConversation(hubId, senderId)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 201, { ok: true, conversationId: result.conversationId })
}

/**
 * POST /conversation/finality — Signal conversation finality.
 * Body: { hubId, senderId, summary, successor? }
 */
async function handleConversationFinality(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, senderId, summary, successor } = parsed

  if (!hubId || !senderId) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, senderId' })
  }

  const result = await signalFinality(hubId, senderId, summary || '', successor || null)
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

/**
 * POST /conversation/reopen — Reopen a finalized conversation.
 * Body: { hubId, senderId, conversationId, body }
 */
async function handleConversationReopen(req, res, body, sendJson) {
  const parsed = await parseRequestBody(body, req.headers?.['content-type'])
  const { hubId, senderId, conversationId } = parsed

  if (!hubId || !senderId || !conversationId) {
    return sendJson(res, 400, { error: 'Missing required fields: hubId, senderId, conversationId' })
  }

  const result = await reopenConversation(hubId, senderId, conversationId, parsed.body || '')
  if (!result.ok) return sendJson(res, 400, { error: result.error })
  return await sendNegotiated(req, res, 200, { ok: true })
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Send response with TOON content negotiation.
 */
async function sendNegotiated(req, res, status, data) {
  const format = negotiateFormat(req)
  const { body, contentType } = await serializeResponse(data, format)
  res.writeHead(status, { 'Content-Type': contentType })
  res.end(body)
}

/**
 * Close all active SSE connections. Call during server shutdown.
 */
export function closeAllSseConnections() {
  for (const conn of sseConnections) {
    conn.unsub()
    clearInterval(conn.timer)
    if (!conn.res.destroyed) conn.res.end()
  }
  sseConnections.clear()
}

// ---------------------------------------------------------------------------
// Hub dissolve
// ---------------------------------------------------------------------------

/**
 * POST /hub/dissolve — Dissolve all hubs for a canvas.
 * Body: { canvasId }
 */
function handleHubDissolve(req, res, body, sendJson) {
  const { canvasId } = body || {}
  if (!canvasId) return sendJson(res, 400, { error: 'canvasId required' })

  dissolveHubsForCanvas(canvasId)
  sendJson(res, 200, { ok: true })
}
