import { z } from 'zod'
import { DevServerSlot, Port } from './identity.js'
import { DevServer, Lease, ProxyRoute } from './devserver.js'

/**
 * `POST /devserver/acquire` — request a devserver for a `(devDomain, worktree)` slot.
 *
 * If a devserver already exists for the slot, the runtime returns its existing
 * lease (renewed). Otherwise it either rents a hot-pool member or spawns a new
 * Vite process. The slot is locked for the duration of the call.
 */
export const AcquireRequest = z.object({
  slot: DevServerSlot,
  /** Absolute path of the worktree directory; the runtime spawns Vite with `cwd: targetCwd`. */
  targetCwd: z.string().min(1),
  /** Lease TTL in seconds. Defaults to 5 min; CLI clients renew on each command. */
  ttlSeconds: z.number().int().min(30).max(60 * 60).default(300),
  /**
   * Escape hatch for the deprecated default devDomain `"storyboard"`. CI and
   * one-off scripts may pass true; the CLI never does.
   */
  allowDefaultDomain: z.boolean().default(false),
})
export type AcquireRequest = z.infer<typeof AcquireRequest>

export const AcquireResponse = z.object({
  lease: Lease,
  devServer: DevServer,
})
export type AcquireResponse = z.infer<typeof AcquireResponse>

/** `POST /devserver/release` — relinquish the lease and trigger draining. */
export const ReleaseRequest = z.object({
  leaseId: z.string().uuid(),
})
export type ReleaseRequest = z.infer<typeof ReleaseRequest>

/** `POST /devserver/renew` — extend the lease without changing devserver state. */
export const RenewRequest = z.object({
  leaseId: z.string().uuid(),
  ttlSeconds: z.number().int().min(30).max(60 * 60).default(300),
})
export type RenewRequest = z.infer<typeof RenewRequest>

/** `GET /proxy/state` — current routing table the runtime believes Caddy holds. */
export const ProxyState = z.object({
  routes: z.array(ProxyRoute),
  caddyReachable: z.boolean(),
})
export type ProxyState = z.infer<typeof ProxyState>

/** `GET /pool/status` — hot-pool inventory. */
export const PoolStatus = z.object({
  warm: z.number().int().nonnegative(),
  bound: z.number().int().nonnegative(),
  capacity: z.number().int().nonnegative(),
})
export type PoolStatus = z.infer<typeof PoolStatus>

/** `GET /health` — daemon liveness probe. */
export const Health = z.object({
  ok: z.literal(true),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  port: Port,
})
export type Health = z.infer<typeof Health>

/** Runtime error envelope. All non-2xx responses share this shape. */
export const RuntimeError = z.object({
  error: z.string(),
  code: z.enum([
    'NOT_IMPLEMENTED',
    'BAD_REQUEST',
    'CONFLICT',
    'NOT_FOUND',
    'FORBIDDEN_DEFAULT_DOMAIN',
    'INTERNAL',
    'CADDY_UNREACHABLE',
    'PORT_EXHAUSTED',
    'TIMEOUT',
  ]),
  details: z.unknown().optional(),
})
export type RuntimeError = z.infer<typeof RuntimeError>
