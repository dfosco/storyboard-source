import { z } from 'zod'
import { DevDomain, DevServerSlot, Port, WorktreeName } from './identity.js'

/**
 * DevServer lifecycle FSM.
 *
 * ```
 *   spawning → ready → stopped
 *      └────────────────┘  (on crash)
 * ```
 */
export const DevServerStatus = z.enum([
  'spawning',  // process started, waiting for `ready in …` from Vite stdout
  'ready',     // bound to a slot, accepting traffic via Caddy
  'stopped',   // process exited, slot freed, port returned to the pool
])
export type DevServerStatus = z.infer<typeof DevServerStatus>

/** Allowed FSM transitions. Centralised so misuse is a one-line review catch. */
export const ALLOWED_TRANSITIONS: Record<DevServerStatus, readonly DevServerStatus[]> = {
  spawning: ['ready', 'stopped'],
  ready: ['stopped'],
  stopped: [],
} as const

export class IllegalTransitionError extends Error {
  constructor(from: DevServerStatus, to: DevServerStatus) {
    super(`Illegal devserver transition: ${from} → ${to}`)
    this.name = 'IllegalTransitionError'
  }
}

export function assertTransition(from: DevServerStatus, to: DevServerStatus): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new IllegalTransitionError(from, to)
  }
}

/**
 * A devserver record as exposed by the runtime API. Always bound to a slot
 * after acquire (no pre-spawned pool members), so `slot` and `cwd` are required.
 */
export const DevServer = z.object({
  id: z.string().uuid(),
  pid: z.number().int().positive(),
  port: Port,
  status: DevServerStatus,
  slot: DevServerSlot,
  /** Absolute path of the worktree directory. */
  cwd: z.string(),
  /** ISO timestamp; immutable after spawn. */
  spawnedAt: z.string().datetime(),
  /** ISO timestamp of last status change. */
  updatedAt: z.string().datetime(),
})
export type DevServer = z.infer<typeof DevServer>

/**
 * A lease handed to a CLI client when it acquires a devserver.
 *
 * Leases are the *only* way a client controls a devserver — the runtime
 * refuses commands without a valid leaseId. They live as long as the
 * acquiring CLI process; expiry is a far-future sentinel.
 */
export const Lease = z.object({
  id: z.string().uuid(),
  devServerId: z.string().uuid(),
  slot: DevServerSlot,
  /** Public proxy URL the client should print to the user. Authoritative. */
  url: z.string().url(),
  /** Far-future sentinel — leases don't actually expire. */
  expiresAt: z.string().datetime(),
})
export type Lease = z.infer<typeof Lease>

/**
 * A Caddy proxy route owned by the runtime. The `@id` is always the devDomain;
 * this lets the runtime PATCH a single route in place without touching others.
 *
 * `upstreams` is keyed by plain string (validated elsewhere as WorktreeName)
 * to avoid `Partial<Record<branded, …>>` shenanigans at the value-spread sites.
 */
export const ProxyRoute = z.object({
  devDomain: DevDomain,
  host: z.string(),
  /** worktree name → upstream port. `main` is the host's catch-all. */
  upstreams: z.record(z.string(), Port),
})
export type ProxyRoute = z.infer<typeof ProxyRoute>
