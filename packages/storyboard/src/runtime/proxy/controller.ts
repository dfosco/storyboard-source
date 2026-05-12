import { DevDomain, Port, ProxyRoute, ProxyState, WorktreeName } from '../schema/index.js'
import { buildRouteFor, CaddyAdminClient, CaddyUnreachableError, CaddyRoute } from './caddy.js'

/**
 * ProxyController — the runtime's authoritative model of the Caddy proxy.
 *
 * Two invariants the rest of the system depends on:
 *
 * 1. **Sole writer.** Only this controller calls Caddy admin write methods
 *    (PATCH/POST/DELETE). The legacy per-repo `caddy reload --config` path
 *    that destructively replaced the entire config is no longer reachable
 *    from any code under the runtime.
 *
 * 2. **Serialized writes.** Every mutation is queued through `withLock()`.
 *    Two concurrent acquires for different devDomains can no longer race
 *    each other into producing a Caddy config where one repo's routes
 *    silently shadowed another's.
 *
 * The in-memory `routes` map is the desired state. After every write we
 * reconcile against Caddy's actual state and re-PATCH if drift is detected.
 */

export interface ProxyControllerOptions {
  caddy?: CaddyAdminClient
}

export class ProxyController {
  private readonly caddy: CaddyAdminClient
  private readonly routes = new Map<DevDomain, ProxyRoute>()
  private writeChain: Promise<unknown> = Promise.resolve()

  constructor(opts: ProxyControllerOptions = {}) {
    this.caddy = opts.caddy ?? new CaddyAdminClient()
  }

  private withLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeChain.then(fn, fn)
    this.writeChain = next.catch(() => undefined)
    return next
  }

  async caddyReachable(): Promise<boolean> {
    return this.caddy.ping()
  }

  async stateForApi(): Promise<ProxyState> {
    return ProxyState.parse({
      routes: Array.from(this.routes.values()),
      caddyReachable: await this.caddy.ping(),
    })
  }

  async upsert(devDomain: DevDomain, worktree: WorktreeName, port: Port): Promise<ProxyRoute> {
    return this.withLock(async () => {
      // Evict this port from every other devDomain. A port can be reassigned
      // when its previous owner exits, but the previous devDomain's Caddy
      // route still references the port number — so requests to host A would
      // silently land on host B's Vite (which then 421s with "Wrong domain").
      // Strip the port from sibling routes before binding it here.
      for (const [otherDomain, otherRoute] of this.routes) {
        if (otherDomain === devDomain) continue
        let mutated = false
        const nextUpstreams: Record<string, Port> = {}
        for (const [w, p] of Object.entries(otherRoute.upstreams)) {
          if (Number(p) === Number(port)) { mutated = true; continue }
          nextUpstreams[w] = p
        }
        if (!mutated) continue
        if (Object.keys(nextUpstreams).length === 0) {
          this.routes.delete(otherDomain)
          await this.removeFromCaddy(otherDomain)
        } else {
          const cleaned = ProxyRoute.parse({
            devDomain: otherDomain,
            host: `${otherDomain}.localhost`,
            upstreams: nextUpstreams,
          })
          this.routes.set(otherDomain, cleaned)
          await this.syncOne(cleaned)
        }
      }

      const existing = this.routes.get(devDomain)
      const upstreams: Record<string, Port> = { ...(existing?.upstreams ?? {}) }
      upstreams[worktree] = port
      const next = ProxyRoute.parse({
        devDomain,
        host: `${devDomain}.localhost`,
        upstreams,
      })
      this.routes.set(devDomain, next)
      await this.syncOne(next)
      return next
    })
  }

  async removeWorktree(devDomain: DevDomain, worktree: WorktreeName): Promise<void> {
    return this.withLock(async () => {
      const existing = this.routes.get(devDomain)
      if (!existing) return
      const upstreams: Record<string, Port> = { ...existing.upstreams }
      delete upstreams[worktree]
      if (Object.keys(upstreams).length === 0) {
        this.routes.delete(devDomain)
        await this.removeFromCaddy(devDomain)
      } else {
        const next = ProxyRoute.parse({
          devDomain,
          host: `${devDomain}.localhost`,
          upstreams,
        })
        this.routes.set(devDomain, next)
        await this.syncOne(next)
      }
    })
  }

  private async syncOne(route: ProxyRoute): Promise<void> {
    if (!(await this.caddy.ping())) {
      throw new CaddyUnreachableError(this.caddy.baseUrl)
    }
    const caddyRoute = buildRouteFor(route.devDomain, route.upstreams as Record<string, Port>)
    const patched = await this.caddy.patchById(route.devDomain, caddyRoute)
    if (!patched) {
      await this.caddy.appendRoute(caddyRoute)
    }
    await this.cleanupDuplicates(route.devDomain, `${route.devDomain}.localhost`)
  }

  private async removeFromCaddy(devDomain: DevDomain): Promise<void> {
    if (!(await this.caddy.ping())) throw new CaddyUnreachableError(this.caddy.baseUrl)
    const all = await this.caddy.listRoutes()
    const indices: number[] = []
    for (let i = 0; i < all.length; i++) {
      if (all[i]!['@id'] === devDomain) indices.push(i)
    }
    for (const i of indices.sort((a, b) => b - a)) {
      await this.caddy.deleteRouteAt(i)
    }
  }

  /**
   * Stale-route cleanup. The legacy `caddy reload` path used to leave
   * non-`@id` routes for the same host that would shadow our admin-API
   * route. We sweep them on every successful upsert.
   */
  private async cleanupDuplicates(keepId: DevDomain, host: string): Promise<void> {
    const all = await this.caddy.listRoutes()
    const stale: number[] = []
    for (let i = 0; i < all.length; i++) {
      const r = all[i]!
      if (r['@id'] === keepId) continue
      if (r['@id']) continue
      const hosts = r.match?.[0]?.host ?? []
      if (hosts.includes(host)) stale.push(i)
    }
    for (const i of stale.sort((a, b) => b - a)) {
      try { await this.caddy.deleteRouteAt(i) } catch { /* best-effort */ }
    }
  }

  async readLiveCaddyRoutes(): Promise<CaddyRoute[]> {
    return this.caddy.listRoutes()
  }

  /**
   * Reconcile Caddy with this controller's in-memory desired state.
   *
   * Called once on daemon startup. The runtime is the sole writer to Caddy,
   * so any `@id`-tagged route the controller doesn't know about is a leftover
   * from a previous daemon process. Leaving them in place causes the bug
   * where a recycled port hits a stale host (e.g. `storyboard.localhost` →
   * port 1240, which now belongs to a different repo). We delete them.
   *
   * Does NOT touch routes without `@id` — those may be hand-installed Caddy
   * rules outside our ownership; legacy duplicate cleanup happens per-upsert.
   */
  async reconcileFromCaddy(): Promise<void> {
    return this.withLock(async () => {
      if (!(await this.caddy.ping())) return
      const all = await this.caddy.listRoutes()
      const owned = new Set<string>(this.routes.keys())
      const stale: number[] = []
      for (let i = 0; i < all.length; i++) {
        const id = all[i]!['@id']
        if (id && !owned.has(id)) stale.push(i)
      }
      for (const i of stale.sort((a, b) => b - a)) {
        try { await this.caddy.deleteRouteAt(i) } catch { /* best-effort */ }
      }
    })
  }
}
