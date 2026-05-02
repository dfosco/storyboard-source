/**
 * Storyboard Server — persistent Node.js process that manages dev sessions.
 *
 * Runs independently of Vite. Manages:
 * - Vite child processes (one per active branch)
 * - /_storyboard/ API (workshop, canvas, comments, worktrees, branch switching)
 * - Caddy proxy route registration
 *
 * Architecture:
 *   Browser → Caddy → Vite (serves app + static)
 *   Browser → Caddy → Storyboard Server (serves /_storyboard/ API)
 *   Storyboard Server → spawns/manages Vite processes
 */

import http from 'node:http'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { getPort, releasePort, repoRoot } from '../worktree/port.js'
import { generateCaddyfile, generateRouteConfig, upsertCaddyRoute, isCaddyRunning, reloadCaddy, readDevDomain } from '../cli/proxy.js'
import { compactAll } from '../canvas/compact.js'
import { register, unregister, generateId, list, findByWorktree } from '../worktree/serverRegistry.js'
import { createDevLogger } from '../logger/devLogger.js'

const SERVER_PORT_BASE = 4100

/**
 * Derive a deterministic server port from the devDomain.
 * Each repo (identified by its devDomain) gets its own port.
 */
function deriveServerPort(domain) {
  let h = 0
  for (let i = 0; i < domain.length; i++) {
    h = ((h << 5) - h + domain.charCodeAt(i)) | 0
  }
  // Map to port range 4100-4199
  return SERVER_PORT_BASE + (Math.abs(h) % 100)
}

const DEV_DOMAIN = readDevDomain()
export const SERVER_PORT = deriveServerPort(DEV_DOMAIN)
const HEALTH_TIMEOUT = 30_000
const HEALTH_INTERVAL = 300

/** Active Vite processes: branch name → { child, port, status, cwd } */
const processes = new Map()

/** Route handlers: prefix → handler function */
const routeHandlers = new Map()

// ─── Dev Logger ───

let _currentBranch = null
try { _currentBranch = (await import('node:child_process')).execSync('git branch --show-current', { encoding: 'utf8', cwd: repoRoot() }).trim() } catch { /* empty */ }
const devLogger = createDevLogger({ root: repoRoot(), devDomain: DEV_DOMAIN.replace('.localhost', ''), branch: _currentBranch })

// ─── JSON helpers ───

function sendJson(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(body)
}

function sendJsonLogged(res, status, data) {
  sendJson(res, status, data)
  if (status >= 400) {
    const ctx = res.__sbLogCtx || {}
    devLogger.logResponse({
      status,
      method: ctx.method || 'UNKNOWN',
      url: ctx.url || '',
      route: ctx.route || null,
      subRoute: ctx.subRoute || null,
      error: data?.error || null,
    })
  }
}

async function parseBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString()) }
  catch { return {} }
}

// ─── Vite Process Management ───

function resolveWorktreeCwd(branch) {
  const root = repoRoot()
  if (branch === 'main') return root
  const wtDir = join(root, 'worktrees', branch)
  if (existsSync(wtDir)) return wtDir
  return null
}

function isPortReady(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true))
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => { req.destroy(); resolve(false) })
  })
}

async function waitForPort(port, timeout = HEALTH_TIMEOUT) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await isPortReady(port)) return true
    await new Promise(r => setTimeout(r, HEALTH_INTERVAL))
  }
  return false
}

function buildBasePath(branch) {
  return branch === 'main' ? '/' : `/branch--${branch}/`
}

function spawnVite(branch) {
  const cwd = resolveWorktreeCwd(branch)
  if (!cwd) throw new Error(`Worktree not found for branch: ${branch}`)

  const port = getPort(branch)
  const basePath = buildBasePath(branch)
  const localVite = resolve(cwd, 'node_modules', '.bin', 'vite')
  const useLocalVite = existsSync(localVite)

  // Compact canvas files before starting
  try { compactAll(cwd) } catch { /* non-critical */ }

  const viteArgs = ['--port', String(port)]
  const child = useLocalVite
    ? spawn(localVite, viteArgs, {
        cwd,
        env: { ...process.env, VITE_BASE_PATH: basePath },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    : spawn('npx', ['vite', ...viteArgs], {
        cwd,
        env: { ...process.env, VITE_BASE_PATH: basePath },
        stdio: ['ignore', 'pipe', 'pipe'],
      })

  const entry = { child, port, status: 'starting', cwd, branch, serverId: generateId() }
  processes.set(branch, entry)

  // Register in persistent server registry
  register({ id: entry.serverId, worktree: branch, pid: child.pid, port, background: true })

  // Detect ready state from stdout
  child.stdout.on('data', (data) => {
    const text = data.toString()
    const portMatch = text.match(/localhost:(\d+)/)
    if (portMatch) {
      const actualPort = Number(portMatch[1])
      if (actualPort !== entry.port) {
        entry.port = actualPort
        // Re-register with the actual port Vite bound to
        register({ id: entry.serverId, worktree: branch, pid: child.pid, port: actualPort, background: true })
      }
    }
    if (text.includes('ready in')) {
      entry.status = 'ready'
      registerCaddyRoute(branch, entry.port)
    }
  })

  child.stderr.on('data', () => { /* suppress */ })

  child.on('exit', (_code) => {
    void _code
    entry.status = 'stopped'
    processes.delete(branch)
    unregister(entry.serverId)
    releasePort(branch)
  })

  return entry
}

function stopVite(branch) {
  const entry = processes.get(branch)
  if (!entry) return
  try { entry.child.kill('SIGTERM') } catch { /* */ }
  processes.delete(branch)
}

function registerCaddyRoute(branch, port) {
  try {
    const routeConfig = generateRouteConfig({ [branch]: port })
    if (isCaddyRunning() && upsertCaddyRoute(routeConfig)) {
      generateCaddyfile({ [branch]: port })
    } else {
      const caddyfilePath = generateCaddyfile({ [branch]: port })
      if (isCaddyRunning()) reloadCaddy(caddyfilePath)
    }
  } catch { /* Caddy not available */ }
}

// ─── API Routes ───

// POST /_storyboard/switch-branch
routeHandlers.set('switch-branch', async (req, res, ctx) => {
  if (ctx.method !== 'POST') {
    sendJsonLogged(res, 405, { error: 'POST required' })
    return
  }

  const { branch } = ctx.body
  if (!branch) {
    sendJsonLogged(res, 400, { error: 'branch is required' })
    return
  }

  const devDomain = readDevDomain()
  const targetUrl = branch === 'main'
    ? `http://${devDomain}/`
    : `http://${devDomain}/branch--${branch}/`

  try {
    // Check if already running
    const existing = processes.get(branch)
    if (existing && existing.status === 'ready') {
      const alive = await isPortReady(existing.port)
      if (alive) {
        sendJsonLogged(res, 200, { url: targetUrl, status: 'already_running' })
        return
      }
      // Stale entry — remove it
      processes.delete(branch)
    }

    // Check if Vite is already running in this server's process map
    const _port = getPort(branch)
    void _port
    const existingInRegistry = findByWorktree(branch)
    if (existingInRegistry.length > 0) {
      const latest = existingInRegistry.reduce((a, b) =>
        (a.startedAt || '') >= (b.startedAt || '') ? a : b
      )
      if (await isPortReady(latest.port)) {
        registerCaddyRoute(branch, latest.port)
        sendJsonLogged(res, 200, { url: targetUrl, status: 'already_running' })
        return
      }
    }

    // Check worktree exists
    const cwd = resolveWorktreeCwd(branch)
    if (!cwd) {
      sendJsonLogged(res, 404, { error: `Worktree not found: ${branch}. Create it with: npx storyboard dev ${branch}` })
      return
    }

    // Spawn Vite
    const entry = spawnVite(branch)

    // Wait for Vite to report ready via stdout (not TCP polling, which
    // can false-positive on occupied ports from other processes)
    const ready = await (async () => {
      const start = Date.now()
      while (Date.now() - start < HEALTH_TIMEOUT) {
        if (entry.status === 'ready') return true
        await new Promise(r => setTimeout(r, 300))
      }
      return false
    })()
    if (!ready) {
      stopVite(branch)
      sendJsonLogged(res, 504, { error: `Vite server for ${branch} did not become ready in time` })
      return
    }

    sendJsonLogged(res, 200, { url: targetUrl, status: 'started' })
  } catch (err) {
    sendJsonLogged(res, 500, { error: err.message })
  }
})

// GET /_storyboard/worktrees
routeHandlers.set('worktrees', async (req, res) => {
  try {
    // Use the server registry (live processes) instead of stale ports.json
    const servers = list()
    const branches = servers.map(srv => ({
      branch: srv.worktree,
      folder: srv.worktree === 'main' ? '' : `branch--${srv.worktree}/`,
      port: srv.port,
      running: processes.has(srv.worktree) ? processes.get(srv.worktree).status : 'background',
    }))
    // Always include main even if no server is registered for it
    if (!branches.some(b => b.branch === 'main')) {
      branches.unshift({ branch: 'main', folder: '', port: 1234, running: null })
    }
    sendJsonLogged(res, 200, branches)
  } catch { sendJsonLogged(res, 200, []) }
})

// GET /_storyboard/server/status
routeHandlers.set('server', async (req, res, ctx) => {
  if (ctx.path === '/status' || ctx.path === '/') {
    const active = []
    for (const [branch, entry] of processes) {
      active.push({ branch, port: entry.port, status: entry.status })
    }
    sendJsonLogged(res, 200, { active, serverPort: SERVER_PORT })
    return
  }
  sendJsonLogged(res, 404, { error: 'Unknown server route' })
})

// ─── HTTP Server ───

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${SERVER_PORT}`)
  const pathname = url.pathname

  // Route /_storyboard/{prefix}/{rest}
  if (pathname.startsWith('/_storyboard/')) {
    const after = pathname.slice('/_storyboard/'.length)
    const slashIdx = after.indexOf('/')
    const prefix = slashIdx === -1 ? after : after.slice(0, slashIdx)
    const restPath = slashIdx === -1 ? '/' : after.slice(slashIdx)

    // Attach route context for the logging sendJson wrapper
    res.__sbLogCtx = { method: req.method, url: req.url, route: prefix, subRoute: restPath }

    const handler = routeHandlers.get(prefix)
    if (handler) {
      let body = {}
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        body = await parseBody(req)
      }
      try {
        await handler(req, res, { body, path: restPath, method: req.method })
      } catch (err) {
        sendJsonLogged(res, 500, { error: err.message })
      }
      return
    }
  }

  // Health check
  if (pathname === '/health') {
    sendJsonLogged(res, 200, { ok: true, devDomain: DEV_DOMAIN })
    return
  }

  // Set context for catch-all 404
  res.__sbLogCtx = { method: req.method, url: req.url, route: null, subRoute: null }
  sendJsonLogged(res, 404, { error: 'Not found' })
})

export function startServer(port = SERVER_PORT) {
  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(Object.assign(new Error(`Port ${port} already in use`), { code: 'EADDRINUSE' }))
        return
      }
      reject(err)
    })
    server.listen(port, () => {
      resolve(server)
    })
  })
}

/** Public API for spawning Vite from CLI (with stdout piping) */
export function spawnViteForBranch(branch, { pipeOutput = false } = {}) {
  const entry = spawnVite(branch)

  if (pipeOutput) {
    entry.child.stdout.pipe(process.stdout)
    entry.child.stderr.pipe(process.stderr)
  }

  return entry
}

export { processes, routeHandlers, waitForPort, isPortReady }
