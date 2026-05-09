/**
 * M5 — per-devDomain origin enforcement.
 *
 * Two structural checks beyond what M3 provided:
 * 1. SlotCwdConflictError — refuses to bind two different repo paths to
 *    the same (devDomain, worktree) slot. Without this, two repos with
 *    the same devDomain string would silently share an origin.
 * 2. Host-header check in the Vite plugin — refuses requests under a
 *    foreign devDomain even if Caddy misroutes them.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DevServerOrchestrator, SlotCwdConflictError } from '../src/devserver/index.js'
import { ProxyController } from '../src/proxy/index.js'
import { CaddyAdminClient } from '../src/proxy/caddy.js'
import { DevDomain, WorktreeName } from '../src/schema/index.js'
import { storyboardRuntimePlugin } from '../src/vite-plugin/index.js'

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

function makeProxy() {
  const stub = {
    async ping() { return true },
    async listRoutes() { return [] },
    async patchById() { return true },
    async appendRoute() { /* */ },
    async deleteRouteAt() { /* */ },
    async bootstrap() { /* */ },
    baseUrl: 'http://stub', timeoutMs: 1000,
  } as unknown as CaddyAdminClient
  return new ProxyController({ caddy: stub })
}

describe('M5: SlotCwdConflictError', () => {
  let tmpA: string
  let tmpB: string

  beforeEach(() => {
    tmpA = mkdtempSync(join(tmpdir(), 'sb-m5-a-'))
    tmpB = mkdtempSync(join(tmpdir(), 'sb-m5-b-'))
  })
  afterEach(() => {
    rmSync(tmpA, { recursive: true, force: true })
    rmSync(tmpB, { recursive: true, force: true })
  })

  it('refuses to rebind a slot to a different targetCwd', async () => {
    const orch = new DevServerOrchestrator({ proxy: makeProxy(), spawnVite: () => fakeViteChild() })
    const slot = { devDomain: DevDomain.parse('shared'), worktree: WorktreeName.parse('main') }

    // First repo claims the slot.
    const first = await orch.acquire({ slot, targetCwd: tmpA, ttlSeconds: 60, allowDefaultDomain: false })
    expect(first.devServer.cwd).toBe(tmpA)

    // Second repo tries to claim the SAME slot from a different cwd → CONFLICT.
    await expect(orch.acquire({
      slot, targetCwd: tmpB, ttlSeconds: 60, allowDefaultDomain: false,
    })).rejects.toBeInstanceOf(SlotCwdConflictError)
  })

  it('allows reacquiring with the SAME targetCwd', async () => {
    const orch = new DevServerOrchestrator({ proxy: makeProxy(), spawnVite: () => fakeViteChild() })
    const slot = { devDomain: DevDomain.parse('repo-a'), worktree: WorktreeName.parse('main') }
    const a = await orch.acquire({ slot, targetCwd: tmpA, ttlSeconds: 60, allowDefaultDomain: false })
    const b = await orch.acquire({ slot, targetCwd: tmpA, ttlSeconds: 60, allowDefaultDomain: false })
    expect(b.devServer.id).toBe(a.devServer.id)
  })
})

describe('M5: Vite plugin Host-header check', () => {
  function runMiddleware(p: ReturnType<typeof storyboardRuntimePlugin>, req: { url?: string; headers: Record<string, string> }) {
    const middlewares: Array<(req: unknown, res: unknown, next: () => void) => void> = []
    const fakeServer = {
      middlewares: { use: (fn: (req: unknown, res: unknown, next: () => void) => void) => middlewares.push(fn) },
    } as never
    p.configureServer?.(fakeServer)
    let body = ''
    const headers: Record<string, string> = {}
    const res = {
      statusCode: 0,
      setHeader: (k: string, v: string) => { headers[k] = v },
      end: (b: string) => { body = b ?? '' },
    }
    let nextCalled = false
    middlewares[0]!(req, res, () => { nextCalled = true })
    return { res, headers, body, nextCalled }
  }

  it('returns 421 when Host points at a foreign devDomain', () => {
    const p = storyboardRuntimePlugin({ branch: 'main', devDomain: 'storyboard-core' })
    const r = runMiddleware(p, { url: '/', headers: { host: 'storyboard.localhost' } })
    expect(r.res.statusCode).toBe(421)
    expect(r.body).toContain('Wrong domain')
    expect(r.body).toContain('storyboard.localhost')
    expect(r.body).toContain('storyboard-core.localhost')
    expect(r.nextCalled).toBe(false)
  })

  it('passes when Host matches our devDomain', () => {
    const p = storyboardRuntimePlugin({ branch: 'main', devDomain: 'storyboard-core' })
    const r = runMiddleware(p, { url: '/', headers: { host: 'storyboard-core.localhost' } })
    expect(r.nextCalled).toBe(true)
  })

  it('passes when Host has no .localhost (e.g. direct port hit, IP, etc.)', () => {
    const p = storyboardRuntimePlugin({ branch: 'main', devDomain: 'storyboard-core' })
    // Host:1240 (direct port hit) should pass — the user is intentionally bypassing Caddy.
    const r = runMiddleware(p, { url: '/', headers: { host: '127.0.0.1' } })
    expect(r.nextCalled).toBe(true)
  })

  it('strips port before comparing Host', () => {
    const p = storyboardRuntimePlugin({ branch: 'main', devDomain: 'storyboard-core' })
    const r = runMiddleware(p, { url: '/', headers: { host: 'storyboard-core.localhost:80' } })
    expect(r.nextCalled).toBe(true)
  })
})
