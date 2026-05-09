import { z } from 'zod'
import { DevDomain, DevServerSlot, Port, WorktreeName } from './identity.js'

/**
 * DevServer lifecycle FSM.
 *
 * Transitions are enforced in code; illegal transitions throw. This is the
 * structural fix for the per-repo server's "best-effort" state — a devserver
 * that thinks it's `ready` but whose port is dead cannot exist here.
 *
 * ```
 *   idle → spawning → ready → draining → stopped
 *            │           │        │
 *            └───────────┴────────┴──────→ stopped (on crash)
 * ```
 */
export const DevServerStatus = z.enum([
  'idle',      // pre-warmed in the hot pool, no project bound yet
  'spawning',  // process started, waiting for `ready in …` from Vite stdout
  'ready',     // bound to a slot, accepting traffic via Caddy
  'draining',  // releasing — finishing in-flight requests before kill
  'stopped',   // process exited, slot freed, port returned to the pool
])
export type DevServerStatus = z.infer<typeof DevServerStatus>

/** Allowed FSM transitions. Centralised so misuse is a one-line review catch. */
export const ALLOWED_TRANSITIONS: Record<DevServerStatus, readonly DevServerStatus[]> = {
  idle: ['spawning', 'stopped'],
  spawning: ['ready', 'stopped'],
  ready: ['draining', 'stopped'],
  draining: ['stopped'],
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
 * A devserver record as exposed by the runtime API.
 *
 * `slot` is `null` for hot-pool members that haven't been acquired yet.
 * Once bound, `slot.devDomain + slot.worktree` is unique across the whole
 * runtime; the orchestrator rejects duplicate binds.
 */
export const DevServer = z.object({
  id: z.string().uuid(),
  pid: z.number().int().positive(),
  port: Port,
  status: DevServerStatus,
  slot: DevServerSlot.nullable(),
  /** Absolute path of the worktree directory once bound; null while in the pool. */
  cwd: z.string().nullable(),
  /** ISO timestamp; immutable after spawn. */
  spawnedAt: z.string().datetime(),
  /** ISO timestamp of last status change. */
  updatedAt: z.string().datetime(),
})
export type DevServer = z.infer<typeof DevServer>

/**
 * A short-lived lease handed to a CLI client when it acquires a devserver.
 *
 * Leases are the *only* way a client controls a devserver — the runtime
 * refuses commands without a valid leaseId. This means a stale `sb dev`
 * process can't kill a devserver belonging to a newer session.
 */
export const Lease = z.object({
  id: z.string().uuid(),
  devServerId: z.string().uuid(),
  slot: DevServerSlot,
  /** Public proxy URL the client should print to the user. Authoritative. */
  url: z.string().url(),
  /** Renew before this timestamp or the lease expires and the devserver drains. */
  expiresAt: z.string().datetime(),
})
export type Lease = z.infer<typeof Lease>

/**
 * A Caddy proxy route owned by the runtime. The `@id` is always the devDomain;
 * this lets the runtime PATCH a single route in place without touching others.
 */
export const ProxyRoute = z.object({
  devDomain: DevDomain,
  host: z.string(),
  /** Branch → upstream port. `main` is the host's catch-all. */
  upstreams: z.record(WorktreeName, Port),
})
export type ProxyRoute = z.infer<typeof ProxyRoute>
