/**
 * Resolve the dev server URL for the current worktree.
 *
 * Checks the Caddy admin API first to find the actual port mapped to
 * this branch's route, since ports.json can drift from the running
 * dev server. Falls back to ports.json if Caddy isn't reachable.
 */

import { detectWorktreeName, resolveRunningPort } from '../worktree/port.js'
import { readDevDomain } from './proxy.js'
import { execSync } from 'child_process'

export function getServerUrl() {
  // Prefer explicit env var (set by terminal agent sessions)
  if (process.env.STORYBOARD_SERVER_URL) {
    return process.env.STORYBOARD_SERVER_URL.replace(/\/$/, '')
  }

  const name = detectWorktreeName()

  // Try Caddy admin API for the real port
  try {
    const raw = execSync(
      'curl -sf http://localhost:2019/config/apps/http/servers/srv0/routes',
      { encoding: 'utf8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const routes = JSON.parse(raw)
    const domain = readDevDomain()

    for (const route of routes) {
      const hosts = route.match?.[0]?.host || []
      if (!hosts.includes(domain)) continue
      const subroutes = route.handle?.[0]?.routes || []

      if (name === 'main') {
        // Main is the fallback route (no match path)
        const fallback = subroutes.find(r => !r.match)
        if (fallback) {
          const dial = fallback.handle?.[0]?.upstreams?.[0]?.dial
          if (dial) return `http://${dial}`
        }
      } else {
        // Branch route matches /branch--<name>/*
        const branchRoute = subroutes.find(r => {
          const paths = r.match?.[0]?.path || []
          return paths.some(p => p === `/branch--${name}/*`)
        })
        if (branchRoute) {
          const dial = branchRoute.handle?.[0]?.upstreams?.[0]?.dial
          if (dial) return `http://${dial}`
        }
      }
    }
  } catch {
    // Caddy not running or not reachable — fall through
  }

  // Fallback to server registry / ports.json
  const port = resolveRunningPort(name)
  return `http://localhost:${port}`
}
