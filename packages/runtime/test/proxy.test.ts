import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import http from 'node:http'
import { ProxyController } from '../src/proxy/controller.js'
import { CaddyAdminClient, buildRouteFor } from '../src/proxy/caddy.js'
import { DevDomain, Port, WorktreeName } from '../src/schema/index.js'

interface MockCaddy {
  port: number
  routes: Array<Record<string, unknown>>
  patchCalls: Array<{ id: string; body: Record<string, unknown> }>
  appendCalls: Array<Record<string, unknown>>
  deleteCalls: number[]
  close: () => Promise<void>
}

async function startMockCaddy(): Promise<MockCaddy> {
  const state: MockCaddy = {
    port: 0,
    routes: [],
    patchCalls: [],
    appendCalls: [],
    deleteCalls: [],
    close: async () => undefined,
  }

  const server = http.createServer(async (req, res) => {
    const url = req.url ?? '/'
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null

    if (req.method === 'GET' && url === '/config/') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{}'); return
    }
    if (req.method === 'GET' && url === '/config/apps/http/servers/srv0/routes') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(state.routes)); return
    }
    if (req.method === 'PATCH' && url.startsWith('/id/')) {
      const id = decodeURIComponent(url.slice('/id/'.length))
      state.patchCalls.push({ id, body })
      const idx = state.routes.findIndex(r => r['@id'] === id)
      if (idx === -1) { res.writeHead(404); res.end(); return }
      state.routes[idx] = body as Record<string, unknown>
      res.writeHead(200); res.end(); return
    }
    if (req.method === 'POST' && url === '/config/apps/http/servers/srv0/routes') {
      state.appendCalls.push(body as Record<string, unknown>)
      state.routes.push(body as Record<string, unknown>)
      res.writeHead(200); res.end(); return
    }
    if (req.method === 'DELETE' && url.startsWith('/config/apps/http/servers/srv0/routes/')) {
      const idx = Number(url.split('/').pop())
      state.deleteCalls.push(idx)
      state.routes.splice(idx, 1)
      res.writeHead(200); res.end(); return
    }
    res.writeHead(404); res.end()
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const addr = server.address()
  if (typeof addr === 'string' || !addr) throw new Error('no addr')
  state.port = addr.port
  state.close = () => new Promise<void>(resolve => server.close(() => resolve()))
  return state
}

describe('ProxyController + mock Caddy admin', () => {
  let caddy: MockCaddy
  let controller: ProxyController

  beforeEach(async () => {
    caddy = await startMockCaddy()
    controller = new ProxyController({
      caddy: new CaddyAdminClient({ baseUrl: `http://127.0.0.1:${caddy.port}` }),
    })
  })

  afterEach(async () => {
    await caddy.close()
  })

  it('upserts a new devDomain route via append, patches on second call', async () => {
    const dev = DevDomain.parse('storyboard-core')
    const wt = WorktreeName.parse('main')
    const port = Port.parse(1234)

    await controller.upsert(dev, wt, port)
    expect(caddy.appendCalls).toHaveLength(1)
    expect(caddy.routes[0]?.['@id']).toBe('storyboard-core')

    // Second worktree on same devDomain → PATCH, no append
    await controller.upsert(dev, WorktreeName.parse('0.5.0'), Port.parse(1235))
    expect(caddy.patchCalls.length).toBeGreaterThanOrEqual(1)
    expect(caddy.appendCalls).toHaveLength(1)
    expect(caddy.routes).toHaveLength(1)
  })

  it('serializes concurrent upserts (no race-clobber)', async () => {
    const dev = DevDomain.parse('storyboard-core')
    await Promise.all([
      controller.upsert(dev, WorktreeName.parse('a'), Port.parse(1240)),
      controller.upsert(dev, WorktreeName.parse('b'), Port.parse(1241)),
      controller.upsert(dev, WorktreeName.parse('c'), Port.parse(1242)),
    ])
    const final = caddy.routes[0]
    expect(final).toBeDefined()
    const handle = (final as { handle: Array<{ routes: unknown[] }> }).handle[0]
    // 3 worktree subroutes + 1 fallback (last upserted port)
    expect(handle?.routes).toHaveLength(4)
  })

  it('removeWorktree drops a single worktree but keeps the route alive', async () => {
    const dev = DevDomain.parse('storyboard-core')
    await controller.upsert(dev, WorktreeName.parse('main'), Port.parse(1234))
    await controller.upsert(dev, WorktreeName.parse('0.5.0'), Port.parse(1235))
    await controller.removeWorktree(dev, WorktreeName.parse('0.5.0'))
    expect(caddy.routes).toHaveLength(1)
    expect(caddy.routes[0]?.['@id']).toBe('storyboard-core')
  })

  it('removeWorktree deletes the entire route when no worktrees remain', async () => {
    const dev = DevDomain.parse('storyboard-core')
    await controller.upsert(dev, WorktreeName.parse('main'), Port.parse(1234))
    await controller.removeWorktree(dev, WorktreeName.parse('main'))
    expect(caddy.routes).toHaveLength(0)
    expect(caddy.deleteCalls.length).toBeGreaterThanOrEqual(1)
  })

  it('cleans up stale non-@id routes for the same host', async () => {
    // Simulate a leftover from `caddy reload` — same host, no @id
    caddy.routes.push({
      match: [{ host: ['storyboard-core.localhost'] }],
      handle: [{ handler: 'reverse_proxy', upstreams: [{ dial: 'localhost:9999' }] }],
    })
    const dev = DevDomain.parse('storyboard-core')
    await controller.upsert(dev, WorktreeName.parse('main'), Port.parse(1234))
    // After upsert the stale entry should be gone, only our @id route remains
    expect(caddy.routes).toHaveLength(1)
    expect(caddy.routes[0]?.['@id']).toBe('storyboard-core')
  })

  it('routes for two devDomains coexist independently', async () => {
    await controller.upsert(DevDomain.parse('storyboard-core'), WorktreeName.parse('main'), Port.parse(1234))
    await controller.upsert(DevDomain.parse('storyboard'), WorktreeName.parse('main'), Port.parse(1238))
    expect(caddy.routes).toHaveLength(2)
    const ids = caddy.routes.map(r => r['@id']).sort()
    expect(ids).toEqual(['storyboard', 'storyboard-core'])
  })
})

describe('buildRouteFor', () => {
  it('emits worktree subroutes before the main fallback', () => {
    const route = buildRouteFor(
      DevDomain.parse('demo'),
      { main: Port.parse(1234), feat: Port.parse(1240) },
    )
    const sub = (route.handle?.[0] as { routes: Array<{ match?: unknown }> }).routes
    expect(sub).toHaveLength(2)
    expect(sub[0]?.match).toBeDefined()  // /branch--feat/* match
    expect(sub[1]?.match).toBeUndefined() // fallback (no match block)
  })
})
