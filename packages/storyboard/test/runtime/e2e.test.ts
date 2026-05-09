/**
 * M6 end-to-end: assert the doubled-URL bug class is unreachable.
 *
 * This is the plan-required acceptance test. We spin up a real runtime
 * HTTP server with mock Caddy + fake Vite, run two parallel acquires
 * across different (devDomain, worktree) slots, and verify:
 *
 *  1. Every lease.url is a *single*-prefix URL — no /branch--A/branch--B/.
 *  2. Two devDomains coexist in the proxy without overwriting each other.
 *  3. Two repos can NOT share a (devDomain, worktree) slot.
 *  4. The default devDomain "storyboard" is rejected.
 *  5. The Vite plugin's middleware refuses cross-branch and cross-domain
 *     requests with 421 (closes H1 + Host header).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRuntimeServer } from '../../src/runtime/server/http.js'
import { ProxyController } from '../../src/runtime/proxy/index.js'
import { CaddyAdminClient } from '../../src/runtime/proxy/caddy.js'
import { DevServerOrchestrator } from '../../src/runtime/devserver/index.js'
import { storyboardRuntimePlugin } from '../../src/runtime/vite-plugin/index.js'

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

function fakeViteChild() {
  const child = new EventEmitter() as EventEmitter & {
    pid: number
    stdout: Readable
    stderr: Readable
    kill: (signal: string) => void
  }
  child.pid = Math.floor(Math.random() * 100000) + 1000
  child.stdout = new Readable({ read() { /* noop */ } })
  child.stderr = new Readable({ read() { /* noop */ } })
  child.kill = () => { setImmediate(() => child.emit('exit', 0)) }
  setImmediate(() => child.stdout.push('  VITE v5  ready in 30ms\n'))
  return child as unknown as ReturnType<typeof import('node:child_process').spawn>
}

describe('M6 end-to-end: doubled-URL bug class is unreachable', () => {
  let caddy: MockCaddy
  let runtime: http.Server
  let runtimePort: number
  let tmpA: string
  let tmpB: string

  beforeAll(async () => {
    caddy = await startMockCaddy()
    tmpA = mkdtempSync(join(tmpdir(), 'sb-m6-a-'))
    tmpB = mkdtempSync(join(tmpdir(), 'sb-m6-b-'))
    const proxy = new ProxyController({
      caddy: new CaddyAdminClient({ baseUrl: `http://127.0.0.1:${caddy.port}` }),
    })
    const orchestrator = new DevServerOrchestrator({
      proxy,
      spawnVite: () => fakeViteChild(),
    })
    runtime = createRuntimeServer({ proxyController: proxy, orchestrator })
    await new Promise<void>(r => runtime.listen(0, '127.0.0.1', () => r()))
    const a = runtime.address()
    if (typeof a === 'string' || !a) throw new Error('addr')
    runtimePort = a.port
  })

  afterAll(async () => {
    await new Promise<void>(r => runtime.close(() => r()))
    await caddy.close()
    rmSync(tmpA, { recursive: true, force: true })
    rmSync(tmpB, { recursive: true, force: true })
  })

  function call(path: string, init: RequestInit = {}) {
    return fetch(`http://127.0.0.1:${runtimePort}${path}`, init)
  }
  async function acquire(devDomain: string, worktree: string, cwd: string) {
    const r = await call('/devserver/acquire', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slot: { devDomain, worktree }, targetCwd: cwd }),
    })
    return { status: r.status, body: await r.json() as Record<string, unknown> }
  }

  it('every lease.url has at most ONE /branch-- segment', async () => {
    const a = await acquire('repo-a', 'main', tmpA)
    const b = await acquire('repo-a', '0.5.0', tmpA)
    const c = await acquire('repo-b', 'main', tmpB)
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(c.status).toBe(200)
    for (const r of [a, b, c]) {
      const url = String((r.body.lease as Record<string, string>).url)
      const matches = url.match(/branch--/g) ?? []
      expect(matches.length, `URL ${url} contains ${matches.length} /branch-- segments`).toBeLessThanOrEqual(1)
    }
    expect(String((a.body.lease as Record<string, string>).url)).toBe('http://repo-a.localhost/')
    expect(String((b.body.lease as Record<string, string>).url)).toBe('http://repo-a.localhost/branch--0.5.0/')
    expect(String((c.body.lease as Record<string, string>).url)).toBe('http://repo-b.localhost/')
  })

  it('two devDomains coexist in Caddy without overwriting each other', () => {
    const ids = caddy.routes.map(r => r['@id']).filter(Boolean).sort()
    expect(ids).toContain('repo-a')
    expect(ids).toContain('repo-b')
  })

  it('refuses to rebind a slot to a different targetCwd (CONFLICT)', async () => {
    const r = await acquire('repo-a', 'main', tmpB)  // already held by tmpA
    expect(r.status).toBe(409)
    expect(r.body.code).toBe('CONFLICT')
  })

  it('refuses default devDomain "storyboard"', async () => {
    const r = await acquire('storyboard', 'main', tmpA)
    expect(r.status).toBe(403)
    expect(r.body.code).toBe('FORBIDDEN_DEFAULT_DOMAIN')
  })

  it('Vite plugin middleware refuses both cross-branch and cross-domain requests', () => {
    const p = storyboardRuntimePlugin({ branch: '0.5.0', devDomain: 'repo-a' })
    const middlewares: Array<(req: unknown, res: unknown, next: () => void) => void> = []
    const fake = { middlewares: { use: (fn: typeof middlewares[number]) => middlewares.push(fn) } }
    p.configureServer?.(fake as never)

    function check(req: { url?: string; headers: Record<string, string> }) {
      let body = ''
      let status = 0
      const res = {
        statusCode: 0,
        setHeader() { /* */ },
        end(b: string) { body = b ?? ''; status = res.statusCode },
      }
      let next = false
      middlewares[0]!(req, res, () => { next = true })
      return { status, body, next }
    }

    // Foreign /branch--<other>/ from H1
    const r1 = check({ url: '/branch--dfosco/x', headers: { host: 'repo-a.localhost' } })
    expect(r1.status).toBe(421)
    expect(r1.body).toContain('Misdirected')

    // Foreign domain (M5 Host check)
    const r2 = check({ url: '/branch--0.5.0/', headers: { host: 'other.localhost' } })
    expect(r2.status).toBe(421)
    expect(r2.body).toContain('Wrong domain')

    // Own branch + own domain → pass
    const r3 = check({ url: '/branch--0.5.0/x', headers: { host: 'repo-a.localhost' } })
    expect(r3.next).toBe(true)
  })
})
