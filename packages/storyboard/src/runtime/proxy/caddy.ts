import { z } from 'zod'
import { DevDomain, Port, WorktreeName } from '../schema/index.js'

/**
 * Typed Caddy admin API client. The runtime is the SOLE writer to
 * `http://localhost:2019` — this module is the only place in the codebase
 * that issues PATCH/POST/DELETE against Caddy. All cross-repo route races
 * (the doubled-URL bug class) are eliminated by funneling writes here.
 *
 * Reads are also funneled through this module so the runtime's view of
 * Caddy state matches what's actually live.
 */

export const CADDY_ADMIN_DEFAULT = 'http://localhost:2019'

export const CaddyRoute = z
  .object({
    '@id': z.string().optional(),
    match: z.array(z.object({ host: z.array(z.string()).optional() }).passthrough()).optional(),
    handle: z.array(z.unknown()).optional(),
  })
  .passthrough()
export type CaddyRoute = z.infer<typeof CaddyRoute>

export interface CaddyAdminOptions {
  baseUrl?: string
  timeoutMs?: number
}

export class CaddyUnreachableError extends Error {
  constructor(baseUrl: string, cause?: unknown) {
    super(`Caddy admin API not reachable at ${baseUrl}`)
    this.name = 'CaddyUnreachableError'
    if (cause) (this as Error & { cause?: unknown }).cause = cause
  }
}

export class CaddyAdminClient {
  readonly baseUrl: string
  readonly timeoutMs: number

  constructor(opts: CaddyAdminOptions = {}) {
    this.baseUrl = opts.baseUrl ?? CADDY_ADMIN_DEFAULT
    this.timeoutMs = opts.timeoutMs ?? 5000
  }

  private async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      // Caddy's admin API rejects requests with 403 when the Origin header
      // doesn't match an allowed origin. Node's undici fetch sends an empty
      // Origin by default, which Caddy refuses. Set it explicitly to the
      // admin URL.
      const headers = new Headers(init.headers)
      if (!headers.has('origin')) headers.set('origin', this.baseUrl)
      return await fetch(`${this.baseUrl}${path}`, { ...init, headers, signal: controller.signal })
    } catch (err) {
      throw new CaddyUnreachableError(this.baseUrl, err)
    } finally {
      clearTimeout(t)
    }
  }

  async ping(): Promise<boolean> {
    try {
      const r = await this.fetch('/config/')
      return r.ok
    } catch {
      return false
    }
  }

  async listRoutes(): Promise<CaddyRoute[]> {
    const r = await this.fetch('/config/apps/http/servers/srv0/routes')
    if (r.status === 404) return []
    if (!r.ok) throw new CaddyUnreachableError(this.baseUrl)
    const raw = (await r.json()) as unknown
    return z.array(CaddyRoute).parse(raw ?? [])
  }

  async patchById(id: string, route: CaddyRoute): Promise<boolean> {
    const r = await this.fetch(`/id/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(route),
    })
    return r.ok
  }

  async appendRoute(route: CaddyRoute): Promise<void> {
    const r = await this.fetch('/config/apps/http/servers/srv0/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(route),
    })
    if (!r.ok) throw new CaddyUnreachableError(this.baseUrl)
  }

  async deleteRouteAt(idx: number): Promise<void> {
    const r = await this.fetch(`/config/apps/http/servers/srv0/routes/${idx}`, {
      method: 'DELETE',
    })
    if (!r.ok && r.status !== 404) throw new CaddyUnreachableError(this.baseUrl)
  }

  async bootstrap(): Promise<void> {
    const config = {
      apps: { http: { servers: { srv0: { listen: [':80'], routes: [] } } } },
    }
    const r = await this.fetch('/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (!r.ok) throw new CaddyUnreachableError(this.baseUrl)
  }
}

/**
 * Build a Caddy route for a single devDomain, with one subroute per worktree.
 * The `@id` is the devDomain itself so writes are PATCHable in place.
 */
export function buildRouteFor(
  devDomain: DevDomain,
  upstreams: Record<string, Port>,
  mainPort?: Port,
): CaddyRoute {
  const host = `${devDomain}.localhost`
  const subroutes: unknown[] = []

  for (const [worktree, port] of Object.entries(upstreams)) {
    if (worktree === 'main') continue
    subroutes.push({
      match: [{ path: [`/branch--${worktree}/*`] }],
      handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: `localhost:${port}` }] }],
    })
  }

  const fallbackPort = mainPort ?? upstreams.main ?? Object.values(upstreams)[0]
  if (fallbackPort) {
    subroutes.push({
      handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: `localhost:${fallbackPort}` }] }],
    })
  }

  return CaddyRoute.parse({
    '@id': devDomain,
    match: [{ host: [host] }],
    handle: [{ handler: 'subroute', routes: subroutes }],
  })
}

void WorktreeName
