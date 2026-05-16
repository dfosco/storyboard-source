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
import { resolve, join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { detectWorktreeName, getPort, releasePort } from '../worktree/port.js'
import { startRenameWatcher } from '../rename-watcher/watcher.js'
import { compactAll } from '../canvas/compact.js'
import { parseFlags } from './flags.js'
import { setupNeeded, writeUserState, getInstalledStoryboardVersion } from './userState.js'
import { dim, magenta, bold } from './intro.js'

/** Find the mascot directory shipped with the storyboard package. */
function mascotPaths(targetCwd) {
  // Prefer a user override at project root, fall back to the library dir.
  const userConfig = join(targetCwd, 'mascot.config.json')
  const userDir = join(targetCwd, 'mascot')
  if (existsSync(userConfig) && existsSync(userDir)) {
    return { configPath: userConfig, framesDir: userDir }
  }
  // dev.js → src/core/cli/dev.js → package root is 3 dirs up.
  const libRoot = resolve(import.meta.dirname, '..', '..', '..')
  return {
    configPath: join(libRoot, 'mascot.config.json'),
    framesDir: join(libRoot, 'mascot'),
  }
}

/** Apply magenta to the mascot's eye glyphs, dim to the dots/frame. */
function colorizeMascot(text) {
  const eyes = /[●◠◡]/g
  return text
    .split('\n')
    .map((line) => line.replace(eyes, (m) => magenta(m)).replace(/[·│╭╮╰╯─]/g, (m) => dim(m)))
    .join('\n')
}

/**
 * Play the mascot animation in the background (non-blocking).
 * Renders to **stderr** to isolate the cursor-up writes from Vite's
 * stdout — otherwise concurrent Vite output races our redraws and the
 * mascot ends up duplicated at the wrong lines.
 */
function animateMascotAsync({ configPath, framesDir }, urlLine, stopLine) {
  if (!existsSync(configPath)) return false
  let config
  try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch { return false }
  if (config.enabled === false) return false
  const frameNames = Array.isArray(config.frames) ? config.frames : []
  if (frameNames.length === 0) return false
  const frameDurationMs = Number(config.frameDurationMs) || 180
  const loops = Math.max(1, Number(config.loops) || 1)
  const settleName = config.settleFrame || frameNames[frameNames.length - 1]

  let rawFrames
  try {
    rawFrames = frameNames.map((name) => readFileSync(join(framesDir, name), 'utf8'))
  } catch { return false }
  let settleRaw
  try { settleRaw = readFileSync(join(framesDir, settleName), 'utf8') } catch { settleRaw = rawFrames[rawFrames.length - 1] }

  // Strip trailing blank lines so the frame block is tight.
  const trim = (s) => s.replace(/\n+$/, '')
  const normalize = (frames) => {
    const split = frames.map((f) => trim(f).split('\n'))
    const maxLines = Math.max(...split.map((l) => l.length))
    const maxCols = Math.max(...split.flatMap((lines) => lines.map((l) => l.length)))
    return split.map((lines) => {
      while (lines.length < maxLines) lines.push('')
      return lines.map((l) => l.padEnd(maxCols, ' ')).join('\n')
    })
  }
  const normalized = normalize([...rawFrames, settleRaw])
  const loopFrames = normalized.slice(0, -1)
  const settleFrame = normalized[normalized.length - 1]
  const lineCount = normalized[0].split('\n').length

  const composeSettle = (raw) => {
    const lines = colorizeMascot(raw).split('\n')
    if (lines[1] != null) lines[1] = lines[1] + '  ' + urlLine
    if (lines[2] != null) lines[2] = lines[2] + '  ' + stopLine
    return lines.join('\n')
  }

  // Print the settle frame immediately on stderr so the URL is visible
  // without waiting for animation to finish.
  process.stderr.write(composeSettle(settleFrame) + '\n')

  const draw = (frame) => {
    process.stderr.write(`\x1b[${lineCount}A`)
    for (const line of frame.split('\n')) {
      process.stderr.write('\x1b[2K' + line + '\n')
    }
  }

  let loopIdx = 0
  let frameIdx = 0
  const timer = setInterval(() => {
    if (loopIdx >= loops) {
      clearInterval(timer)
      draw(composeSettle(settleFrame))
      return
    }
    draw(colorizeMascot(loopFrames[frameIdx]))
    frameIdx++
    if (frameIdx >= loopFrames.length) { frameIdx = 0; loopIdx++ }
  }, frameDurationMs)
  if (typeof timer.unref === 'function') timer.unref()
  return true
}

const flagSchema = {
  port: { type: 'number', description: 'Override dev server port' },
  'no-buddy': { type: 'boolean', default: false, description: 'Omit the storyboard mascot' },
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

  // Re-run setup automatically if it has never run here, or if the installed
  // @dfosco/storyboard version no longer matches the one setup was last run
  // against. This lets `npm install` upgrades trigger fresh scaffolding
  // without requiring `npx storyboard update`.
  {
    const need = setupNeeded(targetCwd)
    if (need) {
      const why = need.reason === 'first-run'
        ? 'first run in this repo'
        : `version changed ${need.from} → ${need.to}`
      p.log.info(`Running setup (${why})…`)
      await new Promise((resolveSetup) => {
        const setupChild = spawn(
          process.platform === 'win32' ? 'npx.cmd' : 'npx',
          ['storyboard', 'setup', '--skip-branch', '--no-buddy'],
          {
            cwd: targetCwd,
            stdio: 'inherit',
            // Belt-and-suspenders: also pass the env var, since older
            // installed storyboard versions on disk may not know the flag.
            env: { ...process.env, STORYBOARD_NO_BUDDY: '1' },
          }
        )
        setupChild.on('exit', () => resolveSetup())
        setupChild.on('error', () => resolveSetup())
      })
      // Belt-and-suspenders: even if setup failed to write the marker,
      // stamp the current version so dev doesn't loop forever asking to run
      // setup on every boot.
      const version = getInstalledStoryboardVersion(targetCwd)
      if (version) writeUserState({ setupVersion: version, setupRanAt: new Date().toISOString() }, targetCwd)
    }
  }

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

  // Render the storyboard mascot animation just before Vite takes over stdio.
  // Non-blocking: the settle frame + URL render synchronously so the URL is
  // visible immediately, and the animation runs in the background while
  // Vite spins up.
  const showBuddy = !flags['no-buddy'] && process.env.STORYBOARD_NO_BUDDY !== '1'
  console.log()
  const animated = showBuddy && animateMascotAsync(
    mascotPaths(targetCwd),
    bold(`http://localhost:${port}/storyboard/`),
    dim('Stop with Ctrl+C'),
  )
  if (!animated) {
    console.log(`  ${bold(`http://localhost:${port}/storyboard/`)}`)
    console.log(`  ${dim('Stop with Ctrl+C')}`)
  }
  console.log()

  const child = spawn(npmBin, viteArgs, {
    cwd: targetCwd,
    stdio: 'inherit',
    env: { ...process.env, STORYBOARD_WORKTREE: worktreeName },
  })

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
