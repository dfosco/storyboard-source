import { homedir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Runtime constants — single source of truth for ports, paths, and version.
 *
 * The runtime port (`4321`) is intentionally fixed: a single global daemon
 * needs a well-known address so the CLI client can find it without
 * configuration. Port 4321 is RFC-allowed and avoids collisions with
 * Vite (1234), Caddy admin (2019), and the per-repo legacy server (4100-4199).
 */
export const RUNTIME_PORT = 4321 as const
export const RUNTIME_HOST = '127.0.0.1' as const

/** Where the daemon writes its pidfile and lockfile. */
export const RUNTIME_HOME = join(homedir(), '.storyboard')
export const PIDFILE = join(RUNTIME_HOME, 'runtime.pid')
export const LOCKFILE = join(RUNTIME_HOME, 'runtime.lock')
export const STATEFILE = join(RUNTIME_HOME, 'runtime.state.json')

/**
 * Range of TCP ports the runtime leases to Vite devservers. Picked to sit
 * above Vite's default (1234) and below ephemeral-port territory.
 */
export const DEVSERVER_PORT_MIN = 1240 as const
export const DEVSERVER_PORT_MAX = 1399 as const

/** Caddy admin API endpoint. The runtime is the SOLE writer to this URL. */
export const CADDY_ADMIN = 'http://localhost:2019' as const

// Runtime version is read from the package.json at startup so it tracks
// the published @dfosco/storyboard version. Falls back to "0.0.0" if the
// file can't be located (e.g. dev script runs from a non-standard layout).
function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    // Bundled to dist/runtime/server/main.js → ../../../package.json
    const candidates = [
      resolve(here, '..', '..', '..', 'package.json'),
      resolve(here, '..', '..', 'package.json'),
    ]
    for (const p of candidates) {
      if (existsSync(p)) {
        const pkg = JSON.parse(readFileSync(p, 'utf8')) as { version?: string }
        if (typeof pkg.version === 'string' && pkg.version) return pkg.version
      }
    }
  } catch { /* fallthrough */ }
  return '0.0.0'
}

export const RUNTIME_VERSION = readPackageVersion()
