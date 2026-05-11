/**
 * storyboard proxy — manage the Caddy reverse proxy via the Storyboard Runtime.
 *
 * Replaces the legacy direct-Caddyfile path (kept at proxy.legacy.js for
 * reference). Mutations go through the runtime daemon, which is the SOLE
 * writer to localhost:2019 — eliminating the destructive cross-repo
 * `caddy reload` race that was hypothesis H2 in the server-state RCA.
 *
 * Usage:
 *   storyboard proxy [start]   Bring runtime daemon up + ensure Caddy is reachable
 *   storyboard proxy state     Print runtime's view of routes
 *   storyboard proxy close     Stop runtime daemon
 */

import * as p from '@clack/prompts'
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { homedir, tmpdir } from 'os'
import { join } from 'path'

const PIDFILE = join(homedir(), '.storyboard', 'runtime.pid')

function isCaddyInstalled() {
  try { execSync('caddy version', { stdio: 'ignore' }); return true } catch { return false }
}
function isCaddyRunning() {
  try { execSync('curl -sf http://localhost:2019/config/ >/dev/null 2>&1', { timeout: 2000 }); return true } catch { return false }
}
function startCaddyEmpty() {
  // Caddy v2.11+ corrupts stdin reads on `--config -`, producing a garbled
  // "subject does not qualify for certificate" error. Workaround: write
  // the Caddyfile to a temp file and pass the path.
  // Also: `caddy start` double-forks but the daemon inherits our stdio fds.
  // We must ignore all stdio so execSync returns as soon as the parent
  // exits — otherwise it hangs until the timeout.
  let tmpDir
  try {
    tmpDir = mkdtempSync(join(tmpdir(), 'storyboard-caddy-'))
    const caddyfilePath = join(tmpDir, 'Caddyfile')
    writeFileSync(caddyfilePath, 'http://storyboard.localhost {\n}\n', 'utf8')
    execSync(`caddy start --config "${caddyfilePath}" --adapter caddyfile`, {
      stdio: 'ignore',
      timeout: 5000,
    })
    return { ok: true }
  } catch (err) {
    // execSync rolls multiple failure modes (non-zero exit, timeout, signal)
    // into a thrown error. Verify the daemon is actually up before reporting.
    if (isCaddyRunning()) return { ok: true }
    const stderr = err.stderr?.toString?.() || err.message || String(err)
    return { ok: false, error: stderr }
  } finally {
    if (tmpDir) {
      try { unlinkSync(join(tmpDir, 'Caddyfile')) } catch { /* */ }
    }
  }
}

async function main() {
  const subcommand = process.argv[3] || 'start'

  if (subcommand === 'close' || subcommand === 'stop') {
    p.intro('storyboard proxy close')
    if (existsSync(PIDFILE)) {
      try {
        const pid = Number(readFileSync(PIDFILE, 'utf8').trim())
        if (Number.isFinite(pid) && pid > 0) {
          try { process.kill(pid, 'SIGTERM') } catch { /* dead */ }
        }
      } catch { /* */ }
    }
    if (isCaddyRunning()) {
      try { execSync('curl -sf -X POST http://localhost:2019/stop', { timeout: 5000, stdio: 'ignore' }) } catch { /* */ }
      p.log.success('Caddy stopped.')
    }
    p.log.success('Runtime daemon stopped.')
    p.outro('')
    return
  }

  if (subcommand === 'restart') {
    p.intro('storyboard proxy restart')
    // Stop the daemon (Caddy keeps running; only the runtime is restarted).
    if (existsSync(PIDFILE)) {
      try {
        const pid = Number(readFileSync(PIDFILE, 'utf8').trim())
        if (Number.isFinite(pid) && pid > 0) {
          try { process.kill(pid, 'SIGTERM') } catch { /* dead */ }
        }
      } catch { /* */ }
      p.log.success('Stopped runtime daemon.')
    } else {
      p.log.info('Runtime daemon was not running.')
    }
    // Spawn a fresh daemon by hitting the runtime client (auto-spawns on first request).
    const { RuntimeClient } = await import('../../../dist/runtime/client/index.js')
    const runtime = new RuntimeClient()
    const s = p.spinner()
    s.start('Starting fresh runtime')
    try {
      const health = await runtime.health()
      s.stop(`Runtime ready (v${health.version}, port ${health.port})`)
    } catch (err) {
      s.stop('Failed')
      p.log.error(err.message || String(err))
      process.exit(1)
    }
    p.outro('')
    return
  }

  if (subcommand === 'state') {
    p.intro('storyboard proxy state')
    const { RuntimeClient } = await import('../../../dist/runtime/client/index.js')
    const runtime = new RuntimeClient()
    try {
      const state = await runtime.proxyState()
      p.log.info(`Caddy reachable: ${state.caddyReachable}`)
      for (const r of state.routes) {
        p.log.info(`${r.devDomain}.localhost: ${JSON.stringify(r.upstreams)}`)
      }
    } catch (err) {
      p.log.error(err.message || String(err))
      process.exit(1)
    }
    p.outro('')
    return
  }

  p.intro('storyboard proxy start')
  if (!isCaddyInstalled()) {
    p.log.error('Caddy is not installed. Run: brew install caddy')
    process.exit(1)
  }
  if (!isCaddyRunning()) {
    const s = p.spinner()
    s.start('Starting Caddy')
    const result = startCaddyEmpty()
    if (!result.ok) {
      s.stop('Failed')
      p.log.error('Could not start Caddy.')
      if (result.error) {
        const trimmed = result.error.trim().split('\n').slice(-5).join('\n')
        p.log.message(trimmed)
      }
      process.exit(1)
    }
    s.stop('Caddy started')
  }

  // Booting the runtime client triggers an on-demand fork of the daemon if
  // it isn't already running.
  const { RuntimeClient } = await import('../../../dist/runtime/client/index.js')
  const runtime = new RuntimeClient()
  const s = p.spinner()
  s.start('Starting Storyboard Runtime')
  try {
    const health = await runtime.health()
    s.stop(`Runtime ready (v${health.version}, port ${health.port})`)
  } catch (err) {
    s.stop('Failed')
    p.log.error(err.message || String(err))
    process.exit(1)
  }
  p.outro('Proxy + runtime ready')
}

main().catch((err) => {
  p.log.error(err.message || String(err))
  process.exit(1)
})

// ── Compatibility re-exports ──
// The old proxy.js was imported by setup.js, dev.legacy.js, and
// packages/storyboard/src/core/server/. We preserve named exports so
// callers don't blow up; the implementations are deprecation shims.

export { isCaddyInstalled, isCaddyRunning }

export function readDevDomain(cwd) {
  try {
    const cfg = JSON.parse(readFileSync(join(cwd || process.cwd(), 'storyboard.config.json'), 'utf8'))
    return `${cfg.devDomain || 'storyboard'}.localhost`
  } catch {
    return 'storyboard.localhost'
  }
}

export function generateCaddyfile() {
  // eslint-disable-next-line no-console
  console.warn('[storyboard] generateCaddyfile() is deprecated — runtime owns Caddy now.')
  return null
}
export function generateRouteConfig() {
  // eslint-disable-next-line no-console
  console.warn('[storyboard] generateRouteConfig() is deprecated.')
  return null
}
export function upsertCaddyRoute() {
  // eslint-disable-next-line no-console
  console.warn('[storyboard] upsertCaddyRoute() is deprecated — call RuntimeClient.proxyUpsert() instead.')
  return false
}
export function reloadCaddy() {
  // eslint-disable-next-line no-console
  console.warn('[storyboard] reloadCaddy() is deprecated — runtime keeps Caddy in sync via admin API.')
  return false
}
export function startCaddy() { return startCaddyEmpty().ok }
export function stopCaddy() {
  try { execSync('curl -sf -X POST http://localhost:2019/stop', { timeout: 5000, stdio: 'ignore' }); return true }
  catch { return false }
}
export function findStaleRouteIndices(routes, keepId, host) {
  const indices = []
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    if (route['@id'] === keepId) continue
    if (route['@id']) continue
    const routeHosts = route.match?.[0]?.host || []
    if (routeHosts.includes(host)) indices.push(i)
  }
  return indices.reverse()
}
