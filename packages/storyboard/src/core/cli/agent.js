#!/usr/bin/env node
/**
 * storyboard agent signal — signal agent status to the canvas server.
 *
 * Usage:
 *   npx storyboard agent signal --widget <id> --canvas <canvasId> --status done|error|running [--message "..."]
 *
 * Environment variables (auto-set by terminal server):
 *   STORYBOARD_WIDGET_ID  — widget ID (fallback if --widget not provided)
 *   STORYBOARD_CANVAS_ID  — canvas ID (fallback if --canvas not provided)
 *   STORYBOARD_SERVER_URL — server base URL
 *   STORYBOARD_BRANCH     — current branch
 */

import { parseFlags } from './flags.js'
import { dim, bold, cyan, yellow } from './intro.js'

const subcommand = process.argv[3]

if (subcommand === 'signal') {
  const flagSchema = {
    widget: { type: 'string', description: 'Widget ID' },
    canvas: { type: 'string', description: 'Canvas ID' },
    status: { type: 'string', required: true, description: 'Status: done, error, or running' },
    message: { type: 'string', description: 'Optional status message' },
  }

  const { flags } = parseFlags(process.argv.slice(4), flagSchema)

  const widgetId = flags.widget || process.env.STORYBOARD_WIDGET_ID
  const canvasId = flags.canvas || process.env.STORYBOARD_CANVAS_ID
  const status = flags.status
  const message = flags.message || null
  const serverUrl = process.env.STORYBOARD_SERVER_URL || 'http://localhost:1234'
  const branch = process.env.STORYBOARD_BRANCH || 'unknown'

  if (!widgetId || !canvasId || !status) {
    console.error(`${bold('Usage:')} npx storyboard agent signal --status done|error|running`)
    console.error(`${dim('Widget and canvas IDs are read from environment if not provided.')}`)
    process.exit(1)
  }

  const validStatuses = ['done', 'error', 'running']
  if (!validStatuses.includes(status)) {
    console.error(`${bold('Error:')} Status must be one of: ${validStatuses.join(', ')}`)
    process.exit(1)
  }

  try {
    const url = `${serverUrl}/_storyboard/canvas/agent/signal`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetId, canvasId, branch, status, message }),
    })

    if (res.ok) {
      console.log(`${cyan('✓')} Agent status: ${bold(status)}${message ? ` — ${message}` : ''}`)
    } else {
      const data = await res.json().catch(() => ({}))
      console.error(`${yellow('⚠')} Server returned ${res.status}: ${data.error || 'unknown error'}`)
      // Fallback: write directly to terminal config
      await fallbackWrite({ branch, canvasId, widgetId, status, message })
    }
  } catch {
    // Server not reachable — write directly to terminal config file
    await fallbackWrite({ branch, canvasId, widgetId, status, message })
  }
} else {
  console.error(`${bold('Usage:')} npx storyboard agent <signal>`)
  console.error(`${dim('Subcommands: signal')}`)
  process.exit(1)
}

async function fallbackWrite({ branch, canvasId, widgetId, status, message }) {
  try {
    const { updateAgentStatus, initTerminalConfig } = await import('../canvas/terminal-config.js')
    initTerminalConfig(process.cwd())
    updateAgentStatus({ branch, canvasId, widgetId, status, message })
    console.log(`${cyan('✓')} Agent status written to config file (server offline): ${bold(status)}`)
  } catch (err) {
    console.error(`Failed to write agent status: ${err.message}`)
    process.exit(1)
  }
}
