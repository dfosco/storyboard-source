/**
 * Terminal Messaging CLI — send messages between terminals and save output.
 *
 * Commands:
 *   storyboard terminal send <widgetId> "message"      Send a message to a terminal
 *   storyboard terminal send --connected "message"      Send to connected peer
 *   storyboard terminal output --summary "..." --content "..."  Save latest output
 *   storyboard terminal status <widgetId>               Check terminal status
 *   storyboard terminal read <widgetId>                 Read terminal buffer
 */

import { getServerUrl } from './serverUrl.js'

function parseArgs(args) {
  const result = { positional: [], flags: {} }
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        result.flags[key] = next
        i++
      } else {
        result.flags[key] = true
      }
    } else {
      result.positional.push(args[i])
    }
  }
  return result
}

export async function handleSend() {
  const args = process.argv.slice(4) // skip: node, sb, terminal, send
  const { positional, flags } = parseArgs(args)

  // Resolve sender identity from env
  const senderWidgetId = process.env.STORYBOARD_WIDGET_ID || null

  let targetWidgetId = null
  let message = null

  if (flags.connected) {
    // Auto-resolve connected peer
    if (!senderWidgetId) {
      console.error('Error: --connected requires $STORYBOARD_WIDGET_ID to be set')
      process.exit(1)
    }
    // Read own config to find connected agent/terminal peers
    try {
      const { readTerminalConfigById, initTerminalConfig } = await import('../canvas/terminal-config.js')
      initTerminalConfig(process.cwd())
      const config = readTerminalConfigById(senderWidgetId)
      const peers = (config?.connectedWidgets || []).filter(
        (w) => w.type === 'terminal' || w.type === 'agent'
      )
      if (peers.length === 0) {
        console.error('No connected terminal/agent peers found')
        process.exit(1)
      }
      if (peers.length > 1) {
        console.error(`Multiple peers found. Specify one: ${peers.map((p) => p.id).join(', ')}`)
        process.exit(1)
      }
      targetWidgetId = peers[0].id
    } catch (err) {
      console.error(`Error resolving connected peer: ${err.message}`)
      process.exit(1)
    }
    message = typeof flags.connected === 'string' ? flags.connected : positional[0]
  } else {
    targetWidgetId = positional[0]
    message = positional.slice(1).join(' ') || flags.message
  }

  if (!targetWidgetId || !message) {
    console.error('Usage: storyboard terminal send <widgetId> "message"')
    console.error('       storyboard terminal send --connected "message"')
    process.exit(1)
  }

  const serverUrl = getServerUrl()
  try {
    const res = await fetch(`${serverUrl}/_storyboard/canvas/terminal/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetId: targetWidgetId, message, from: senderWidgetId }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (data.success) {
      if (data.queued) {
        console.log(`Message queued for ${targetWidgetId} (agent not running, will deliver on start)`)
      } else {
        console.log(`Message delivered to ${targetWidgetId}`)
      }
    } else {
      console.error(`Failed: ${data.error}`)
      process.exit(1)
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error(`Error: request timed out — is the dev server running? (tried ${serverUrl})`)
    } else {
      console.error(`Error: ${err.message}`)
    }
    process.exit(1)
  }
}

export async function handleOutput() {
  const args = process.argv.slice(4) // skip: node, sb, terminal, output
  const { flags } = parseArgs(args)

  const widgetId = flags.widget || process.env.STORYBOARD_WIDGET_ID
  const summary = flags.summary || ''
  const content = flags.content || ''

  if (!widgetId) {
    console.error('Error: --widget <id> or $STORYBOARD_WIDGET_ID required')
    process.exit(1)
  }

  const serverUrl = getServerUrl()
  try {
    const res = await fetch(`${serverUrl}/_storyboard/canvas/terminal/output`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetId, content, summary }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (data.success) {
      console.log('Output saved')
    } else {
      console.error(`Failed: ${data.error}`)
      process.exit(1)
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error(`Error: request timed out — is the dev server running? (tried ${serverUrl})`)
    } else {
      console.error(`Error: ${err.message}`)
    }
    process.exit(1)
  }
}

export async function handleStatus() {
  const args = process.argv.slice(4) // skip: node, sb, terminal, status
  const { positional } = parseArgs(args)

  const widgetId = positional[0]
  if (!widgetId) {
    console.error('Usage: storyboard terminal status <widgetId>')
    process.exit(1)
  }

  try {
    const { readTerminalConfigById, initTerminalConfig } = await import('../canvas/terminal-config.js')
    initTerminalConfig(process.cwd())
    const config = readTerminalConfigById(widgetId)
    if (!config) {
      console.error(`No config found for ${widgetId}`)
      process.exit(1)
    }
    console.log(JSON.stringify({
      widgetId: config.widgetId,
      displayName: config.displayName || null,
      agentStatus: config.agentStatus || null,
      latestOutput: config.latestOutput ? { summary: config.latestOutput.summary, updatedAt: config.latestOutput.updatedAt } : null,
      pendingMessages: (config.pendingMessages || []).length,
    }, null, 2))
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

export async function handleRead() {
  const args = process.argv.slice(4) // skip: node, sb, terminal, read
  const { positional, flags } = parseArgs(args)

  const widgetId = positional[0] || process.env.STORYBOARD_WIDGET_ID
  if (!widgetId) {
    console.error('Usage: storyboard terminal read <widgetId> [--length N]')
    process.exit(1)
  }

  const length = flags.length ? parseInt(flags.length, 10) : undefined

  // Try HTTP API first (dev server may have fresher data)
  try {
    const serverUrl = getServerUrl()
    const qs = length ? `?length=${length}` : ''
    const res = await fetch(`${serverUrl}/_storyboard/canvas/terminal-buffer/${encodeURIComponent(widgetId)}${qs}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      console.log(JSON.stringify(data, null, 2))
      return
    }
  } catch {
    // Server not reachable — read directly from file
  }

  // Fallback: read buffer file directly
  try {
    const { readFileSync, existsSync } = await import('node:fs')
    const { join } = await import('node:path')
    const bufferPath = join(process.cwd(), '.storyboard', 'terminal-buffers', `${widgetId}.buffer.json`)
    if (!existsSync(bufferPath)) {
      console.error(`No buffer found for ${widgetId}`)
      process.exit(1)
    }
    const data = JSON.parse(readFileSync(bufferPath, 'utf8'))
    if (length) {
      if (data.scrollback && data.scrollback.length > length) {
        data.scrollback = data.scrollback.slice(-length)
      }
      if (data.paneContent && data.paneContent.length > length) {
        data.paneContent = data.paneContent.slice(-length)
      }
    }
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}
