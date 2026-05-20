/**
 * storyboard hub — Hub and conversation management CLI.
 *
 * Subcommands:
 *   storyboard hub state --canvas <id> [--hub <hubId>] [--widget <widgetId>]
 *   storyboard hub goal --hub <id> --sender <id> --goal "text"
 *   storyboard hub send --hub <id> --sender <id> --body "text" [--recipients '[]'] [--timeout 30000]
 *   storyboard hub respond --hub <id> --message <id> --widget <id> --body "text"
 *   storyboard hub token --hub <id> --from <id> --to <id>
 *   storyboard hub delegate --token <id>
 *   storyboard hub undelegate --token <id>
 *   storyboard hub dissolve --canvas <id>
 *   storyboard hub conversation start --hub <id> --sender <id>
 *   storyboard hub conversation finality --hub <id> --sender <id> [--summary "text"]
 *   storyboard hub conversation reopen --hub <id> --sender <id> --conversation <id>
 */

import { parseSimpleArgs, jsonOut, die, post, get } from './cliHelpers.js'
import { resolveWidgetId } from './resolveWidgetId.js'

const sub = process.argv[3]
const sub2 = process.argv[4]
const MESSAGING_BASE = '/_storyboard/messages'

if (!sub || sub === '--help' || sub === '-h') {
  console.log(`
  hub subcommands:

    state              Get hub state for a canvas
    goal               Set hub goal
    send               Send message to hub peers
    respond            Respond to a message token
    token              Transfer hub token
    delegate           Mark a token as delegating
    undelegate         Mark a delegating token as active
    dissolve           Dissolve all hubs for a canvas
    conversation       Conversation management (start, finality, reopen)
    presence           List present agents
    bindings           List active delivery bridge bindings

  Use --help on any subcommand for flags.
`)
  process.exit(0)
}

// Parse args after subcommand (offset varies for 'conversation' which has sub2)
const argOffset = sub === 'conversation' ? 5 : 4
const args = process.argv.slice(argOffset)

if (args.includes('--help') || args.includes('-h')) {
  // Print subcommand-specific help
  const helpMap = {
    state: `    -c, --canvas   Canvas ID (required)\n    --hub          Hub ID (filter)\n    --widget       Widget ID (for perspective)\n    --json         Output as JSON`,
    goal: `    --hub          Hub ID (required)\n    --sender       Sender widget ID (required)\n    --goal         Goal text (required)`,
    send: `    --hub          Hub ID (required)\n    --sender       Sender widget ID (required)\n    --body         Message body (required)\n    --recipients   JSON array of {widgetId, order}\n    --timeout      Timeout in ms [default: 30000]\n    --parent       Parent message ID`,
    respond: `    --hub          Hub ID (required)\n    --message      Message ID (required)\n    --widget       Responder widget ID (required)\n    --body         Response body (required)`,
    token: `    --hub          Hub ID (required)\n    --from         From widget ID (required)\n    --to           To widget ID (required)`,
    delegate: `    --token        Token ID (required)`,
    undelegate: `    --token        Token ID (required)`,
    dissolve: `    -c, --canvas   Canvas ID (required)`,
    presence: `    --branch       Branch filter\n    -c, --canvas   Canvas filter\n    --widget       Widget ID filter`,
    bindings: `    (no flags)`,
  }
  const key = sub === 'conversation' ? `conversation ${sub2}` : sub
  console.log(`\n  hub ${key} flags:\n\n${helpMap[sub] || helpMap[key] || '    (see source)'}`)
  process.exit(0)
}

const { positional, flags } = parseSimpleArgs(args)

async function run() {
  switch (sub) {
    case 'state': {
      const canvasId = flags.canvas || flags.c || process.env.STORYBOARD_CANVAS_ID
      if (!canvasId) die('--canvas is required')
      let path = `${MESSAGING_BASE}/hub/${encodeURIComponent(canvasId)}`
      const params = []
      if (flags.hub) params.push(`hubId=${encodeURIComponent(flags.hub)}`)
      if (flags.widget) params.push(`widgetId=${encodeURIComponent(flags.widget)}`)
      if (params.length) path += `?${params.join('&')}`
      const data = await get(path)
      jsonOut(data)
      break
    }

    case 'goal': {
      const hubId = flags.hub
      const senderId = resolveWidgetId(flags.sender)
      const goal = flags.goal || positional[0]
      if (!hubId || !senderId || !goal) die('--hub, --sender, and --goal are required')
      const data = await post(`${MESSAGING_BASE}/hub/goal`, { hubId, senderId, goal })
      jsonOut(data)
      break
    }

    case 'send': {
      const hubId = flags.hub
      const senderId = resolveWidgetId(flags.sender)
      const body = flags.body || positional[0]
      if (!hubId || !senderId || !body) die('--hub, --sender, and --body are required')
      const payload = { hubId, senderId, body }
      if (flags.recipients) {
        try { payload.recipients = JSON.parse(flags.recipients) } catch { die('--recipients must be valid JSON') }
      }
      if (flags.timeout) payload.timeoutMs = parseInt(flags.timeout, 10)
      if (flags.parent) payload.parentMessageId = flags.parent
      const data = await post(`${MESSAGING_BASE}/hub/send`, payload)
      jsonOut(data)
      break
    }

    case 'respond': {
      const hubId = flags.hub
      const messageId = flags.message
      const widgetId = resolveWidgetId(flags.widget)
      const body = flags.body || positional[0]
      if (!hubId || !messageId || !widgetId || !body) die('--hub, --message, --widget, and --body are required')
      const data = await post(`${MESSAGING_BASE}/hub/respond`, { hubId, messageId, widgetId, body })
      jsonOut(data)
      break
    }

    case 'token': {
      const hubId = flags.hub
      const fromWidgetId = flags.from
      const toWidgetId = flags.to
      if (!hubId || !fromWidgetId || !toWidgetId) die('--hub, --from, and --to are required')
      const data = await post(`${MESSAGING_BASE}/hub/token`, { hubId, fromWidgetId, toWidgetId })
      jsonOut(data)
      break
    }

    case 'delegate': {
      const tokenId = flags.token || positional[0]
      if (!tokenId) die('--token is required')
      const data = await post(`${MESSAGING_BASE}/hub/delegate`, { tokenId })
      jsonOut(data)
      break
    }

    case 'undelegate': {
      const tokenId = flags.token || positional[0]
      if (!tokenId) die('--token is required')
      const data = await post(`${MESSAGING_BASE}/hub/undelegate`, { tokenId })
      jsonOut(data)
      break
    }

    case 'dissolve': {
      const canvasId = flags.canvas || flags.c || process.env.STORYBOARD_CANVAS_ID
      if (!canvasId) die('--canvas is required')
      const data = await post(`${MESSAGING_BASE}/hub/dissolve`, { canvasId })
      jsonOut(data)
      break
    }

    case 'conversation': {
      if (!sub2 || !['start', 'finality', 'reopen'].includes(sub2)) {
        die('Usage: storyboard hub conversation <start|finality|reopen>')
      }

      if (sub2 === 'start') {
        const hubId = flags.hub
        const senderId = resolveWidgetId(flags.sender)
        if (!hubId || !senderId) die('--hub and --sender are required')
        const data = await post(`${MESSAGING_BASE}/conversation/start`, { hubId, senderId })
        jsonOut(data)
      } else if (sub2 === 'finality') {
        const hubId = flags.hub
        const senderId = resolveWidgetId(flags.sender)
        const summary = flags.summary || ''
        const successor = flags.successor || null
        if (!hubId || !senderId) die('--hub and --sender are required')
        const data = await post(`${MESSAGING_BASE}/conversation/finality`, { hubId, senderId, summary, successor })
        jsonOut(data)
      } else if (sub2 === 'reopen') {
        const hubId = flags.hub
        const senderId = resolveWidgetId(flags.sender)
        const conversationId = flags.conversation
        const body = flags.body || ''
        if (!hubId || !senderId || !conversationId) die('--hub, --sender, and --conversation are required')
        const data = await post(`${MESSAGING_BASE}/conversation/reopen`, { hubId, senderId, conversationId, body })
        jsonOut(data)
      }
      break
    }

    case 'presence': {
      const branch = flags.branch || process.env.STORYBOARD_BRANCH
      const canvasId = flags.canvas || flags.c || process.env.STORYBOARD_CANVAS_ID
      const widgetId = flags.widget

      let path = `${MESSAGING_BASE}/presence`
      if (branch && canvasId) {
        path += `/${encodeURIComponent(branch)}/${encodeURIComponent(canvasId)}`
        if (widgetId) path += `/${encodeURIComponent(widgetId)}`
      }
      const data = await get(path)
      jsonOut(data)
      break
    }

    case 'bindings': {
      const data = await get(`${MESSAGING_BASE}/bindings`)
      jsonOut(data)
      break
    }

    default:
      die(`Unknown hub subcommand: ${sub}. Use --help for a list.`)
  }
}

run().catch((err) => die(err.message))
