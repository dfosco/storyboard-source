#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Two-Agent Messaging Demo
 *
 * Simulates two agents (Alice & Bob) communicating via the messaging bus.
 * Each agent subscribes to a shared channel via SSE and publishes via HTTP.
 *
 * Usage:
 *   node packages/storyboard/src/core/messaging/demo/two-agents.js [port]
 *
 * Default port: 1234 (matches `npm run dev:vite`)
 */

const PORT = process.argv[2] || 1234
const BASE = `http://localhost:${PORT}/_storyboard/messages`
const CHANNEL = 'demo:conversation'

// ANSI colors for terminal output
const colors = {
  alice: '\x1b[36m',   // cyan
  bob: '\x1b[33m',     // yellow
  system: '\x1b[90m',  // gray
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(agent, msg) {
  const color = colors[agent] || colors.system
  const label = agent === 'system' ? '⚙️ ' : agent === 'alice' ? '🅰  Alice' : '🅱  Bob'
  console.log(`${color}${label}${colors.reset} ${msg}`)
}

// ---------------------------------------------------------------------------
// SSE client using fetch streaming (no EventSource dependency)
// ---------------------------------------------------------------------------

async function sseSubscribe(channel, agentName, onEvent) {
  const url = `${BASE}/subscribe/${encodeURIComponent(channel)}`
  log('system', `${agentName} subscribing to SSE: ${url}`)

  const res = await fetch(url, {
    headers: { Accept: 'text/event-stream' },
  })

  if (!res.ok) {
    throw new Error(`SSE subscribe failed: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Process stream in background
  ;(async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE frames (data: ...\n\n)
        const frames = buffer.split('\n\n')
        buffer = frames.pop() // keep incomplete frame

        for (const frame of frames) {
          const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))
          if (dataLine) {
            try {
              const event = JSON.parse(dataLine.slice(6))
              onEvent(event)
            } catch { /* skip malformed SSE frame */ }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        log('system', `${agentName} SSE stream error: ${err.message}`)
      }
    }
  })()

  return { reader, response: res }
}

// ---------------------------------------------------------------------------
// Publish helper
// ---------------------------------------------------------------------------

async function publishMessage({ channel, type, senderId, senderName, body, correlationId, status }) {
  const res = await fetch(`${BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, type, senderId, senderName, body, correlationId, status }),
  })
  return res.json()
}

// ---------------------------------------------------------------------------
// Demo conversation
// ---------------------------------------------------------------------------

async function run() {
  console.log(`\n${colors.bold}━━━ Two-Agent Messaging Demo ━━━${colors.reset}`)
  console.log(`${colors.system}Bus: ${BASE}  |  Channel: ${CHANNEL}${colors.reset}\n`)

  const aliceId = 'agent-alice'
  const bobId = 'agent-bob'

  // Track received messages per agent
  const aliceInbox = []
  const bobInbox = []

  // Subscribe both agents
  const aliceSse = await sseSubscribe(CHANNEL, 'Alice', (event) => {
    if (event.senderId === aliceId) return // skip own messages
    aliceInbox.push(event)
    log('alice', `📨 received: "${event.body}" (from ${event.senderName || event.senderId})`)
  })

  const bobSse = await sseSubscribe(CHANNEL, 'Bob', (event) => {
    if (event.senderId === bobId) return // skip own messages
    bobInbox.push(event)
    log('bob', `📨 received: "${event.body}" (from ${event.senderName || event.senderId})`)

    // Bob auto-responds to requests
    if (event.type === 'message:request') {
      setTimeout(async () => {
        log('bob', `💬 responding to Alice...`)
        await publishMessage({
          channel: CHANNEL,
          type: 'message:response',
          senderId: bobId,
          senderName: 'Bob',
          body: `Got it! Here's my take on "${event.body}": I think we should start with a simple prototype.`,
          correlationId: event.id,
          status: 'resolved',
        })
      }, 500)
    }
  })

  // Wait for SSE connections to establish
  await new Promise((r) => setTimeout(r, 300))

  // Alice sends a message
  log('alice', `💬 sending request...`)
  const { event: aliceMsg } = await publishMessage({
    channel: CHANNEL,
    type: 'message:request',
    senderId: aliceId,
    senderName: 'Alice',
    body: 'What do you think about the new navigation design?',
    status: 'pending',
  })
  log('alice', `✅ published (id: ${aliceMsg.id.slice(0, 8)}...)`)

  // Wait for Bob's response
  await new Promise((r) => setTimeout(r, 1500))

  // Alice follows up
  log('alice', `💬 following up...`)
  await publishMessage({
    channel: CHANNEL,
    type: 'message:request',
    senderId: aliceId,
    senderName: 'Alice',
    body: 'Great idea! Can you sketch out the sidebar component?',
    status: 'pending',
  })

  // Wait for response cycle
  await new Promise((r) => setTimeout(r, 1500))

  // Summary
  console.log(`\n${colors.bold}━━━ Conversation Summary ━━━${colors.reset}`)
  log('alice', `received ${aliceInbox.length} message(s)`)
  log('bob', `received ${bobInbox.length} message(s)`)

  // Read full log from server
  const readRes = await fetch(`${BASE}/read/${encodeURIComponent(CHANNEL)}`)
  const { events } = await readRes.json()
  console.log(`\n${colors.system}Full channel log (${events.length} events):${colors.reset}`)
  for (const e of events) {
    const who = e.senderName || e.senderId
    const corr = e.correlationId ? ` [reply-to: ${e.correlationId.slice(0, 8)}...]` : ''
    console.log(`  ${colors.system}${e.id.slice(0, 8)}${colors.reset} ${who}: ${e.body}${corr}`)
  }

  // Cleanup
  console.log(`\n${colors.system}Cleaning up...${colors.reset}`)
  try { aliceSse.reader.cancel() } catch { /* already closed */ }
  try { bobSse.reader.cancel() } catch { /* already closed */ }

  console.log(`${colors.bold}Done!${colors.reset}\n`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Demo failed:', err.message)
  console.error(`\nMake sure the dev server is running: npm run dev:vite`)
  process.exit(1)
})
