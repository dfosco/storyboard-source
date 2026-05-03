/**
 * storyboard canvas connector — Create, update, or delete connectors.
 *
 * Usage:
 *   storyboard canvas connector create --canvas <name> --start <id> --end <id> [--start-anchor right] [--end-anchor left]
 *   storyboard canvas connector update <connectorId> --canvas <name> [--start-anchor top] [--end-anchor bottom] [--meta '{}']
 *   storyboard canvas connector delete <connectorId> --canvas <name>
 */

import { post, patch, del, parseSimpleArgs, jsonOut, die } from './cliHelpers.js'

const args = process.argv.slice(4) // skip: node, sb, canvas, connector
const sub = args[0]

if (!sub || sub === '--help' || sub === '-h') {
  console.log(`
  canvas connector subcommands:

    create   Create a connector between two widgets
    update   Update a connector's anchors or meta
    delete   Delete a connector

  create flags:
    -c, --canvas         Canvas name (required)
    --start              Start widget ID (required)
    --end                End widget ID (required)
    --start-anchor       Start anchor: top, bottom, left, right [default: right]
    --end-anchor         End anchor: top, bottom, left, right [default: left]
    --connector-type     Connector type [default: default]
    --meta               Connector meta as JSON string
    --json               Output as JSON

  update flags:
    Positional: <connectorId>
    -c, --canvas         Canvas name (required)
    --start-anchor       New start anchor
    --end-anchor         New end anchor
    --meta               Meta as JSON string

  delete flags:
    Positional: <connectorId>
    -c, --canvas         Canvas name (required)
`)
  process.exit(0)
}

const rest = args.slice(1)
const { positional, flags } = parseSimpleArgs(rest)

const canvas = flags.canvas || flags.c
if (!canvas) die('--canvas is required')

if (sub === 'create') {
  const startWidgetId = flags.start
  const endWidgetId = flags.end
  if (!startWidgetId || !endWidgetId) die('--start and --end widget IDs are required')

  const body = {
    name: canvas,
    startWidgetId,
    endWidgetId,
    startAnchor: flags['start-anchor'] || 'right',
    endAnchor: flags['end-anchor'] || 'left',
    connectorType: flags['connector-type'] || 'default',
  }

  if (flags.meta) {
    try { body.meta = JSON.parse(flags.meta) } catch { die('--meta must be valid JSON') }
  }

  try {
    const result = await post('/_storyboard/canvas/connector', body)
    if (flags.json) {
      jsonOut(result)
    } else {
      console.log(`Connector created: ${result.connector?.id || 'ok'}`)
    }
  } catch (err) { die(err.message) }

} else if (sub === 'update') {
  const connectorId = positional[0]
  if (!connectorId) die('Connector ID is required')

  const body = { name: canvas, connectorId }
  if (flags['start-anchor']) body.startAnchor = flags['start-anchor']
  if (flags['end-anchor']) body.endAnchor = flags['end-anchor']
  if (flags.meta) {
    try { body.meta = JSON.parse(flags.meta) } catch { die('--meta must be valid JSON') }
  }

  try {
    const result = await patch('/_storyboard/canvas/connector', body)
    if (flags.json) { jsonOut(result) } else { console.log('Connector updated') }
  } catch (err) { die(err.message) }

} else if (sub === 'delete') {
  const connectorId = positional[0]
  if (!connectorId) die('Connector ID is required')

  try {
    const result = await del('/_storyboard/canvas/connector', { name: canvas, connectorId })
    if (flags.json) { jsonOut(result) } else { console.log('Connector deleted') }
  } catch (err) { die(err.message) }

} else {
  die(`Unknown connector subcommand: ${sub}. Use create, update, or delete.`)
}
