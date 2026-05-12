import { describe, it, expect, beforeEach } from 'vitest'
import { ProxyController } from '../../src/runtime/proxy/controller'
import { CaddyAdminClient } from '../../src/runtime/proxy/caddy'

class FakeCaddy extends CaddyAdminClient {
  routes: any[] = []
  async ping() { return true }
  async listRoutes() { return this.routes }
  async patchById(id: string, route: any) {
    const i = this.routes.findIndex(r => r['@id'] === id)
    if (i < 0) return false
    this.routes[i] = route
    return true
  }
  async appendRoute(route: any) { this.routes.push(route) }
  async deleteRouteAt(idx: number) { this.routes.splice(idx, 1) }
}

describe('ProxyController.upsert port eviction', () => {
  it('strips a reused port from another devDomain', async () => {
    const caddy = new FakeCaddy()
    const c = new ProxyController({ caddy })
    await c.upsert('storyboard' as any, 'dfosco' as any, 1240 as any)
    await c.upsert('storyboard-core' as any, '0.5.0' as any, 1240 as any)
    expect(caddy.routes.find(r => r['@id'] === 'storyboard')).toBeUndefined()
    expect(caddy.routes.find(r => r['@id'] === 'storyboard-core')).toBeDefined()
  })
})
