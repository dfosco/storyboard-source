import http from 'node:http'
import { z } from 'zod'
import {
  AcquireRequest,
  AcquireResponse,
  DevDomain,
  Health,
  PoolStatus,
  Port,
  ProxyRemoveRequest,
  ProxyState,
  ProxyUpsertRequest,
  ReleaseRequest,
  RenewRequest,
  RuntimeError,
  WorktreeName,
} from '../schema/index.js'
import { ProxyController } from '../proxy/index.js'
import { CaddyUnreachableError } from '../proxy/caddy.js'
import { RUNTIME_PORT, RUNTIME_HOST, RUNTIME_VERSION } from './constants.js'

/**
 * The runtime's HTTP API.
 *
 * Every request is parsed through a zod schema *before* any handler runs;
 * malformed input never reaches the orchestrator. Every response is also
 * shape-checked in development to prevent accidental contract drift.
 *
 * M1 scaffold: all mutating endpoints return `501 NOT_IMPLEMENTED`. The
 * shapes, status codes, and validation are real — only the orchestrator
 * wiring is deferred to M2/M3.
 */

const startedAt = Date.now()

/**
 * Process-wide singleton. The runtime is one-per-machine, so a module-level
 * controller is fine — there's never more than one instance per node process.
 * Tests inject their own via createRuntimeServer({ proxyController }).
 */
let proxyController = new ProxyController()

function sendJson<S extends z.ZodTypeAny>(
  res: http.ServerResponse,
  status: number,
  body: z.output<S>,
  schema?: S,
): void {
  if (schema && process.env.NODE_ENV !== 'production') {
    schema.parse(body)
  }
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function sendError(
  res: http.ServerResponse,
  status: number,
  code: z.infer<typeof RuntimeError>['code'],
  message: string,
  details?: unknown,
): void {
  const body = RuntimeError.parse({ error: message, code, details })
  sendJson(res, status, body, RuntimeError)
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('Malformed JSON body')
  }
}

async function parseBody<S extends z.ZodTypeAny>(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  schema: S,
): Promise<z.output<S> | null> {
  let raw: unknown
  try {
    raw = await readJsonBody(req)
  } catch (err) {
    sendError(res, 400, 'BAD_REQUEST', (err as Error).message)
    return null
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Validation failed', result.error.flatten())
    return null
  }
  return result.data
}

type Route = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> | void

const routes = new Map<string, Route>()

routes.set('GET /health', (_req, res) => {
  const body: Health = Health.parse({
    ok: true,
    version: RUNTIME_VERSION,
    uptimeSeconds: (Date.now() - startedAt) / 1000,
    port: RUNTIME_PORT,
  })
  sendJson(res, 200, body, Health)
})

routes.set('POST /devserver/acquire', async (req, res) => {
  const body = await parseBody(req, res, AcquireRequest)
  if (!body) return
  // M3 implements this. The schema is real; the orchestrator is not.
  sendError(res, 501, 'NOT_IMPLEMENTED', 'devserver/acquire is implemented in M3 (DevServerOrchestrator)')
  void AcquireResponse
})

routes.set('POST /devserver/release', async (req, res) => {
  const body = await parseBody(req, res, ReleaseRequest)
  if (!body) return
  sendError(res, 501, 'NOT_IMPLEMENTED', 'devserver/release is implemented in M3')
})

routes.set('POST /devserver/renew', async (req, res) => {
  const body = await parseBody(req, res, RenewRequest)
  if (!body) return
  sendError(res, 501, 'NOT_IMPLEMENTED', 'devserver/renew is implemented in M3')
})

routes.set('GET /proxy/state', async (_req, res) => {
  try {
    const body = await proxyController.stateForApi()
    sendJson(res, 200, body, ProxyState)
  } catch (err) {
    sendError(res, 500, 'INTERNAL', (err as Error).message)
  }
})

routes.set('POST /proxy/upsert', async (req, res) => {
  const body = await parseBody(req, res, ProxyUpsertRequest)
  if (!body) return
  // Re-validate with branded types — the API request schema is intentionally
  // loose (string/number) so bad input gets a useful 400 rather than the
  // brand regex's cryptic message.
  const dev = DevDomain.safeParse(body.devDomain)
  const wt = WorktreeName.safeParse(body.worktree)
  const port = Port.safeParse(body.port)
  if (!dev.success || !wt.success || !port.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Validation failed', {
      devDomain: dev.success ? null : dev.error.flatten(),
      worktree: wt.success ? null : wt.error.flatten(),
      port: port.success ? null : port.error.flatten(),
    })
    return
  }
  if (dev.data === ('storyboard' as unknown as typeof dev.data)) {
    sendError(res, 403, 'FORBIDDEN_DEFAULT_DOMAIN',
      'Refusing to bind a route under the default devDomain "storyboard". ' +
      'Set a unique devDomain in storyboard.config.json.')
    return
  }
  try {
    const route = await proxyController.upsert(dev.data, wt.data, port.data)
    sendJson(res, 200, ProxyState.parse({ routes: [route], caddyReachable: true }), ProxyState)
  } catch (err) {
    if (err instanceof CaddyUnreachableError) {
      sendError(res, 503, 'CADDY_UNREACHABLE', err.message)
      return
    }
    sendError(res, 500, 'INTERNAL', (err as Error).message)
  }
})

routes.set('POST /proxy/remove', async (req, res) => {
  const body = await parseBody(req, res, ProxyRemoveRequest)
  if (!body) return
  const dev = DevDomain.safeParse(body.devDomain)
  const wt = WorktreeName.safeParse(body.worktree)
  if (!dev.success || !wt.success) {
    sendError(res, 400, 'BAD_REQUEST', 'Validation failed')
    return
  }
  try {
    await proxyController.removeWorktree(dev.data, wt.data)
    sendJson(res, 200, ProxyState.parse({ routes: [], caddyReachable: true }), ProxyState)
  } catch (err) {
    if (err instanceof CaddyUnreachableError) {
      sendError(res, 503, 'CADDY_UNREACHABLE', err.message)
      return
    }
    sendError(res, 500, 'INTERNAL', (err as Error).message)
  }
})

routes.set('GET /pool/status', (_req, res) => {
  const body = PoolStatus.parse({ warm: 0, bound: 0, capacity: 0 })
  sendJson(res, 200, body, PoolStatus)
})

export function createRuntimeServer(opts: { proxyController?: ProxyController } = {}): http.Server {
  if (opts.proxyController) proxyController = opts.proxyController
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${RUNTIME_HOST}:${RUNTIME_PORT}`)
      const key = `${req.method ?? 'GET'} ${url.pathname}`
      const handler = routes.get(key)
      if (!handler) {
        sendError(res, 404, 'NOT_FOUND', `No route for ${key}`)
        return
      }
      await handler(req, res)
    } catch (err) {
      sendError(res, 500, 'INTERNAL', (err as Error).message)
    }
  })
  return server
}
