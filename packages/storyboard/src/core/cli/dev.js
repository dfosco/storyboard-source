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
 * Render the mascot with an in-place loop animation, then settle on the
 * configured final frame with the URL beside it.
 *
 * Called AFTER Vite prints "ready in Xms" and the storyboard-server plugin
 * has suppressed Vite's own URL block. From this moment, Vite is in idle
 * watch mode and won't print again unless code changes — so our cursor-up
 * redraws can safely own the bottom of the screen.
 */
function renderMascot({ configPath, framesDir }, urlLine, stopLine) {
  if (!existsSync(configPath)) return false
  let config
  try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch { return false }
  if (config.enabled === false) return false
  const rawEntries = Array.isArray(config.frames) ? config.frames : []
  if (rawEntries.length === 0) return false
  const defaultDuration = Number(config.frameDurationMs) || 180
  const loops = Math.max(1, Number(config.loops) || 1)

  // Each entry is either a string filename or a [filename, delayMs] tuple.
  // Per-frame delay falls back to frameDurationMs when missing.
  const entries = rawEntries.map((e) => {
    if (Array.isArray(e)) return { name: String(e[0]), delay: Number(e[1]) || defaultDuration }
    return { name: String(e), delay: defaultDuration }
  })
  const settleName = config.settleFrame || entries[entries.length - 1].name

  let rawFrames
  try { rawFrames = entries.map((e) => readFileSync(join(framesDir, e.name), 'utf8')) } catch { return false }
  let settleRaw
  try { settleRaw = readFileSync(join(framesDir, settleName), 'utf8') } catch { settleRaw = rawFrames[rawFrames.length - 1] }

  // Pad every frame to the same height/width so cursor-up redraws fully
  // overwrite the previous frame.
  const trim = (s) => s.replace(/\n+$/, '')
  const split = [...rawFrames, settleRaw].map((f) => trim(f).split('\n'))
  const maxLines = Math.max(...split.map((l) => l.length))
  const maxCols = Math.max(...split.flatMap((lines) => lines.map((l) => l.length)))
  const normalized = split.map((lines) => {
    while (lines.length < maxLines) lines.push('')
    return lines.map((l) => l.padEnd(maxCols, ' ')).join('\n')
  })
  const loopFrames = normalized.slice(0, -1)
  const settleFrame = normalized[normalized.length - 1]
  const lineCount = maxLines

  const composeSettle = () => {
    const lines = colorizeMascot(settleFrame).split('\n')
    if (lines[1] != null) lines[1] = lines[1] + '  ' + urlLine
    if (lines[2] != null) lines[2] = lines[2] + '  ' + stopLine
    return lines.join('\n')
  }

  if (!process.stdout.isTTY) {
    process.stdout.write(composeSettle() + '\n')
    return true
  }

  // Reserve vertical space with blank lines so cursor-up redraws have a
  // stable region to overwrite.
  process.stdout.write('\n'.repeat(lineCount))
  const draw = (frame) => {
    process.stdout.write(`\x1b[${lineCount}A`)
    for (const line of frame.split('\n')) {
      process.stdout.write('\x1b[2K' + line + '\n')
    }
  }

  return new Promise((resolveAnim) => {
    let loopIdx = 0
    let frameIdx = 0
    // Recursive setTimeout so each frame can have its own delay.
    const step = () => {
      if (loopIdx >= loops) {
        draw(composeSettle())
        resolveAnim(true)
        return
      }
      draw(colorizeMascot(loopFrames[frameIdx]))
      const thisDelay = entries[frameIdx].delay
      frameIdx++
      if (frameIdx >= loopFrames.length) { frameIdx = 0; loopIdx++ }
      const t = setTimeout(step, thisDelay)
      if (typeof t.unref === 'function') t.unref()
    }
    step()
  })
}

const flagSchema = {
  port: { type: 'number', description: 'Override dev server port' },
  'no-buddy': { type: 'boolean', default: false, description: 'Omit the storyboard mascot' },
  verbose: { type: 'boolean', default: false, description: 'Show full setup/Vite output' },
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

  const verbose = flags.verbose

  // Quiet header: just `worktree: …` and `port: …`. Everything else
  // (setup logs, compaction, "strict from storyboard.config.json",
  // intro/outro frames) is hidden unless --verbose.
  if (verbose) {
    p.intro('storyboard dev')
    p.log.info(`worktree: ${worktreeName}`)
  } else {
    console.log(`  ${dim('worktree:')} ${bold(worktreeName)}`)
  }

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
      if (verbose) p.log.info(`Running setup (${why})…`)
      await new Promise((resolveSetup) => {
        const setupChild = spawn(
          process.platform === 'win32' ? 'npx.cmd' : 'npx',
          ['storyboard', 'setup', '--skip-branch', '--no-buddy'],
          {
            cwd: targetCwd,
            // In quiet mode swallow the spawned-setup output; verbose passes through.
            stdio: verbose ? 'inherit' : 'ignore',
            env: { ...process.env, STORYBOARD_NO_BUDDY: '1' },
          }
        )
        setupChild.on('exit', () => resolveSetup())
        setupChild.on('error', () => resolveSetup())
      })
      const version = getInstalledStoryboardVersion(targetCwd)
      if (version) writeUserState({ setupVersion: version, setupRanAt: new Date().toISOString() }, targetCwd)
    }
  }

  // Compact bloated canvas JSONL files before booting Vite.
  const compacted = compactAll(targetCwd)
  if (verbose) {
    for (const r of compacted) {
      p.log.info(`[compact] ${r.name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`)
    }
  }

  const renameWatcher = startRenameWatcher(targetCwd)
  const compactInterval = setInterval(() => {
    try {
      const r = compactAll(targetCwd)
      if (verbose) {
        for (const x of r) p.log.info(`[compact] ${x.name}: ${(x.before / 1024).toFixed(0)}KB → ${(x.after / 1024).toFixed(0)}KB`)
      }
    } catch { /* non-critical */ }
  }, 15 * 60 * 1000)

  const npmBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const viteArgs = ['vite', '--port', String(port)]
  if (strictPort) viteArgs.push('--strictPort')
  if (verbose) {
    console.log(`  ${dim('port:')} ${bold(port)} ${strictPort ? dim('(strict — from storyboard.config.json)') : ''}`)
  } else {
    console.log(`  ${dim('port:')} ${bold(port)}`)
  }

  const showBuddy = !flags['no-buddy'] && process.env.STORYBOARD_NO_BUDDY !== '1'

  // Spawn Vite with piped stdio so we can:
  //   - In quiet mode: suppress noisy plugin chatter ([storyboard]/[generouted]/etc)
  //     until Vite prints "ready in", then render the mascot + URL, then
  //     stream the rest through unchanged.
  //   - In verbose mode: stream everything through unchanged from the start.
  const child = spawn(npmBin, viteArgs, {
    cwd: targetCwd,
    stdio: verbose ? 'inherit' : ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      STORYBOARD_WORKTREE: worktreeName,
      // Tells the storyboard-server vite plugin to suppress its default
      // "➜ Local:" URL block — we render our own URL beside the mascot.
      ...(verbose ? {} : { STORYBOARD_QUIET_VITE: '1' }),
    },
  })

  if (!verbose) {
    let mascotShown = false
    let mascotDone = false
    const queued = [] // [sink, line] pairs queued during animation
    const flushQueue = () => {
      while (queued.length) {
        const [s, l] = queued.shift()
        s.write(l + '\n')
      }
    }
    const renderOnce = async () => {
      if (mascotShown) return
      mascotShown = true
      console.log()
      const animated = showBuddy && renderMascot(
        mascotPaths(targetCwd),
        bold(`http://localhost:${port}/storyboard/`),
        dim('Stop with Ctrl+C'),
      )
      if (!animated) {
        console.log(`  ${bold(`http://localhost:${port}/storyboard/`)}`)
        console.log(`  ${dim('Stop with Ctrl+C')}`)
      }
      // Wait for animation to settle, then flush anything Vite emitted
      // during the animation window so it doesn't shift the cursor mid-frame.
      const isPromise = animated && typeof animated.then === 'function'
      if (isPromise) await animated
      mascotDone = true
      console.log()
      flushQueue()
    }

    const makeFilter = (sink) => {
      let buf = ''
      return (chunk) => {
        buf += chunk.toString()
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (mascotDone) {
            sink.write(line + '\n')
            continue
          }
          if (mascotShown) {
            // Animation in flight — buffer subsequent Vite output so it
            // can't shift our cursor mid-redraw.
            queued.push([sink, line])
            continue
          }
          // Pre-ready: only let the "ready in" line through, then start
          // the mascot animation.
          if (/ready in \d/.test(line)) {
            sink.write(line + '\n')
            renderOnce()
          }
          // else: swallow pre-ready chatter
        }
      }
    }
    child.stdout?.on('data', makeFilter(process.stdout))
    child.stderr?.on('data', makeFilter(process.stderr))
    // Safety net: if Vite never prints "ready in" within 8s, render anyway.
    setTimeout(() => { renderOnce() }, 8000).unref?.()
  }

  let shuttingDown = false
  function shutdown() {
    if (shuttingDown) {
      // Second Ctrl+C → hard exit, kill child with SIGKILL.
      try { child.kill('SIGKILL') } catch { /* empty */ }
      process.exit(130)
    }
    shuttingDown = true
    clearInterval(compactInterval)
    renameWatcher.close()
    // Suppress Vite's shutdown-time esbuild noise ("Pre-transform error:
    // The service was stopped" for every in-flight transform) AND the
    // orphan-archive log spam from the storyboard-server plugin teardown.
    try { child.stdout?.removeAllListeners('data') } catch { /* empty */ }
    try { child.stderr?.removeAllListeners('data') } catch { /* empty */ }
    try { child.stdout?.destroy() } catch { /* empty */ }
    try { child.stderr?.destroy() } catch { /* empty */ }
    // SIGINT first (clean esbuild shutdown), then SIGTERM after 2s if
    // Vite is still alive (handles plugins that loop on session teardown),
    // then SIGKILL after 5s as last resort.
    try { child.kill('SIGINT') } catch { /* already dead */ }
    const term = setTimeout(() => { try { child.kill('SIGTERM') } catch { /* empty */ } }, 2000)
    const kill = setTimeout(() => { try { child.kill('SIGKILL') } catch { /* empty */ } }, 5000)
    term.unref?.(); kill.unref?.()
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
