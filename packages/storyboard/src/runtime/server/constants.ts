import { homedir } from 'node:os'
import { join } from 'node:path'

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

export const RUNTIME_VERSION = '0.0.0' as const
