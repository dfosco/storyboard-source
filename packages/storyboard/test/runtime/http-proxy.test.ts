import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import http from 'node:http'
import { createRuntimeServer } from '../../src/runtime/server/http.js'
import { ProxyController } from '../../src/runtime/proxy/controller.js'
import { CaddyAdminClient } from '../../src/runtime/proxy/caddy.js'

interface MockCaddy {
  port: number
  routes: Array<Record<string, unknown>>
  close: () => Promise<void>
}

async function startMockCaddy(): Promise<MockCaddy> {
  const state: MockCaddy = { port: 0, routes: [], close: async () => undefined }
  const server = http.createServer(async (req, res) => {
    const url = req.url ?? '/'
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null
    if (req.method === 'GET' && url === '/config/') { res.writeHead(200); res.end('{}'); return }
    if (req.method === 'GET' && url === '/config/apps/http/servers/srv0/routes') {
      res.writeHead(200); res.end(JSON.stringify(state.routes)); return
    }
    if (req.method === 'PATCH' && url.startsWith('/id/')) {
      const id = decodeURIComponent(url.slice('/id/'.length))
      const idx = state.routes.findIndex(r => r['@id'] === id)
      if (idx === -1) { res.writeHead(404); res.end(); return }
      state.routes[idx] = body
      res.writeHead(200); res.end(); return
    }
    if (req.method === 'POST' && url === '/config/apps/http/servers/srv0/routes') {
      state.routes.push(body); res.writeHead(200); res.end(); return
    }
    if (req.method === 'DELETE' && url.startsWith('/config/apps/http/servers/srv0/routes/')) {
      const idx = Number(url.split('/').pop())
      state.routes.splice(idx, 1); res.writeHead(200); res.end(); return
    }
    res.writeHead(404); res.end()
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()))
  const a = server.address()
  if (typeof a === 'string' || !a) throw new Error('addr')
  state.port = a.port
  state.close = () => new Promise<void>(r => server.close(() => r()))
  return state
}

describe('runtime HTTP /proxy/* end-to-end', () => {
  let caddy: MockCaddy
  let runtime: http.Server
  let runtimePort: number

  beforeAll(async () => {
    caddy = await startMockCaddy()
    const controller = new ProxyController({
      caddy: new CaddyAdminClient({ baseUrl: `http://127.0.0.1:${caddy.port}` }),
    })
    runtime = createRuntimeServer({ proxyController: controller })
    await new Promise<void>(r => runtime.listen(0, '127.0.0.1', () => r()))
    const a = runtime.address()
    if (typeof a === 'string' || !a) throw new Error('addr')
    runtimePort = a.port
  })

  afterAll(async () => {
    await new Promise<void>(r => runtime.close(() => r()))
    await caddy.close()
  })

  function call(path: string, init: RequestInit = {}) {
    return fetch(`http://127.0.0.1:${runtimePort}${path}`, init)
  }

  it('rejects default devDomain "storyboard" with FORBIDDEN_DEFAULT_DOMAIN', async () => {
    const r = await call('/proxy/upsert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ devDomain: 'storyboard', worktree: 'main', port: 1234 }),
    })
    expect(r.status).toBe(403)
    const body = await r.json() as { code: string }
    expect(body.code).toBe('FORBIDDEN_DEFAULT_DOMAIN')
  })

  it('upserts a route end-to-end', async () => {
    const r = await call('/proxy/upsert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ devDomain: 'storyboard-core', worktree: 'main', port: 1234 }),
    })
    expect(r.status).toBe(200)
    expect(caddy.routes).toHaveLength(1)
    expect(caddy.routes[0]?.['@id']).toBe('storyboard-core')

    const state = await call('/proxy/state').then(r => r.json()) as { routes: unknown[]; caddyReachable: boolean }
    expect(state.routes).toHaveLength(1)
    expect(state.caddyReachable).toBe(true)
  })

  it('rejects malformed body with BAD_REQUEST', async () => {
    const r = await call('/proxy/upsert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ devDomain: 'INVALID', worktree: 'main', port: 1234 }),
    })
    expect(r.status).toBe(400)
    const body = await r.json() as { code: string }
    expect(body.code).toBe('BAD_REQUEST')
  })
})
