import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import {
  AcquireRequest,
  AcquireResponse,
  Health,
  PoolStatus,
  ProxyRemoveRequest,
  ProxyState,
  ProxyUpsertRequest,
  ReleaseRequest,
  RuntimeError,
} from '../schema/index.js'
import type { z } from 'zod'

/**
 * Typed JS/TS client for the Storyboard Runtime daemon.
 *
 * Consumers should always go through this client rather than hand-rolling
 * `fetch` calls — the client is the only place where the daemon's URL is
 * known, and it's the only place where on-demand daemon spawning happens.
 */

const RUNTIME_BASE = 'http://127.0.0.1:4321'

export interface RuntimeClientOptions {
  /** Override base URL (mostly for tests). */
  baseUrl?: string
  /** Auto-start the daemon if it isn't running. Default: true. */
  autoStart?: boolean
}

export class RuntimeRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: z.infer<typeof RuntimeError>['code'],
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'RuntimeRequestError'
  }
}

async function request<S extends z.ZodTypeAny>(
  baseUrl: string,
  method: 'GET' | 'POST',
  path: string,
  body: unknown,
  responseSchema: S | null,
): Promise<S extends z.ZodTypeAny ? z.output<S> : void> {
  const init: RequestInit = {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }
  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, init)
  } catch (err) {
    throw new RuntimeRequestError(
      `Cannot reach Storyboard Runtime at ${baseUrl} — is the daemon running? (${(err as Error).message})`,
      0,
      'INTERNAL',
    )
  }
  const text = await res.text()
  let parsed: unknown
  try { parsed = text ? JSON.parse(text) : {} }
  catch { parsed = { error: text, code: 'INTERNAL' } }

  if (!res.ok) {
    const err = RuntimeError.safeParse(parsed)
    if (err.success) {
      throw new RuntimeRequestError(err.data.error, res.status, err.data.code, err.data.details)
    }
    throw new RuntimeRequestError(`HTTP ${res.status}`, res.status, 'INTERNAL', parsed)
  }
  if (responseSchema === null) return undefined as never
  return responseSchema.parse(parsed) as never
}

/**
 * Spawn the daemon as a detached child. Resolves once the health endpoint
 * answers (or rejects after a short timeout).
 */
async function spawnDaemon(baseUrl: string): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url))
  // bin/storyboard-runtime.js lives next to dist/, two levels up from
  // dist/runtime/client/index.js (the published path).
  const binPath = resolve(here, '..', '..', '..', 'bin', 'storyboard-runtime.js')
  const child = spawn(process.execPath, [binPath], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  })
  child.unref()

  // Poll /health until the daemon is up.
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${baseUrl}/health`)
      if (r.ok) return
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error(
    `Storyboard Runtime did not become ready within 5s ` +
    `(tried to spawn ${binPath})`,
  )
}

/**
 * Read the @dfosco/storyboard package.json version that this client is
 * shipping with. Used to detect mismatches against a long-lived daemon
 * that may have been spawned by a previous install.
 */
function readClientVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const candidates = [
      resolve(here, '..', '..', '..', 'package.json'),
      resolve(here, '..', '..', 'package.json'),
    ]
    for (const p of candidates) {
      if (existsSync(p)) {
        const pkg = JSON.parse(readFileSync(p, 'utf8')) as { version?: string }
        if (typeof pkg.version === 'string') return pkg.version
      }
    }
  } catch { /* ignore */ }
  return '0.0.0'
}

const CLIENT_VERSION = readClientVersion()

/**
 * Send SIGTERM to the daemon PID and clear its lock/pid files so
 * spawnDaemon() can start a fresh one.
 */
function killExistingDaemon(): void {
  try {
    const pidPath = resolve(process.env.HOME || '', '.storyboard', 'runtime.pid')
    if (!existsSync(pidPath)) return
    const pid = Number(readFileSync(pidPath, 'utf8').trim())
    if (Number.isFinite(pid) && pid > 0) {
      try { process.kill(pid, 'SIGTERM') } catch { /* already dead */ }
    }
  } catch { /* ignore */ }
}

/**
 * Tracks which (baseUrl, daemonVersion) pairs have already been warned about
 * within this process — and persists the last-warned daemon version to
 * `~/.storyboard/runtime.version-warned` so sibling CLI invocations
 * (`sb run` → `sb dev`) don't re-warn for the same daemon. Cleared on
 * `sb reset` (which also removes the daemon).
 */
const warnedInProcess = new Set<string>()
function versionWarnFile(): string {
  return resolve(process.env.HOME || '', '.storyboard', 'runtime.version-warned')
}
function alreadyWarnedForVersion(daemonVersion: string): boolean {
  try {
    const file = versionWarnFile()
    if (!existsSync(file)) return false
    return readFileSync(file, 'utf8').trim() === daemonVersion
  } catch { return false }
}
function recordWarnedForVersion(daemonVersion: string): void {
  try {
    const file = versionWarnFile()
    mkdirSync(resolve(process.env.HOME || '', '.storyboard'), { recursive: true })
    writeFileSync(file, daemonVersion)
  } catch { /* best-effort */ }
}

export class RuntimeClient {
  readonly baseUrl: string
  readonly autoStart: boolean

  constructor(opts: RuntimeClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? RUNTIME_BASE
    this.autoStart = opts.autoStart !== false
  }

  async health(opts: { silent?: boolean } = {}): Promise<Health> {
    try {
      const result = await request(this.baseUrl, 'GET', '/health', undefined, Health)
      // Auto-respawn on version mismatch — a long-lived daemon from a
      // previous install otherwise keeps serving stale code after upgrade.
      // Skip when client reports 0.0.0 (dev/source layout where package
      // version isn't meaningful).
      if (
        this.autoStart &&
        CLIENT_VERSION !== '0.0.0' &&
        result.version !== '0.0.0' &&
        result.version !== CLIENT_VERSION
      ) {
        // Don't kill a daemon that's actively hosting other dev servers —
        // doing so would SIGTERM every Vite child including ones owned by
        // unrelated repos. Multi-repo coexistence is the entire point of
        // running a shared daemon. Warn and reuse instead; the user can
        // manually `sb reset` when they're ready to upgrade.
        let activeCount = 0
        try {
          const listRes = await fetch(`${this.baseUrl}/devserver/list`)
          if (listRes.ok) {
            const data = await listRes.json() as { devServers?: unknown[] }
            activeCount = Array.isArray(data.devServers) ? data.devServers.length : 0
          }
        } catch { /* fall through; treat as zero */ }
        if (activeCount > 0) {
          const warnKey = `${this.baseUrl}::${result.version}`
          const shouldWarn = !opts.silent && !warnedInProcess.has(warnKey) && !alreadyWarnedForVersion(result.version)
          if (shouldWarn) {
            // eslint-disable-next-line no-console
            console.warn(
              `[storyboard] daemon version ${result.version} differs from client ${CLIENT_VERSION}, ` +
              `but ${activeCount} dev server(s) are active. Reusing the existing daemon. ` +
              `Run \`sb reset\` to restart it once those are stopped.`,
            )
            warnedInProcess.add(warnKey)
            recordWarnedForVersion(result.version)
          }
          return result
        }
        killExistingDaemon()
        // Give the OS a moment to release port 4321
        await new Promise(r => setTimeout(r, 250))
        await spawnDaemon(this.baseUrl)
        return request(this.baseUrl, 'GET', '/health', undefined, Health)
      }
      return result
    } catch (err) {
      if (this.autoStart && err instanceof RuntimeRequestError && err.status === 0) {
        await spawnDaemon(this.baseUrl)
        return request(this.baseUrl, 'GET', '/health', undefined, Health)
      }
      throw err
    }
  }

  async acquire(input: z.input<typeof AcquireRequest>): Promise<AcquireResponse> {
    // Force a health check first — this is the sole codepath that detects
    // a stale daemon (different version, crashed mid-restart, etc.) and
    // respawns it. Without this, `sb run` would happily POST against an
    // outdated daemon and inherit all of its bugs.
    if (this.autoStart) {
      try { await this.health({ silent: true }) } catch { /* health() will throw on hard failure; let acquire surface it */ }
    }
    const body = AcquireRequest.parse(input)
    return request(this.baseUrl, 'POST', '/devserver/acquire', body, AcquireResponse)
  }

  async release(input: z.input<typeof ReleaseRequest>): Promise<void> {
    const body = ReleaseRequest.parse(input)
    await request(this.baseUrl, 'POST', '/devserver/release', body, null)
  }

  async proxyState(): Promise<ProxyState> {
    return request(this.baseUrl, 'GET', '/proxy/state', undefined, ProxyState)
  }

  async proxyUpsert(input: z.input<typeof ProxyUpsertRequest>): Promise<ProxyState> {
    const body = ProxyUpsertRequest.parse(input)
    return request(this.baseUrl, 'POST', '/proxy/upsert', body, ProxyState)
  }

  async proxyRemove(input: z.input<typeof ProxyRemoveRequest>): Promise<ProxyState> {
    const body = ProxyRemoveRequest.parse(input)
    return request(this.baseUrl, 'POST', '/proxy/remove', body, ProxyState)
  }

  async poolStatus(): Promise<PoolStatus> {
    return request(this.baseUrl, 'GET', '/pool/status', undefined, PoolStatus)
  }
}

/** Default singleton client for casual callers. */
export const runtime = new RuntimeClient()
