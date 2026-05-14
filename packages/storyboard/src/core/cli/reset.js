/**
 * storyboard reset — Nuke all dev-environment state to a known-good baseline.
 *
 * Use this when:
 *   - Upgrading from an older Storyboard (pre-runtime, Caddyfile-reload era)
 *   - Recovering from a stuck daemon, orphaned Vite, or shadowed Caddy routes
 *   - You just want a clean slate before bisecting a bug
 *
 * What it does (in order, all best-effort):
 *   1. SIGTERM the runtime daemon and remove ~/.storyboard/runtime.{lock,pid}
 *   2. Kill orphan `vite` processes started outside the runtime
 *   3. POST `/load` to Caddy with an empty config (clears all routes)
 *   4. Spawn a fresh runtime daemon
 *   5. Verify it's healthy
 *
 * It does NOT touch:
 *   - node_modules (run `npm install` separately)
 *   - storyboard.config.json
 *   - .storyboard/ canvas state in your repo
 */

import * as p from '@clack/prompts'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

p.intro('storyboard reset')

const HOME = process.env.HOME || ''
const LOCK = resolve(HOME, '.storyboard', 'runtime.lock')
const PID = resolve(HOME, '.storyboard', 'runtime.pid')
const VERSION_WARNED = resolve(HOME, '.storyboard', 'runtime.version-warned')

// 1. Kill the runtime daemon.
{
  const s = p.spinner()
  s.start('Stopping runtime daemon')
  if (existsSync(PID)) {
    try {
      const pid = Number(readFileSync(PID, 'utf8').trim())
      if (Number.isFinite(pid) && pid > 0) {
        try { process.kill(pid, 'SIGTERM') } catch { /* already dead */ }
      }
    } catch { /* corrupt pidfile */ }
  }
  // Always clear the lock/pid files so a fresh daemon can claim them.
  try { unlinkSync(LOCK) } catch { /* not present */ }
  try { unlinkSync(PID) } catch { /* not present */ }
  try { unlinkSync(VERSION_WARNED) } catch { /* not present */ }
  s.stop('Runtime daemon stopped')
}

// 2. Kill orphan vite processes (started outside the runtime).
//    These are leftovers from pre-runtime versions (`sb dev` legacy path) or
//    crashed daemons. We match by command line to avoid touching anything else.
{
  const s = p.spinner()
  s.start('Cleaning orphan Vite processes')
  let killed = 0
  try {
    // BSD ps (macOS): `-o pid=,command=` gives PID + full cmdline.
    const out = execSync('ps -A -o pid=,command=', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    for (const line of out.split('\n')) {
      const m = line.match(/^\s*(\d+)\s+(.+)$/)
      if (!m) continue
      const [, pidStr, cmd] = m
      // node ... vite ... — the runtime spawns these via the wrapper config;
      // anything else is an orphan from a previous era.
      if (!/\bvite\b/.test(cmd)) continue
      if (/storyboard-runtime\.js/.test(cmd)) continue  // the daemon itself; already SIGTERMed above
      const pid = Number(pidStr)
      if (!Number.isFinite(pid) || pid <= 0) continue
      try { process.kill(pid, 'SIGTERM'); killed++ } catch { /* already dead or not ours */ }
    }
  } catch { /* `ps` failed; skip */ }
  s.stop(killed > 0 ? `Stopped ${killed} orphan Vite process(es)` : 'No orphan Vite processes found')
}

// 3. Reset Caddy's route table by POSTing an empty config.
//    Goes through the admin API directly — simpler than spinning up the
//    runtime client just for this.
{
  const s = p.spinner()
  s.start('Clearing Caddy routes')
  try {
    const empty = JSON.stringify({
      apps: { http: { servers: { srv0: { listen: [':80'], routes: [] } } } },
    })
    execSync(
      `curl -fsS -H 'Origin: http://localhost:2019' -H 'Content-Type: application/json' -X POST http://localhost:2019/load -d '${empty}'`,
      { stdio: 'ignore', timeout: 5000 },
    )
    s.stop('Caddy routes cleared')
  } catch {
    s.stop('Caddy not reachable (skipped)')
  }
}

// 4. Wait for the OS to release port 4321 before respawning.
await new Promise(r => setTimeout(r, 250))

// 5. Spawn a fresh runtime daemon via the client (auto-spawn on health()).
{
  const s = p.spinner()
  s.start('Starting fresh runtime daemon')
  try {
    const { RuntimeClient } = await import('../../../dist/runtime/client/index.js')
    const runtime = new RuntimeClient()
    const health = await runtime.health()
    s.stop(`Runtime ready (v${health.version}, port ${health.port})`)
  } catch (err) {
    s.stop('Failed to start runtime')
    p.log.error(err.message || String(err))
    process.exit(1)
  }
}

p.log.success('Reset complete. Run `npx storyboard run` to start your dev server.')
p.outro('')
