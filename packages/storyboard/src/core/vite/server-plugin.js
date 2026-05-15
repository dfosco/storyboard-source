/**
 * Storyboard Server Plugin — core dev-server infrastructure.
 *
 * Always-on Vite plugin that mounts a middleware backbone at `/_storyboard/`.
 * Reads `storyboard.config.json` for workshop features and plugin config.
 * Workshop API routes are wired directly; plugins register via the registry.
 *
 * Usage in vite.config.js:
 *   import storyboardServer from '@dfosco/storyboard/vite/server'
 *   storyboardServer()  // reads storyboard.config.json, no args needed
 */

import fs from 'node:fs'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'
import { getConfig } from '../stores/configSchema.js'
import { createDevLogger, setDevLogger } from '../logger/devLogger.js'
import { serverFeatures as workshopFeatures } from '../workshop/features/registry-server.js'
import { docsHandler, collectFiles } from './docs-handler.js'
import { createCanvasHandler } from '../canvas/server.js'
import { setupSelectedWidgets } from '../canvas/selectedWidgets.js'
import { HotPoolManager } from '../canvas/hot-pool.js'
import { createAutosyncHandler } from '../autosync/server.js'
import { setupTerminalServer } from '../canvas/terminal-server.js'
import { listSessions, detachSession, killSession, orphanSession, bulkCleanup, getSessionStats } from '../canvas/terminal-registry.js'
import { execSync as cpExecSync } from 'node:child_process'
import { list as listRunningServers, register as registerServer, unregister as unregisterServer, generateId as generateServerId, findByWorktree } from '../worktree/serverRegistry.js'
import { detectWorktreeName, listWorktrees, worktreeDir } from '../worktree/port.js'
import { initBus, subscribeAll } from '../messaging/bus.js'
import { JsonlAdapter } from '../messaging/storage/jsonl-adapter.js'
import { createMessagingRoutes } from '../messaging/routes.js'
import { initPresence } from '../messaging/presence.js'
import { initDeliveryBridge } from '../messaging/delivery.js'
import { getHubsMap } from '../messaging/hub-manager.js'
import { startMaintenance, stopMaintenance } from '../messaging/hub-maintenance.js'
import { createArtifactRoutes } from '../artifact/routes.js'

const API_PREFIX = '/_storyboard/'

/**
 * Parse JSON request body from an IncomingMessage.
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      if (!body) return resolve({})
      try { resolve(JSON.parse(body)) }
      catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

/**
 * Send a JSON response.
 */
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/**
 * Create a logging wrapper around sendJson.
 * Reads per-request route context from res.__sbLogCtx (set by middleware).
 */
function createLoggedSendJson(logger) {
  return function sendJsonLogged(res, status, data) {
    sendJson(res, status, data)
    if (status >= 400 && logger) {
      const ctx = res.__sbLogCtx || {}
      logger.logResponse({
        status,
        method: ctx.method || 'UNKNOWN',
        url: ctx.url || '',
        route: ctx.route || null,
        subRoute: ctx.subRoute || null,
        error: data?.error || null,
      })
    }
  }
}

/**
 * Read storyboard.config.json from the project root and apply defaults.
 */
function readConfig(root) {
  const configPath = path.join(root, 'storyboard.config.json')
  if (!fs.existsSync(configPath)) return getConfig({})
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    return getConfig(parseJsonc(raw) || {})
  } catch {
    return getConfig({})
  }
}

/**
 * Core storyboard server Vite plugin.
 */
export default function storyboardServer() {
  let root = ''
  let base = '/'
  let config = {}
  let isDev = false

  // Route handler registry — plugins register here during setup
  const routeHandlers = new Map()
  const clientScripts = []

  return {
    name: 'storyboard-server',

    config() {
      return {
        optimizeDeps: {
          include: [
            'highlight.js/lib/core',
            'highlight.js/lib/languages/javascript',
            'highlight.js/lib/languages/typescript',
            'highlight.js/lib/languages/xml',
          ],
        },
      }
    },

    configResolved(viteConfig) {
      root = viteConfig.root
      base = viteConfig.base || '/'
      config = readConfig(root)
      isDev = viteConfig.command === 'serve'
    },

    configureServer(server) {
      // --- Reload guard ----------------------------------------------------------
      // Suppress full-reloads and HMR updates for guarded clients.
      //
      // Two guard channels:
      //   1. Canvas guard — canvas pages send heartbeats via storyboard:canvas-hmr-guard.
      //      Controlled by the "canvas-auto-reload" feature flag (default: false = guard ON).
      //   2. Prototype guard — all pages send heartbeats via storyboard:prototype-reload-guard.
      //      Controlled by the "prototype-auto-reload" feature flag (default: true = guard OFF).
      //
      // Both guards auto-expire 5s after the last heartbeat so closed tabs never
      // leave them stuck. Custom storyboard events always pass through.
      {
        let recentCanvasMutationAt = 0
        const CANVAS_WINDOW_MS = 1500
        const GUARD_TTL_MS = 5000
        const isCanvasFile = (file = '') => /\.canvas\.jsonl$/i.test(file.replace(/\\/g, '/'))

        const markCanvasMutation = (file = '') => {
          if (isCanvasFile(file)) recentCanvasMutationAt = Date.now()
        }

        server.watcher.on('change', markCanvasMutation)
        server.watcher.on('add', markCanvasMutation)
        server.watcher.on('unlink', markCanvasMutation)

        const canvasGuardedClients = new Map()
        const prototypeGuardedClients = new Map()

        server.hot.on('storyboard:canvas-hmr-guard', (data, client) => {
          if (data.active) {
            canvasGuardedClients.set(client, Date.now() + GUARD_TTL_MS)
          } else {
            canvasGuardedClients.delete(client)
          }
        })

        server.hot.on('storyboard:prototype-reload-guard', (data, client) => {
          if (data.active) {
            prototypeGuardedClients.set(client, Date.now() + GUARD_TTL_MS)
          } else {
            prototypeGuardedClients.delete(client)
          }
        })

        const cleanup = setInterval(() => {
          const now = Date.now()
          for (const [client, until] of canvasGuardedClients) {
            if (now > until || !server.ws.clients.has(client)) {
              canvasGuardedClients.delete(client)
            }
          }
          for (const [client, until] of prototypeGuardedClients) {
            if (now > until || !server.ws.clients.has(client)) {
              prototypeGuardedClients.delete(client)
            }
          }
        }, 10000)
        server.httpServer?.on('close', () => clearInterval(cleanup))
        server.httpServer?.on('close', () => stopMaintenance())

        function isClientGuarded(client) {
          const cu = canvasGuardedClients.get(client)
          if (cu != null && Date.now() < cu) return true
          const pu = prototypeGuardedClients.get(client)
          if (pu != null && Date.now() < pu) return true
          return false
        }

        const originalSend = server.ws.send.bind(server.ws)
        server.ws.send = (payload, ...rest) => {
          // Suppress broadcast reloads within the canvas mutation window
          if (
            payload &&
            payload.type === 'full-reload' &&
            Date.now() - recentCanvasMutationAt < CANVAS_WINDOW_MS
          ) {
            return
          }

          // No guarded clients → broadcast normally
          if (canvasGuardedClients.size === 0 && prototypeGuardedClients.size === 0) {
            return originalSend(payload, ...rest)
          }

          // For reload/update payloads, send only to unguarded clients
          if (payload && (payload.type === 'full-reload' || payload.type === 'update')) {
            for (const client of server.ws.clients) {
              if (!isClientGuarded(client)) {
                client.send(payload)
              }
            }
            return
          }

          // Everything else (custom events, errors) broadcasts normally
          return originalSend(payload, ...rest)
        }
      }
      // --- End reload guard ------------------------------------------------------

      // Initialize dev logger for structured o11y logging
      let currentBranch = null
      try { currentBranch = cpExecSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim() } catch { /* empty */ }
      const logVerbose = config.featureFlags?.['dev-logs'] || false
      const devDomain = config.repository?.name || null
      const devLogger = createDevLogger({ root, devDomain, branch: currentBranch, verbose: logVerbose })
      setDevLogger(devLogger) // make available to all server-side modules via devLog()
      const sendJsonLogged = createLoggedSendJson(devLogger)

      // Listen for browser-side console errors forwarded via HMR
      server.hot.on('storyboard:client-error', (data) => {
        devLogger.logEvent(data.level || 'error', data.message || 'Unknown browser error', {
          source: 'browser',
          url: data.url || null,
          line: data.line || null,
          col: data.col || null,
          stack: data.stack || null,
          route: data.route || null,
        })
      })

      const workshopConfig = config.workshop || {}
      const enabledFeatures = workshopConfig.features || {}

      // Wire workshop API routes — compose handlers from all enabled features
      const workshopHandlers = []
      for (const [featureName, featureModule] of Object.entries(workshopFeatures)) {
        if (enabledFeatures[featureName] === false) continue
        if (featureModule.serverSetup) {
          workshopHandlers.push(featureModule.serverSetup({ root, sendJson: sendJsonLogged, workshopConfig }))
        }
      }
      if (workshopHandlers.length > 0) {
        routeHandlers.set('workshop', async (req, res, ctx) => {
          for (const handler of workshopHandlers) {
            await handler(req, res, ctx)
            if (res.writableEnded) return
          }
          sendJsonLogged(res, 404, { error: `Unknown workshop route: ${ctx.method} ${ctx.path}` })
        })
      }

      // Wire docs API routes (always enabled — serves README + source files)
      routeHandlers.set('docs', docsHandler({ root, sendJson: sendJsonLogged }))

      // Create shared hot pool manager (per-type pre-warmed sessions)
      const hotPoolConfig = config.hotPool || {}
      const agentsConfig = config.canvas?.agents || {}
      const wsSend = server.ws.send.bind(server.ws)
      const hotPool = new HotPoolManager({ root, config: hotPoolConfig, agentsConfig, wsSend })
      hotPool.start().catch((err) => {
        devLogger.logEvent('error', 'Hot pool failed to start', { error: err.message })
      })

      // Kill pool sessions on shutdown (prevents zombie tmux accumulation)
      const shutdownPool = () => { hotPool.stop() }
      process.on('SIGINT', shutdownPool)
      process.on('SIGTERM', shutdownPool)
      server.httpServer?.on('close', shutdownPool)

      // Wire canvas API routes (always enabled — CRUD for .canvas.jsonl files)
      routeHandlers.set('canvas', createCanvasHandler({ root, sendJson: sendJsonLogged, hotPool }))

      // Selected widgets bridge — writes .selectedwidgets.json for Copilot context
      setupSelectedWidgets(server, root)

      // Terminal WebSocket server — PTY backend for terminal canvas widgets
      if (server.httpServer) {
        let branch = 'unknown'
        try {
          branch = cpExecSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }
        setupTerminalServer(server.httpServer, base, branch, hotPool)
      }

      // Self-register in .storyboard/servers.json so sibling workflows
      // (cli helpers, BranchBar, agent terminals) can discover this Vite.
      // Registration happens once the HTTP server is actually listening so
      // the recorded port is the real one (handles strictPort fallbacks).
      if (server.httpServer) {
        const serverId = generateServerId()
        const worktreeName = detectWorktreeName()
        const onListening = () => {
          try {
            const addr = server.httpServer.address()
            const port = typeof addr === 'object' && addr ? addr.port : null
            if (port) {
              registerServer({ id: serverId, worktree: worktreeName, pid: process.pid, port }, root)
            }
          } catch { /* best effort */ }
        }
        if (server.httpServer.listening) onListening()
        else server.httpServer.once('listening', onListening)

        const unregister = () => {
          try { unregisterServer(serverId, root) } catch { /* */ }
        }
        server.httpServer.on('close', unregister)
        process.on('SIGINT', unregister)
        process.on('SIGTERM', unregister)
        process.on('exit', unregister)
      }

      // Ignore assets/canvas/ so image/snapshot writes don't trigger reloads
      server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'images'))
      server.watcher.unwatch(path.join(root, 'assets', 'canvas', 'snapshots'))
      server.watcher.unwatch(path.join(root, 'assets', '.storyboard-public', 'terminal-snapshots'))
      // The entire `.storyboard/` directory is gitignored runtime state
      // (terminal buffers + snapshots, hub messages, selectedwidgets,
      // logs, server registry). None of it should ever feed Vite's
      // watcher — active terminals especially write here on a sub-second
      // cadence, which previously produced full-reload loops on any
      // route without the canvas/prototype HMR guard.
      server.watcher.unwatch(path.join(root, '.storyboard'))

      // Wire autosync API routes (always enabled — git automation for dev)
      routeHandlers.set('autosync', createAutosyncHandler({ root, sendJson: sendJsonLogged }))

      // Wire messaging bus (shared event log for multi-agent communication)
      const messagingAdapter = new JsonlAdapter({ root })
      messagingAdapter.initSync()
      initBus(messagingAdapter)
      initPresence()
      initDeliveryBridge({ root })
      routeHandlers.set('messages', createMessagingRoutes({ sendJson: sendJsonLogged }))

      // Artifact CRUD API
      routeHandlers.set('artifact', createArtifactRoutes({ root, sendJson: sendJsonLogged }))

      // Push all bus events to browser clients via Vite HMR WebSocket
      subscribeAll((channel, event) => {
        server.ws.send({
          type: 'custom',
          event: 'storyboard:message',
          data: { channel, event },
        })
      })

      // Start hub maintenance (conversation timeouts, cleanup)
      startMaintenance(getHubsMap(), {
        conversationTimeoutMinutes: 30,
      })

      // Terminal sessions API — list, detach, kill sessions
      routeHandlers.set('terminal', async (req, res, ctx) => {
        // Strip query string and leading slash from path
        const rawPath = (ctx.path || '/').replace(/^\//, '')
        const subpath = rawPath.split('?')[0]

        // GET /sessions — list all sessions (optional ?branch= filter)
        if (ctx.method === 'GET' && (subpath === 'sessions' || subpath === 'sessions/')) {
          const url = new URL(req.url, 'http://localhost')
          const filterBranch = url.searchParams.get('branch') || null
          sendJsonLogged(res, 200, { sessions: listSessions(filterBranch) })
          return
        }

        // GET /sessions/stats — quick session counts by status
        if (ctx.method === 'GET' && subpath === 'sessions/stats') {
          sendJsonLogged(res, 200, getSessionStats())
          return
        }

        // POST /sessions/cleanup — bulk remove sessions by status
        if (ctx.method === 'POST' && subpath === 'sessions/cleanup') {
          try {
            const { statuses } = ctx.body || {}
            const allowed = new Set(['archived', 'background'])
            if (!Array.isArray(statuses) || statuses.length === 0) {
              sendJsonLogged(res, 400, { error: 'statuses must be a non-empty array' })
              return
            }
            const invalid = statuses.filter(s => !allowed.has(s))
            if (invalid.length > 0) {
              sendJsonLogged(res, 400, { error: `Invalid statuses: ${invalid.join(', ')}. Allowed: archived, background` })
              return
            }
            const result = bulkCleanup({ statuses })
            sendJsonLogged(res, 200, { success: true, ...result })
          } catch {
            sendJsonLogged(res, 400, { error: 'Invalid JSON body' })
          }
          return
        }

        // POST /sessions/:name/detach — detach a session
        const detachMatch = subpath.match(/^sessions\/(.+)\/detach$/)
        if (ctx.method === 'POST' && detachMatch) {
          const tmuxName = decodeURIComponent(detachMatch[1])
          const entry = detachSession(tmuxName)
          if (!entry) {
            sendJsonLogged(res, 404, { error: 'Session not found' })
            return
          }
          sendJsonLogged(res, 200, { success: true, session: entry })
          return
        }

        // POST /sessions/:name/orphan — archive a session with grace timer
        const orphanMatch = subpath.match(/^sessions\/(.+)\/orphan$/)
        if (ctx.method === 'POST' && orphanMatch) {
          const tmuxName = decodeURIComponent(orphanMatch[1])
          orphanSession(tmuxName)
          sendJsonLogged(res, 200, { success: true })
          return
        }

        // DELETE /sessions/:name — kill a session immediately
        const deleteMatch = subpath.match(/^sessions\/(.+)$/)
        if (ctx.method === 'DELETE' && deleteMatch) {
          const tmuxName = decodeURIComponent(deleteMatch[1])
          killSession(tmuxName)
          sendJsonLogged(res, 200, { success: true })
          return
        }

        // ── Hot Pool routes (/terminal/hot-pool/*) ──────────────

        // GET /hot-pool — pool status
        if (ctx.method === 'GET' && subpath === 'hot-pool') {
          sendJsonLogged(res, 200, hotPool.status())
          return
        }

        // PUT /hot-pool — reconfigure pool
        if (ctx.method === 'PUT' && subpath === 'hot-pool') {
          hotPool.reconfigure(ctx.body || {})
          sendJsonLogged(res, 200, hotPool.status())
          return
        }

        // POST /hot-pool/acquire — acquire a warm session from a specific pool
        if (ctx.method === 'POST' && subpath === 'hot-pool/acquire') {
          const poolId = ctx.body?.poolId || 'terminal'
          const session = hotPool.acquire(poolId)
          if (!session) {
            sendJsonLogged(res, 200, { acquired: false, poolId, session: null })
            return
          }
          sendJsonLogged(res, 200, { acquired: true, poolId, session: { id: session.id, tmuxName: session.tmuxName, poolId: session.poolId } })
          return
        }

        sendJsonLogged(res, 404, { error: 'Not found' })
      })

      // Worktrees API — merge live registry with on-disk worktree list so the
      // BranchBar can show running siblings (with port + url) AND siblings
      // that exist but aren't running (so the UI can offer to spin them up).
      routeHandlers.set('worktrees', async (req, res) => {
        try {
          const servers = listRunningServers(root)
          const runningByName = new Map(servers.map(s => [s.worktree, s]))
          const allNames = new Set(['main', ...listWorktrees(root)])
          for (const name of runningByName.keys()) allNames.add(name)

          const branches = []
          for (const name of allNames) {
            const srv = runningByName.get(name)
            const isMain = name === 'main'
            branches.push({
              branch: name,
              folder: isMain ? '' : `branch--${name}/`,
              running: !!srv,
              port: srv?.port ?? null,
              url: srv ? `http://localhost:${srv.port}/storyboard/` : null,
            })
          }
          // Main first, then alphabetical
          branches.sort((a, b) => a.branch === 'main' ? -1 : b.branch === 'main' ? 1 : a.branch.localeCompare(b.branch))
          sendJsonLogged(res, 200, branches)
        } catch { sendJsonLogged(res, 200, []) }
      })

      // Switch-branch API — spawn a detached `storyboard dev` for the
      // requested worktree and wait until it self-registers, then return
      // its URL so the BranchBar can navigate directly.
      routeHandlers.set('switch-branch', async (req, res) => {
        const body = await new Promise((resolve) => {
          let buf = ''
          req.on('data', (c) => buf += c)
          req.on('end', () => { try { resolve(JSON.parse(buf || '{}')) } catch { resolve({}) } })
          req.on('error', () => resolve({}))
        })
        const branch = String(body.branch || '').trim()
        if (!branch) { sendJsonLogged(res, 400, { error: 'Missing "branch"' }); return }

        // Already running? Return immediately.
        const existing = findByWorktree(branch, root)
        if (existing.length > 0) {
          const srv = existing[0]
          sendJsonLogged(res, 200, { status: 'already_running', url: `http://localhost:${srv.port}/storyboard/`, port: srv.port, id: srv.id })
          return
        }

        // Resolve target cwd
        const cwd = branch === 'main' ? root : worktreeDir(branch, root)
        if (!fs.existsSync(path.resolve(cwd, '.git'))) {
          sendJsonLogged(res, 404, { error: `Worktree "${branch}" does not exist` })
          return
        }

        // Detached spawn — exits independently of this Vite process.
        const { spawn } = await import('node:child_process')
        const npmBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'
        try {
          const child = spawn(npmBin, ['storyboard', 'dev'], { cwd, detached: true, stdio: 'ignore' })
          child.unref()
        } catch (err) {
          sendJsonLogged(res, 500, { error: `Spawn failed: ${err.message}` })
          return
        }

        // Poll registry up to 30s.
        const start = Date.now()
        while (Date.now() - start < 30000) {
          await new Promise(r => setTimeout(r, 500))
          const matches = findByWorktree(branch, root)
          if (matches.length > 0) {
            const srv = matches[matches.length - 1]
            sendJsonLogged(res, 200, { status: 'started', url: `http://localhost:${srv.port}/storyboard/`, port: srv.port, id: srv.id })
            return
          }
        }
        sendJsonLogged(res, 504, { error: `Spawned but did not self-register within 30s` })
      })

      // Git user — return git config user name and GitHub login (via gh CLI)
      routeHandlers.set('git-user', async (req, res) => {
        try {
          const { execSync } = await import('node:child_process')
          const name = execSync('git config user.name', { cwd: root, encoding: 'utf8' }).trim()
          let login = null
          try {
            const status = execSync('gh auth status 2>&1', { cwd: root, encoding: 'utf8' })
            const m = status.match(/Logged in to github\.com account (\S+)/) || status.match(/Logged in to github\.com as (\S+)/)
            if (m) login = m[1]
          } catch { /* gh not installed or not logged in */ }
          sendJsonLogged(res, 200, { name, login })
        } catch { sendJsonLogged(res, 200, { name: null, login: null }) }
      })

      // Current branch — live read of HEAD via git. The BranchBar uses
      // this as the source of truth instead of parsing /branch--<name>/
      // out of the URL (which doesn't exist anymore).
      routeHandlers.set('current-branch', async (req, res) => {
        try {
          const { execSync } = await import('node:child_process')
          const branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim() || null
          sendJsonLogged(res, 200, { branch })
        } catch { sendJsonLogged(res, 200, { branch: null }) }
      })

      // Watch toolbar.config.json for changes — trigger full reload so
      // CoreUIBar.jsx picks up menu/mode config changes during dev
      const toolbarConfigPath = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../toolbar.config.json'
      )
      server.watcher.add(toolbarConfigPath)
      server.watcher.on('change', (filePath) => {
        if (path.resolve(filePath) === toolbarConfigPath) {
          // Invalidate the cached JSON module so Vite re-reads from disk
          const mods = server.moduleGraph.getModulesByFile(toolbarConfigPath)
          if (mods) {
            for (const mod of mods) {
              server.moduleGraph.invalidateModule(mod)
            }
          }
          server.ws.send({ type: 'full-reload' })
        }
      })

      // Workshop client UI is now mounted by mountStoryboardCore() via the
      // compiled UI bundle. No script injection needed.

      // Plugin registry for external plugins (future use).
      // Plugins call registerRoutes/registerClientScript in their setup().
      // const pluginCtx = { server, root, config, registerRoutes, registerClientScript }
      // Future: auto-discover and initialize plugins from pluginsConfig here

      // Mount the /_storyboard/ middleware router
      // Vite's dev server strips the base path from req.url for middleware,
      // but the base-redirect plugin may redirect bare URLs first.
      // We check both with and without base prefix.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        // Strip base path if present to normalize the URL
        let url = req.url
        const baseNoTrail = base.replace(/\/$/, '')
        if (baseNoTrail && url.startsWith(baseNoTrail)) {
          url = url.slice(baseNoTrail.length) || '/'
        }

        if (!url.startsWith(API_PREFIX)) return next()

        // Parse: /_storyboard/{prefix}/{rest}
        const pathAfterPrefix = url.slice(API_PREFIX.length)
        const slashIndex = pathAfterPrefix.indexOf('/')
        const prefix = slashIndex === -1 ? pathAfterPrefix : pathAfterPrefix.slice(0, slashIndex)
        const restPath = slashIndex === -1 ? '/' : pathAfterPrefix.slice(slashIndex)

        // Attach route context for the logging sendJson wrapper
        res.__sbLogCtx = { method: req.method, url, route: prefix, subRoute: restPath }

        const handler = routeHandlers.get(prefix)
        if (!handler) {
          // Proxy to standalone storyboard server for unhandled prefixes
          try {
            const proxyReq = await import('node:http')
            const proxyUrl = `http://localhost:4100${url}`
            const proxy = proxyReq.default.request(proxyUrl, { method: req.method, headers: req.headers }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, proxyRes.headers)
              proxyRes.pipe(res)
            })
            proxy.on('error', () => {
              sendJsonLogged(res, 502, { error: `Storyboard server not running. Start it with: npx storyboard server` })
            })
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              req.pipe(proxy)
            } else {
              proxy.end()
            }
          } catch {
            sendJsonLogged(res, 502, { error: 'Storyboard server not running' })
          }
          return
        }

        try {
          let body = {}
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
            body = await parseJsonBody(req)
          }
          await handler(req, res, { body, path: restPath, method: req.method, __viteWs: server.ws })
        } catch (err) {
          sendJsonLogged(res, 500, { error: err.message || 'Internal server error' })
        }
      })
    },

    transformIndexHtml() {
      const tags = []

      // Inject local dev flag only during dev server (not production builds)
      if (isDev) {
        tags.push({
          tag: 'script',
          children: 'window.__SB_LOCAL_DEV__=true',
          injectTo: 'head',
        })

        // Inject dev domain name for branch bar display.
        // Sourced from config.repository.name, with the project directory
        // basename as a fallback so every repo gets a labelled bar even
        // before storyboard.config.json is filled in.
        // Use the main repo root (not cwd) so worktrees don't shadow the
        // project name with the worktree directory name (which often equals
        // the branch name).
        let projectRoot = process.cwd()
        try {
          const commonDir = cpExecSync('git rev-parse --path-format=absolute --git-common-dir', {
            cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
          }).trim()
          if (commonDir) projectRoot = commonDir.replace(/\/?\.git\/?$/, '') || projectRoot
        } catch { /* not a git repo — fall back to cwd */ }
        const devDomainLabel = config.repository?.name || path.basename(projectRoot)
        if (devDomainLabel) {
          tags.push({
            tag: 'script',
            children: `window.__SB_DEV_DOMAIN__=${JSON.stringify(devDomainLabel)}`,
            injectTo: 'head',
          })
        }

        // Inject per-domain branch bar color (configurable via devDomainColor)
        if (config.devDomainColor) {
          tags.push({
            tag: 'script',
            children: `window.__SB_DEV_DOMAIN_COLOR__=${JSON.stringify(config.devDomainColor)}`,
            injectTo: 'head',
          })
        }

        // Browser error bridge — forwards console.error/warn and uncaught
        // exceptions to the dev server via HMR for structured o11y logging
        tags.push({
          tag: 'script',
          attrs: { type: 'module' },
          children: `
(function() {
  if (!import.meta.hot) return;
  var MAX_LEN = 2000;
  function trunc(s) { return typeof s === 'string' && s.length > MAX_LEN ? s.slice(0, MAX_LEN) + '…' : s; }
  function route() { return location.pathname + location.hash; }
  function send(level, msg, extra) {
    try { import.meta.hot.send('storyboard:client-error', Object.assign({ level: level, message: trunc(msg), route: route() }, extra || {})); } catch {}
  }
  // Patch console.error and console.warn
  ['error', 'warn'].forEach(function(level) {
    var orig = console[level];
    console[level] = function() {
      orig.apply(console, arguments);
      var parts = [];
      for (var i = 0; i < arguments.length; i++) {
        try { parts.push(typeof arguments[i] === 'string' ? arguments[i] : JSON.stringify(arguments[i])); } catch { parts.push(String(arguments[i])); }
      }
      send(level, parts.join(' '));
    };
  });
  // Uncaught errors
  window.addEventListener('error', function(e) {
    send('error', e.message || 'Uncaught error', { url: e.filename, line: e.lineno, col: e.colno, stack: trunc(e.error && e.error.stack) });
  });
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled rejection';
    send('error', msg, { stack: trunc(e.reason && e.reason.stack) });
  });
})();
`.trim(),
          injectTo: 'head',
        })
      }

      // Inject base path so the inspector UI can resolve static assets
      // (e.g. inspector.json) when deployed under a subpath
      tags.push({
        tag: 'script',
        children: `window.__STORYBOARD_BASE_PATH__=${JSON.stringify(base)}`,
        injectTo: 'head',
      })

      for (const src of clientScripts) {
        tags.push({
          tag: 'script',
          attrs: { type: 'module', src: base + src.replace(/^\//, '') },
          injectTo: 'body',
        })
      }

      return tags
    },

    // Build-time: emit a static JSON with source files so the inspector
    // works in deployed environments without the dev middleware.
    async generateBundle() {
      const srcDir = path.join(root, 'src')
      const prototypesDir = path.join(root, 'src', 'prototypes')

      // Collect file lists (prototypes for the files index, all src/ for sources)
      const [prototypeFiles, allSrcFiles] = await Promise.all([
        collectFiles(prototypesDir, root),
        collectFiles(srcDir, root),
      ])

      // Read all source file contents
      const sources = {}
      await Promise.all(
        allSrcFiles.map(async (relPath) => {
          try {
            sources[relPath] = await fs.promises.readFile(
              path.join(root, relPath),
              'utf-8'
            )
          } catch { /* skip unreadable files */ }
        })
      )

      // Resolve repo info (same logic as docs-handler)
      let repo = null
      try {
        const { execSync } = await import('node:child_process')
        const remote = execSync('git remote get-url origin', {
          cwd: root,
          encoding: 'utf-8',
        }).trim()
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
        if (match) repo = { owner: match[1], name: match[2] }
      } catch { /* no git or no remote */ }

      if (!repo) {
        const configPath = path.join(root, 'storyboard.config.json')
        try {
          const raw = await fs.promises.readFile(configPath, 'utf-8')
          const cfg = JSON.parse(raw)
          if (cfg.repository?.owner && cfg.repository?.name) {
            repo = { owner: cfg.repository.owner, name: cfg.repository.name }
          }
        } catch { /* config not available */ }
      }

      this.emitFile({
        type: 'asset',
        fileName: '_storyboard/inspector.json',
        source: JSON.stringify({
          files: prototypeFiles.sort(),
          sources,
          repo,
        }),
      })

      // Emit README as static JSON so the docs panel works in deployed builds.
      // Dev server serves this dynamically; production needs the static file.
      let readmeContent = null
      for (const candidate of ['README.md', 'readme.md', 'Readme.md']) {
        try {
          readmeContent = await fs.promises.readFile(path.join(root, candidate), 'utf-8')
          break
        } catch { /* try next */ }
      }
      if (readmeContent) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/docs/readme',
          source: JSON.stringify({ content: readmeContent, path: 'README.md' }),
        })
      }

      // Emit repo info so the docs panel GitHub link works in deployed builds.
      if (repo) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/docs/repo',
          source: JSON.stringify(repo),
        })
      }

      // Emit story sources JSON so the "show code" widget action works in
      // deployed builds. In dev, StoryWidget uses Vite's ?raw import; in prod
      // it fetches this static JSON instead.
      const storySources = {}
      const storyExts = ['.story.jsx', '.story.tsx', '.story.js', '.story.ts']
      for (const relPath of allSrcFiles) {
        if (storyExts.some(ext => relPath.endsWith(ext))) {
          storySources[relPath] = sources[relPath] || ''
        }
      }
      if (Object.keys(storySources).length > 0) {
        this.emitFile({
          type: 'asset',
          fileName: '_storyboard/stories/sources.json',
          source: JSON.stringify(storySources),
        })
      }

      // Emit canvas images so they're available in deployed (static) builds.
      // Dev server serves these dynamically; production needs the static files.
      // Private images (prefixed with ~) are excluded from the build.
      for (const dir of [
        path.join(root, 'assets', 'canvas', 'images'),
        path.join(root, 'assets', 'canvas', 'snapshots'),
      ]) {
        try {
          const imageFiles = await fs.promises.readdir(dir)
          const subdir = dir.endsWith('snapshots') ? 'snapshots' : 'images'
          for (const file of imageFiles) {
            if (file.startsWith('~') || file.startsWith('.')) continue
            try {
              const data = await fs.promises.readFile(path.join(dir, file))
              this.emitFile({
                type: 'asset',
                fileName: `_storyboard/canvas/${subdir}/${file}`,
                source: data,
              })
            } catch { /* skip unreadable files */ }
          }
        } catch { /* directory doesn't exist */ }
      }

      // GitHub Pages uses Jekyll which ignores _-prefixed directories.
      // Emit .nojekyll to ensure _storyboard/ is served.
      this.emitFile({
        type: 'asset',
        fileName: '.nojekyll',
        source: '',
      })

      // Emit CNAME for GitHub Pages custom domain if configured.
      // Without this, deploy scripts that clean the gh-pages root will
      // delete the CNAME on every push, causing intermittent 404s.
      const customDomain = (config.customDomain || '').trim()
      if (customDomain && !customDomain.includes('/') && !customDomain.includes(':') && !customDomain.includes(' ')) {
        this.emitFile({
          type: 'asset',
          fileName: 'CNAME',
          source: customDomain + '\n',
        })
      }
    },
  }
}

export { sendJson }
