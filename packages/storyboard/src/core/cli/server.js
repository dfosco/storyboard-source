/**
 * storyboard server — list / start / stop sibling-worktree dev servers.
 *
 * Each worktree runs its own Vite (no daemon). `start` detach-spawns
 * `storyboard dev` in the target worktree directory; the spawned Vite
 * self-registers in `.storyboard/servers.json` once it's listening.
 *
 * Usage:
 *   storyboard server               List running dev servers
 *   storyboard server list          List running dev servers
 *   storyboard server start [wt]    Start dev server for a worktree (detached)
 *   storyboard server stop <wt|id>  Stop a dev server by worktree name or ID
 */

import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { detectWorktreeName, repoRoot, worktreeDir, listWorktrees, releasePort } from '../worktree/port.js'
import { list, findByWorktree, findById, unregister } from '../worktree/serverRegistry.js'
import { parseFlags } from './flags.js'
import { dim, green } from './intro.js'

const flagSchema = {
  multiple: { type: 'boolean', default: false, description: 'Allow more than one server per worktree' },
}

function resolveTargetCwd(name) {
  if (!name || name === 'main') return repoRoot()
  const dir = worktreeDir(name)
  if (!existsSync(resolve(dir, '.git'))) return null
  return dir
}

function serverList() {
  const servers = list()
  if (servers.length === 0) {
    p.log.info('No dev servers running.')
    p.log.info(dim('Start one with: storyboard server start <worktree>'))
    return
  }
  p.log.info('Running dev servers:\n')
  for (const s of servers) {
    const url = `http://localhost:${s.port}/storyboard/`
    console.log(`  ${green(s.id)}  ${s.worktree.padEnd(28)}  :${String(s.port).padEnd(5)}  PID ${String(s.pid).padEnd(7)}  ${url}`)
  }
  console.log()
  p.log.info(dim('Stop one with: storyboard server stop <worktree|id>'))
}

async function serverStart(branchArg, flags) {
  const worktreeName = branchArg || detectWorktreeName()
  const targetCwd = resolveTargetCwd(worktreeName)

  if (!targetCwd) {
    p.log.error(`Worktree "${worktreeName}" does not exist.`)
    p.log.info(`Create it with: storyboard branch ${worktreeName}`)
    process.exit(1)
  }

  if (!flags.multiple) {
    const existing = findByWorktree(worktreeName)
    if (existing.length > 0) {
      p.log.warn(`Server already running for "${worktreeName}" (id ${existing[0].id}, port ${existing[0].port}).`)
      p.log.info(`URL: http://localhost:${existing[0].port}/storyboard/`)
      p.log.info(`Stop it with: storyboard server stop ${existing[0].id}`)
      return
    }
  }

  p.log.step(`Spawning detached dev server for "${worktreeName}"…`)
  const npmBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const child = spawn(npmBin, ['storyboard', 'dev'], {
    cwd: targetCwd,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  })
  child.unref()

  // Poll the registry for up to ~30s waiting for self-registration.
  const start = Date.now()
  let entry = null
  while (Date.now() - start < 30000) {
    await new Promise(r => setTimeout(r, 500))
    const matches = findByWorktree(worktreeName)
    if (matches.length > 0) { entry = matches[matches.length - 1]; break }
  }

  if (entry) {
    p.log.success(`http://localhost:${entry.port}/storyboard/  (id ${entry.id}, pid ${entry.pid})`)
  } else {
    p.log.warn(`Spawned but did not self-register within 30s — check the worktree manually.`)
  }
}

function serverStop(target) {
  if (!target) {
    p.log.error('Usage: storyboard server stop <worktree|id>')
    process.exit(1)
  }
  let entry = findById(target)
  if (!entry) {
    const matches = findByWorktree(target)
    if (matches.length === 0) {
      p.log.error(`No server found for "${target}".`)
      process.exit(1)
    }
    if (matches.length > 1) {
      p.log.error(`Multiple servers running for "${target}":`)
      for (const s of matches) console.log(`  ${s.id}  pid ${s.pid}  port ${s.port}`)
      p.log.info('Specify an id: storyboard server stop <id>')
      process.exit(1)
    }
    entry = matches[0]
  }
  try {
    process.kill(entry.pid, 'SIGTERM')
    p.log.success(`Stopped ${entry.id} (pid ${entry.pid}, worktree "${entry.worktree}")`)
  } catch (err) {
    if (err.code === 'ESRCH') p.log.info(`${entry.id} (pid ${entry.pid}) was already dead.`)
    else p.log.error(`Failed to kill pid ${entry.pid}: ${err.message}`)
  }
  unregister(entry.id)
  releasePort(entry.worktree)
}

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
    default:
      // Treat unknown subcommand as a worktree name to start
      await serverStart(subcommand, flags)
  }
  p.outro('')
}

main().catch((err) => {
  p.log.error(err.message || String(err))
  process.exit(1)
})
