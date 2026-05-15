/**
 * storyboard dev — start a Vite dev server for the current worktree.
 *
 * One Vite per worktree, on its own port, no proxy, no daemon. The
 * `/_storyboard/*` API endpoints are mounted by `core/vite/server-plugin`
 * as Vite middleware, so a single child process owns everything.
 *
 * Usage:
 *   storyboard dev          # start in current cwd
 *   storyboard dev --port=N # override port
 *
 * To switch worktrees, use `storyboard branch <name>` then run `storyboard dev`
 * from the new worktree.
 */

import * as p from '@clack/prompts'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { detectWorktreeName, getPort, releasePort } from '../worktree/port.js'
import { startRenameWatcher } from '../rename-watcher/watcher.js'
import { compactAll } from '../canvas/compact.js'
import { parseFlags } from './flags.js'

const flagSchema = {
  port: { type: 'number', description: 'Override dev server port' },
}

/** Read the fixed port from storyboard.config.json, if any. */
function readConfiguredPort(cwd) {
  const file = resolve(cwd, 'storyboard.config.json')
  if (!existsSync(file)) return null
  try {
    const cfg = JSON.parse(readFileSync(file, 'utf8'))
    const n = Number(cfg.port)
    return Number.isInteger(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

async function main() {
  const { flags } = parseFlags(process.argv.slice(3), flagSchema)
  const worktreeName = detectWorktreeName()
  const targetCwd = resolve(process.cwd())

  // Port resolution priority:
  //   1. --port CLI flag (always wins, never strict)
  //   2. config.port from storyboard.config.json (strict — fail if taken)
  //   3. auto-assigned per-worktree port (non-strict — Vite picks next free)
  const configuredPort = readConfiguredPort(targetCwd)
  const strictPort = flags.port == null && configuredPort != null
  const port = flags.port || configuredPort || getPort(worktreeName)

  p.intro('storyboard dev')
  p.log.info(`worktree: ${worktreeName}`)

  // Compact bloated canvas JSONL files before booting Vite.
  const compacted = compactAll(targetCwd)
  for (const r of compacted) {
    p.log.info(`[compact] ${r.name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`)
  }

  const renameWatcher = startRenameWatcher(targetCwd)
  const compactInterval = setInterval(() => {
    try {
      const r = compactAll(targetCwd)
      for (const x of r) p.log.info(`[compact] ${x.name}: ${(x.before / 1024).toFixed(0)}KB → ${(x.after / 1024).toFixed(0)}KB`)
    } catch { /* non-critical */ }
  }, 15 * 60 * 1000)

  const npmBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  // Without --strictPort: if the requested port is taken, Vite picks the next
  // free one. The server-plugin captures the actual port via
  // server.httpServer.address() and self-registers in .storyboard/servers.json.
  // With --strictPort (config.port is set): Vite exits if the port is taken,
  // honoring the user's intent that this instance owns that exact port.
  const viteArgs = ['vite', '--port', String(port)]
  if (strictPort) viteArgs.push('--strictPort')
  if (strictPort) p.log.info(`port ${port} (strict — from storyboard.config.json)`)
  const child = spawn(npmBin, viteArgs, {
    cwd: targetCwd,
    stdio: 'inherit',
    env: { ...process.env, STORYBOARD_WORKTREE: worktreeName },
  })

  p.log.success(`http://localhost:${port}/storyboard/`)
  p.log.info('Stop with Ctrl+C')

  function shutdown() {
    clearInterval(compactInterval)
    renameWatcher.close()
    try { child.kill('SIGTERM') } catch { /* already dead */ }
    releasePort(worktreeName)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  child.on('exit', (code) => {
    clearInterval(compactInterval)
    renameWatcher.close()
    releasePort(worktreeName)
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  p.log.error(err.message || String(err))
  process.exit(1)
})
