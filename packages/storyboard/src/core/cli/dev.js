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
 * Render the mascot statically (no animation) at the current cursor position.
 * Returns true on success, false if config/frames are missing or disabled.
 *
 * We render statically because once Vite's "ready in" line lands below the
 * mascot, any subsequent animation redraw via cursor-up writes to the wrong
 * lines — animation requires owning the cursor exclusively. The frame files
 * + config remain editable; only the settle frame is shown.
 */
function renderMascot({ configPath, framesDir }, urlLine, stopLine) {
  if (!existsSync(configPath)) return false
  let config
  try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch { return false }
  if (config.enabled === false) return false
  const frameNames = Array.isArray(config.frames) ? config.frames : []
  if (frameNames.length === 0) return false
  const settleName = config.settleFrame || frameNames[frameNames.length - 1]

  let settleRaw
  try { settleRaw = readFileSync(join(framesDir, settleName), 'utf8') } catch { return false }

  const lines = colorizeMascot(settleRaw.replace(/\n+$/, '')).split('\n')
  if (lines[1] != null) lines[1] = lines[1] + '  ' + urlLine
  if (lines[2] != null) lines[2] = lines[2] + '  ' + stopLine
  process.stdout.write(lines.join('\n') + '\n')
  return true
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
    env: { ...process.env, STORYBOARD_WORKTREE: worktreeName },
  })

  if (!verbose) {
    let mascotShown = false
    const renderOnce = () => {
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
      console.log()
    }

    // Buffer per-stream so we can split on newlines and look for the
    // "ready in" signal. Once seen, we render the mascot and then pass
    // everything through unchanged.
    const makeFilter = (sink) => {
      let buf = ''
      return (chunk) => {
        buf += chunk.toString()
        const lines = buf.split('\n')
        buf = lines.pop() // keep trailing partial line
        for (const line of lines) {
          if (mascotShown) {
            sink.write(line + '\n')
            continue
          }
          // Vite prints something like "  ➜  ready in 412 ms" or
          // "  VITE v7.3.1  ready in 2390 ms". Match on the literal phrase.
          if (/ready in \d/.test(line)) {
            renderOnce()
            sink.write(line + '\n')
          }
          // else: swallow pre-ready chatter
        }
      }
    }
    child.stdout?.on('data', makeFilter(process.stdout))
    child.stderr?.on('data', makeFilter(process.stderr))
    // Safety net: if Vite never prints "ready in" within 8s, render anyway
    // so the user isn't left staring at a blank screen.
    setTimeout(renderOnce, 8000).unref?.()
  }

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
