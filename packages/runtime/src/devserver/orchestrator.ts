import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  AcquireRequest,
  AcquireResponse,
  assertTransition,
  DevServer,
  DevServerSlot,
  DevServerStatus,
  DEFAULT_DEV_DOMAIN,
  Lease,
  Port,
  slotKey,
} from '../schema/index.js'
import { ProxyController } from '../proxy/index.js'
import { PortPool } from './port-pool.js'

/**
 * DevServerOrchestrator — owns the lifecycle of every Vite dev process.
 *
 * Invariants enforced here:
 *
 * 1. **Slot uniqueness.** At most one DevServer per `(devDomain, worktree)`.
 *    Acquire on an existing slot returns the same DevServer with a fresh
 *    lease. Per-slot mutex prevents concurrent double-spawn.
 *
 * 2. **Default-domain refusal (H3).** `acquire()` rejects requests whose
 *    devDomain is the literal `"storyboard"` unless `allowDefaultDomain`
 *    is true. The CLI never passes `true`; only CI/scripts do.
 *
 * 3. **FSM.** Every status change goes through `assertTransition()`.
 *    Illegal transitions throw — no devserver can be `ready` without
 *    having gone through `spawning` first.
 *
 * 4. **Lease enforcement.** Release/renew require a valid lease ID. A stale
 *    `sb dev` cannot kill a devserver claimed by a newer session.
 */

interface DevServerInternal {
  id: string
  child: ChildProcess
  pid: number
  port: Port
  status: DevServerStatus
  slot: DevServerSlot
  cwd: string
  spawnedAt: string
  updatedAt: string
  stderrTail: string[]
  readyPromise: Promise<void>
}

interface LeaseInternal {
  id: string
  devServerId: string
  slot: DevServerSlot
  url: string
  expiresAt: number
}

export class ForbiddenDefaultDomainError extends Error {
  constructor() {
    super(
      `Refusing to acquire under default devDomain "${DEFAULT_DEV_DOMAIN}". ` +
      `Set a unique devDomain in storyboard.config.json or pass allowDefaultDomain=true.`,
    )
    this.name = 'ForbiddenDefaultDomainError'
  }
}

export class LeaseNotFoundError extends Error {
  constructor(id: string) {
    super(`No lease ${id}`)
    this.name = 'LeaseNotFoundError'
  }
}

export class DevServerSpawnError extends Error {
  readonly stderr: string
  constructor(slot: DevServerSlot, exitCode: number | null, stderr: string) {
    super(`Vite for ${slotKey(slot)} exited (code ${exitCode ?? 'unknown'}) before becoming ready`)
    this.name = 'DevServerSpawnError'
    this.stderr = stderr
  }
}

export interface DevServerOrchestratorOptions {
  proxy: ProxyController
  ports?: PortPool
  /** Override Vite spawn for tests — return a child you've prepared. */
  spawnVite?: (cwd: string, port: Port, basePath: string, devDomain: string) => ChildProcess
  readyTimeoutMs?: number
}

const DEFAULT_READY_TIMEOUT_MS = 30_000
const STDERR_TAIL_MAX = 50

export class DevServerOrchestrator {
  private readonly proxy: ProxyController
  private readonly ports: PortPool
  private readonly readyTimeoutMs: number
  private readonly spawnViteFn: NonNullable<DevServerOrchestratorOptions['spawnVite']>

  private readonly bySlot = new Map<string, DevServerInternal>()
  private readonly byId = new Map<string, DevServerInternal>()
  private readonly leases = new Map<string, LeaseInternal>()
  private readonly slotLocks = new Map<string, Promise<unknown>>()

  constructor(opts: DevServerOrchestratorOptions) {
    this.proxy = opts.proxy
    this.ports = opts.ports ?? new PortPool()
    this.readyTimeoutMs = opts.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS
    this.spawnViteFn = opts.spawnVite ?? defaultSpawnVite
  }

  async acquire(input: AcquireRequest): Promise<AcquireResponse> {
    if (input.slot.devDomain === DEFAULT_DEV_DOMAIN && !input.allowDefaultDomain) {
      throw new ForbiddenDefaultDomainError()
    }
    if (!existsSync(input.targetCwd)) {
      throw new Error(`targetCwd does not exist: ${input.targetCwd}`)
    }

    const key = slotKey(input.slot)
    const prior = this.slotLocks.get(key) ?? Promise.resolve()
    const next = prior.then(() => this.acquireLocked(input))
    this.slotLocks.set(key, next.catch(() => undefined))
    return next
  }

  private async acquireLocked(input: AcquireRequest): Promise<AcquireResponse> {
    const key = slotKey(input.slot)
    const existing = this.bySlot.get(key)

    if (existing && existing.status === 'ready') {
      return this.toResponse(existing, this.mintLease(existing, input.ttlSeconds))
    }
    if (existing && existing.status !== 'stopped') {
      try { await existing.readyPromise } catch { /* fall through */ }
      const refreshed = this.bySlot.get(key)
      if (refreshed?.status === 'ready') {
        return this.toResponse(refreshed, this.mintLease(refreshed, input.ttlSeconds))
      }
    }

    const port = await this.ports.acquire()
    const id = randomUUID()
    const basePath = input.slot.worktree === 'main' ? '/' : `/branch--${input.slot.worktree}/`
    const child = this.spawnViteFn(input.targetCwd, port, basePath, input.slot.devDomain)

    const stderrTail: string[] = []
    let resolveReady: () => void = () => undefined
    let rejectReady: (err: Error) => void = () => undefined
    const readyPromise = new Promise<void>((res, rej) => { resolveReady = res; rejectReady = rej })

    const internal: DevServerInternal = {
      id,
      child,
      pid: child.pid ?? 0,
      port,
      status: 'spawning',
      slot: input.slot,
      cwd: input.targetCwd,
      spawnedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stderrTail,
      readyPromise,
    }
    this.bySlot.set(key, internal)
    this.byId.set(id, internal)

    child.stdout?.on('data', (buf: Buffer) => {
      const text = buf.toString()
      if (internal.status === 'spawning' && /ready in|ready /.test(text)) {
        this.transition(internal, 'ready')
        this.proxy.upsert(internal.slot.devDomain, internal.slot.worktree, internal.port)
          .then(() => resolveReady())
          .catch((err: Error) => resolveReady())  // proxy failure ≠ vite failure; surface via state instead
          .finally(() => undefined)
        // Ensure we don't leave readyPromise pending on proxy failure.
        // Use void to silence floating-promise lint where applicable.
        void rejectReady
      }
    })
    child.stderr?.on('data', (buf: Buffer) => {
      stderrTail.push(buf.toString())
      if (stderrTail.length > STDERR_TAIL_MAX) stderrTail.shift()
    })
    child.on('exit', (code) => {
      if (internal.status === 'stopped') return  // already torn down
      const wasReady = internal.status === 'ready'
      this.transition(internal, 'stopped')
      this.bySlot.delete(key)
      this.byId.delete(id)
      this.ports.release(internal.port)
      this.proxy.removeWorktree(internal.slot.devDomain, internal.slot.worktree).catch(() => undefined)
      if (!wasReady) {
        rejectReady(new DevServerSpawnError(internal.slot, code, stderrTail.join('')))
      }
    })

    const timeout = new Promise<never>((_res, rej) => {
      setTimeout(() => rej(new Error(`Vite ready timeout after ${this.readyTimeoutMs}ms`)), this.readyTimeoutMs).unref()
    })
    try {
      await Promise.race([readyPromise, timeout])
    } catch (err) {
      try { child.kill('SIGTERM') } catch { /* already dead */ }
      throw err
    }

    return this.toResponse(internal, this.mintLease(internal, input.ttlSeconds))
  }

  release(leaseId: string): void {
    const lease = this.leases.get(leaseId)
    if (!lease) throw new LeaseNotFoundError(leaseId)
    this.leases.delete(leaseId)
    const ds = this.byId.get(lease.devServerId)
    if (!ds) return

    const stillReferenced = Array.from(this.leases.values()).some(l => l.devServerId === ds.id)
    if (stillReferenced) return

    if (ds.status === 'ready') {
      this.transition(ds, 'draining')
      // Tear down on next tick — synchronous SIGTERM → exit cycles can race the FSM transition.
      setImmediate(() => {
        try { ds.child.kill('SIGTERM') } catch { /* already dead */ }
      })
    }
  }

  renew(leaseId: string, ttlSeconds: number): Lease {
    const lease = this.leases.get(leaseId)
    if (!lease) throw new LeaseNotFoundError(leaseId)
    lease.expiresAt = Date.now() + ttlSeconds * 1000
    return Lease.parse({
      id: lease.id,
      devServerId: lease.devServerId,
      slot: lease.slot,
      url: lease.url,
      expiresAt: new Date(lease.expiresAt).toISOString(),
    })
  }

  list(): DevServer[] {
    return Array.from(this.byId.values()).map(toDevServer)
  }

  shutdown(): void {
    for (const ds of this.byId.values()) {
      try { ds.child.kill('SIGTERM') } catch { /* already dead */ }
    }
  }

  private mintLease(ds: DevServerInternal, ttlSeconds: number): LeaseInternal {
    const id = randomUUID()
    const url = `http://${ds.slot.devDomain}.localhost${ds.slot.worktree === 'main' ? '/' : `/branch--${ds.slot.worktree}/`}`
    const lease: LeaseInternal = {
      id,
      devServerId: ds.id,
      slot: ds.slot,
      url,
      expiresAt: Date.now() + ttlSeconds * 1000,
    }
    this.leases.set(id, lease)
    return lease
  }

  private toResponse(ds: DevServerInternal, lease: LeaseInternal): AcquireResponse {
    return AcquireResponse.parse({
      lease: {
        id: lease.id,
        devServerId: lease.devServerId,
        slot: lease.slot,
        url: lease.url,
        expiresAt: new Date(lease.expiresAt).toISOString(),
      },
      devServer: toDevServer(ds),
    })
  }

  private transition(ds: DevServerInternal, to: DevServerStatus): void {
    assertTransition(ds.status, to)
    ds.status = to
    ds.updatedAt = new Date().toISOString()
  }
}

function toDevServer(ds: DevServerInternal): DevServer {
  return DevServer.parse({
    id: ds.id,
    pid: ds.pid,
    port: ds.port,
    status: ds.status,
    slot: ds.slot,
    cwd: ds.cwd,
    spawnedAt: ds.spawnedAt,
    updatedAt: ds.updatedAt,
  })
}

function defaultSpawnVite(cwd: string, port: Port, basePath: string, devDomain: string): ChildProcess {
  const localVite = resolvePath(cwd, 'node_modules', '.bin', 'vite')
  const useLocal = existsSync(localVite)
  // dist/devserver/orchestrator.js → ../vite-plugin/wrapper.js
  const wrapperPath = resolvePath(import.meta.dirname ?? '', '..', 'vite-plugin', 'wrapper.js')
  const args = ['--port', String(port)]
  if (existsSync(wrapperPath)) {
    args.push('--config', wrapperPath)
  }
  const branchMatch = basePath.match(/^\/branch--([^/]+)\/$/)
  const branch = branchMatch ? branchMatch[1]! : 'main'
  const env = {
    ...process.env,
    VITE_BASE_PATH: basePath,
    STORYBOARD_RUNTIME_BRANCH: branch,
    STORYBOARD_RUNTIME_DOMAIN: devDomain,
  }
  return useLocal
    ? spawn(localVite, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    : spawn('npx', ['vite', ...args], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
}
