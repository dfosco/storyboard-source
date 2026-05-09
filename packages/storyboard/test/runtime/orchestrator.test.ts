import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DevServerOrchestrator, ForbiddenDefaultDomainError, LeaseNotFoundError } from '../../src/runtime/devserver/index.js'
import { ProxyController } from '../../src/runtime/proxy/index.js'
import { CaddyAdminClient } from '../../src/runtime/proxy/caddy.js'
import { DevDomain, WorktreeName } from '../../src/runtime/schema/index.js'

/**
 * Fake Vite child — emits "ready in 50ms" on stdout after a tick, mirrors
 * Vite's actual log line so the orchestrator's regex matches identically.
 */
function fakeViteChild(opts: { failBeforeReady?: boolean } = {}) {
  const child = new EventEmitter() as EventEmitter & {
    pid: number
    stdout: Readable
    stderr: Readable
    kill: (signal: string) => void
  }
  child.pid = Math.floor(Math.random() * 100000) + 1000
  child.stdout = new Readable({ read() { /* noop */ } })
  child.stderr = new Readable({ read() { /* noop */ } })
  child.kill = (_sig: string) => { setImmediate(() => child.emit('exit', 0)) }

  setImmediate(() => {
    if (opts.failBeforeReady) {
      child.stderr.push('Error: configuration broken\n')
      child.emit('exit', 1)
    } else {
      child.stdout.push('  VITE v5.0.0  ready in 50ms\n')
    }
  })
  return child as unknown as ReturnType<typeof import('node:child_process').spawn>
}

/** A ProxyController wired to an in-memory mock Caddy that always succeeds. */
function makeProxy() {
  const upserts: Array<{ devDomain: string; worktree: string; port: number }> = []
  const removes: Array<{ devDomain: string; worktree: string }> = []
  const stub = {
    async ping() { return true },
    async listRoutes() { return [] },
    async patchById() { return true },
    async appendRoute() { /* noop */ },
    async deleteRouteAt() { /* noop */ },
    async bootstrap() { /* noop */ },
    baseUrl: 'http://stub',
    timeoutMs: 1000,
  } as unknown as CaddyAdminClient
  const ctrl = new ProxyController({ caddy: stub })
  // Wrap upsert/remove so tests can assert side-effects without diving into Caddy mock.
  const origUpsert = ctrl.upsert.bind(ctrl)
  const origRemove = ctrl.removeWorktree.bind(ctrl)
  ctrl.upsert = async (d, w, p) => { upserts.push({ devDomain: d, worktree: w, port: Number(p) }); return origUpsert(d, w, p) }
  ctrl.removeWorktree = async (d, w) => { removes.push({ devDomain: d, worktree: w }); return origRemove(d, w) }
  return { proxy: ctrl, upserts, removes }
}

describe('DevServerOrchestrator', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'sb-runtime-test-'))
  })
  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
  })

  it('rejects default devDomain with ForbiddenDefaultDomainError', async () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    await expect(orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard'), worktree: WorktreeName.parse('main') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: false,
    })).rejects.toBeInstanceOf(ForbiddenDefaultDomainError)
  })

  it('allows default devDomain with allowDefaultDomain=true', async () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    const r = await orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard'), worktree: WorktreeName.parse('main') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: true,
    })
    expect(r.devServer.status).toBe('ready')
  })

  it('spawns and reaches ready, registers proxy upsert', async () => {
    const { proxy, upserts } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    const r = await orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: false,
    })
    expect(r.devServer.status).toBe('ready')
    expect(r.lease.url).toBe('http://storyboard-core.localhost/')
    expect(upserts).toHaveLength(1)
    expect(upserts[0]?.devDomain).toBe('storyboard-core')
  })

  it('returns same devserver when slot reacquired', async () => {
    const { proxy } = makeProxy()
    const spawn = vi.fn(() => fakeViteChild())
    const orch = new DevServerOrchestrator({ proxy, spawnVite: spawn })
    const slot = { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') }
    const a = await orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false })
    const b = await orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(b.devServer.id).toBe(a.devServer.id)
    expect(b.lease.id).not.toBe(a.lease.id) // fresh lease
  })

  it('serializes concurrent acquires for the same slot (no double-spawn)', async () => {
    const { proxy } = makeProxy()
    const spawn = vi.fn(() => fakeViteChild())
    const orch = new DevServerOrchestrator({ proxy, spawnVite: spawn })
    const slot = { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') }
    const [a, b, c] = await Promise.all([
      orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false }),
      orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false }),
      orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false }),
    ])
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(a.devServer.id).toBe(b.devServer.id)
    expect(a.devServer.id).toBe(c.devServer.id)
  })

  it('uses /branch--<name>/ for non-main worktrees', async () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    const r = await orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('0.5.0') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: false,
    })
    expect(r.lease.url).toBe('http://storyboard-core.localhost/branch--0.5.0/')
  })

  it('release on unknown lease throws LeaseNotFoundError', () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    expect(() => orch.release('00000000-0000-0000-0000-000000000000')).toThrow(LeaseNotFoundError)
  })

  it('renew extends lease expiry', async () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    const r = await orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: false,
    })
    const before = new Date(r.lease.expiresAt).getTime()
    await new Promise(res => setTimeout(res, 5))
    const renewed = orch.renew(r.lease.id, 600)
    expect(new Date(renewed.expiresAt).getTime()).toBeGreaterThan(before)
  })

  it('surfaces DevServerSpawnError when child exits before ready', async () => {
    const { proxy } = makeProxy()
    const orch = new DevServerOrchestrator({
      proxy,
      spawnVite: () => fakeViteChild({ failBeforeReady: true }),
    })
    await expect(orch.acquire({
      slot: { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') },
      targetCwd: tmp,
      ttlSeconds: 60,
      allowDefaultDomain: false,
    })).rejects.toThrow(/exited.*before becoming ready/)
  })

  it('release of last lease drains the devserver', async () => {
    const { proxy, removes } = makeProxy()
    const orch = new DevServerOrchestrator({ proxy, spawnVite: () => fakeViteChild() })
    const slot = { devDomain: DevDomain.parse('storyboard-core'), worktree: WorktreeName.parse('main') }
    const r = await orch.acquire({ slot, targetCwd: tmp, ttlSeconds: 60, allowDefaultDomain: false })
    orch.release(r.lease.id)
    // Allow the SIGTERM → exit handler to fire.
    await new Promise(res => setTimeout(res, 20))
    expect(removes).toHaveLength(1)
  })
})
