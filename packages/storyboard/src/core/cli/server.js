/**
 * storyboard server — Dev server lifecycle management.
 *
 * Usage:
 *   storyboard server              List running dev servers
 *   storyboard server list         List running dev servers
 *   storyboard server start [wt]   Start the persistent server + Vite for a worktree
 *   storyboard server stop <id>    Stop a dev server by worktree name or ID
 */

import * as p from '@clack/prompts'
import { startServer, SERVER_PORT, spawnViteForBranch } from '../server/index.js'
import { parseFlags } from './flags.js'
import { readDevDomain, generateRouteConfig, upsertCaddyRoute, isCaddyRunning } from './proxy.js'
import { detectWorktreeName, releasePort } from '../worktree/port.js'
import {
  list,
  findByWorktree,
  findById,
  unregister,
} from '../worktree/serverRegistry.js'

const flagSchema = {
  port: { type: 'number', description: 'Server port (default: 4100)' },
  background: { type: 'boolean', default: false, description: 'Run in background (--bg alias)' },
  bg: { type: 'boolean', default: false, description: 'Run in background' },
  multiple: { type: 'boolean', default: false, description: 'Allow multiple servers per worktree' },
}

// ─── Commands ────────────────────────────────────────────

function serverList() {
  const servers = list()
  if (servers.length === 0) {
    p.log.info('No dev servers running.')
    return
  }

  const devDomain = readDevDomain()

  p.log.info('Running dev servers:\n')
  for (const s of servers) {
    const isMain = s.worktree === 'main'
    const basePath = isMain ? '/' : `/branch--${s.worktree}/`
    const proxyUrl = `http://${devDomain}${basePath}`
    const bg = s.background ? ' (bg)' : ''
    console.log(`  ${s.id}  ${s.worktree.padEnd(32)}  :${String(s.port).padEnd(5)}  PID ${String(s.pid).padEnd(7)}  ${proxyUrl}${bg}`)
  }
  console.log()
}

async function serverStart(branchArg, flags) {
  const { background, bg, multiple } = flags
  const _isBackground = background || bg
  void _isBackground
  const worktreeName = branchArg || detectWorktreeName()

  // Check for duplicate worktree servers
  if (!multiple) {
    const existing = findByWorktree(worktreeName)
    if (existing.length > 0) {
      p.log.error(`A dev server is already running for "${worktreeName}" (ID: ${existing[0].id}, PID: ${existing[0].pid}).`)
      p.log.info(`To stop it:  npx storyboard server stop ${existing[0].id}`)
      p.log.info(`To allow multiple:  npx storyboard server start ${worktreeName} --multiple`)
      process.exit(1)
    }
  }

  const devDomain = readDevDomain()
  const port = flags.port || SERVER_PORT

  // Register server itself with Caddy
  try {
    const serverRoute = generateRouteConfig({ __server__: port })
    if (isCaddyRunning()) {
      upsertCaddyRoute(serverRoute)
    }
  } catch { /* Caddy not available */ }

  try {
    await startServer(port)
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      p.log.error(`Port ${port} is already in use — another server may be running.`)
      p.log.info('Try: npx storyboard server list')
      process.exit(1)
    }
    throw err
  }

  const isMain = worktreeName === 'main'
  const basePath = isMain ? '/' : `/branch--${worktreeName}/`
  const proxyUrl = `http://${devDomain}${basePath}`

  p.log.step(`Starting dev session for ${worktreeName}...`)

  try {
    const entry = spawnViteForBranch(worktreeName)
    const { waitForPort } = await import('../server/index.js')
    const ready = await waitForPort(entry.port)

    if (ready) {
      p.log.success(`[${entry.serverId}] ${proxyUrl}`)
    } else {
      p.log.warning(`Vite started but may not be ready yet — check ${proxyUrl}`)
    }
  } catch (err) {
    p.log.error(`Failed to start dev for ${worktreeName}: ${err.message}`)
  }

  p.outro('Server running')
}

function serverStop(target) {
  if (!target) {
    p.log.error('Usage: storyboard server stop <worktree|ID>')
    process.exit(1)
  }

  // Try by ID first
  let entry = findById(target)

  // Then by worktree name
  if (!entry) {
    const matches = findByWorktree(target)
    if (matches.length === 0) {
      p.log.error(`No server found for "${target}".`)
      p.log.info('Run `npx storyboard server list` to see running servers.')
      process.exit(1)
    }
    if (matches.length > 1) {
      p.log.error(`Multiple servers running for worktree "${target}":`)
      for (const s of matches) {
        console.log(`  ${s.id}  PID: ${s.pid}  Port: ${s.port}`)
      }
      p.log.info('Specify an ID: npx storyboard server stop <ID>')
      process.exit(1)
    }
    entry = matches[0]
  }

  try {
    process.kill(entry.pid, 'SIGTERM')
    p.log.success(`Stopped server ${entry.id} (PID: ${entry.pid}, worktree: "${entry.worktree}")`)
  } catch (err) {
    if (err.code === 'ESRCH') {
      p.log.info(`Server ${entry.id} (PID: ${entry.pid}) was already dead.`)
    } else {
      p.log.error(`Failed to kill PID ${entry.pid}: ${err.message}`)
    }
  }

  unregister(entry.id)
  releasePort(entry.worktree)
}

// ─── Dispatch ────────────────────────────────────────────

async function main() {
  const { flags, positional } = parseFlags(process.argv.slice(3), flagSchema)
  const subcommand = positional[0]

  p.intro('storyboard server')

  switch (subcommand) {
    case undefined:
    case 'list':
      serverList()
      break
    case 'start':
      await serverStart(positional[1], flags)
      break
    case 'stop':
      serverStop(positional[1])
      break
    default: {
      // Catch unknown subcommands before falling through to legacy branch behavior
      const knownSubcommands = ['list', 'start', 'stop']
      if (subcommand && !subcommand.match(/^[a-z0-9]/) || ['exit', 'help', 'status'].includes(subcommand)) {
        p.log.error(`Unknown subcommand: "${subcommand}"`)
        p.log.info(`Available: ${knownSubcommands.join(', ')}`)
        p.log.info(`To start a branch: npx storyboard server start <branch>`)
        process.exit(1)
      }
      // Legacy behavior: treat argument as branch name (storyboard server <branch>)
      await serverStart(subcommand, flags)
      break
    }
  }
}

main()
