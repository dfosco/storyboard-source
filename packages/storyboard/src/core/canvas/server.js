/**
 * Canvas Server API — CRUD operations for .canvas.jsonl files.
 *
 * Canvas data is stored as an append-only JSONL event stream.
 * Each line is a JSON event object. The first line is always a
 * `canvas_created` event containing the full initial state.
 * Subsequent lines are atomic change events. Current state is
 * derived by replaying the stream via the materializer.
 *
 * Routes (mounted at /_storyboard/canvas/):
 *   GET    /read     — read materialized canvas state
 *   GET    /list     — list all canvases
 *   GET    /folders  — list canvas folders
 *   PUT    /update   — append update events (widgets, sources, settings)
 *   PUT    /rename-page — rename a canvas page file
 *   PUT    /reorder-pages — save page order for a canvas folder
 *   GET    /page-order — read page order for a folder
 *   PUT    /update-folder-meta — update folder .meta.json title
 *   POST   /widget   — append a widget_added event
 *   PATCH  /widget   — update a single widget's props/position
 *   DELETE /widget   — append a widget_removed event
 *   POST   /connector — append a connector_added event
 *   DELETE /connector — append a connector_removed event
 *   POST   /batch    — execute multiple operations in one request (refs, single HMR push)
 *   POST   /create   — create a new .canvas.jsonl file
 *   GET    /stories  — list all .story.{jsx,tsx} files with exports
 *   POST   /create-story — scaffold a new .story.{jsx,tsx} file
 *   GET    /github/available — check if local gh CLI is installed
 *   POST   /github/embed — fetch GitHub issue/discussion/PR/comment metadata via gh
 *   POST   /image    — upload a pasted image to src/canvas/images/
 *   GET    /images/* — serve an image file from src/canvas/images/
 *   POST   /image/toggle-private — toggle ~prefix on image filename
 *   GET    /terminal-buffer/:id — read private terminal buffer (with ?length=N)
 *   GET    /terminal-snapshot/:id — read public terminal snapshot
 */

import fs from 'node:fs'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { materializeFromText, serializeEvent } from './materializer.js'
import { toCanvasId, parseCanvasId } from './identity.js'
import {
  GH_INSTALL_URL,
  GitHubEmbedError,
  fetchGitHubEmbedSnapshot,
  isGhCliAvailable,
  isGitHubEmbedUrl,
} from './githubEmbeds.js'
import { stampBounds, stampBoundsAll, resolvePosition, getWidgetBounds } from './collision.js'
import { markCanvasWrite, unmarkCanvasWrite } from './writeGuard.js'
import { devLog } from '../logger/devLogger.js'
import widgetsConfig from '../../../widgets.config.json' with { type: 'json' }
import { listHubRoles, getDefaultRoleId } from './hub-roles.js'

/**
 * Read the prompt widget's execution config from widgets.config.json.
 * Returns { default, agents } where each agent has a command template.
 */
function getPromptExecution() {
  return widgetsConfig?.widgets?.prompt?.execution || null
}

/**
 * Build the CLI command for a prompt spawn.
 * Reads the prompt widget's execution.agents config and interpolates ${prompt}.
 */
function buildPromptCmd({ prompt, envFile, agentId }) {
  const execution = getPromptExecution()

  if (!execution) {
    // Bare fallback — no execution config found
    const escaped = prompt.replace(/"/g, '\\"')
    return `source ${envFile} && copilot -p "${escaped}" --allow-all`
  }

  const id = agentId || execution.default
  const agent = execution.agents?.[id]

  if (!agent?.command) {
    return null // This agent doesn't have a prompt command
  }

  const escaped = prompt.replace(/"/g, '\\"')
  const cmd = agent.command.replace('${prompt}', escaped)
  return `source ${envFile} && ${cmd}`
}

/**
 * Scan src/canvas/ for directories containing .meta.json files.
 * Returns an object keyed by directory name (without .folder suffix).
 */
function findCanvasMeta(root) {
  const canvasDir = path.join(root, 'src', 'canvas')
  const groups = {}
  if (!fs.existsSync(canvasDir)) return groups

  const entries = fs.readdirSync(canvasDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dirName = entry.name.replace(/\.folder$/, '')
    const metaPath = path.join(canvasDir, entry.name, `${dirName}.meta.json`)
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        groups[dirName] = meta
      } catch { /* skip invalid meta */ }
    }
  }
  return groups
}

/**
 * Read .meta.json from a canvas folder directory.
 */
function readFolderMeta(folderDir) {
  const dirName = path.basename(folderDir).replace(/\.folder$/, '')
  const metaPath = path.join(folderDir, `${dirName}.meta.json`)
  if (fs.existsSync(metaPath)) {
    try { return JSON.parse(fs.readFileSync(metaPath, 'utf-8')) } catch { /* ignore */ }
  }
  return {}
}

/**
 * Write .meta.json to a canvas folder directory.
 */
function writeFolderMeta(folderDir, meta) {
  const dirName = path.basename(folderDir).replace(/\.folder$/, '')
  const metaPath = path.join(folderDir, `${dirName}.meta.json`)
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
}

/**
 * Recursively find all .canvas.jsonl files in the project.
 */
function findCanvasFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])

  function walk(dir, rel) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (entry.name.endsWith('.canvas.jsonl')) {
        results.push(relPath)
      }
    }
  }

  walk(root, '')
  return results
}

/**
 * Recursively find all .story.{jsx,tsx} files in routable directories
 * (src/canvas/ and src/components/) and extract their named exports.
 */
function findStoryFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])
  const ROUTABLE_DIRS = ['src/canvas', 'src/components']

  function walk(dir, rel) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      if (entry.name.startsWith('_')) continue
      const fullPath = path.join(dir, entry.name)
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(fullPath, relPath)
      } else if (/\.story\.(jsx|tsx)$/.test(entry.name)) {
        const name = entry.name.replace(/\.story\.(jsx|tsx)$/, '')
        const exports = parseExportNames(fullPath)
        results.push({ name, path: relPath, exports })
      }
    }
  }

  for (const dir of ROUTABLE_DIRS) {
    const absDir = path.join(root, dir)
    if (fs.existsSync(absDir)) {
      walk(absDir, dir)
    }
  }
  return results
}

/**
 * Parse named function/const exports from a JSX/TSX file.
 */
function parseExportNames(filePath) {
  try {
    const src = fs.readFileSync(filePath, 'utf-8')
    const names = []
    const re = /export\s+(?:function|const|class)\s+([A-Z]\w*)/g
    let m
    while ((m = re.exec(src)) !== null) names.push(m[1])
    return names
  } catch { return [] }
}

/**
 * Find a canvas JSONL file by canonical ID.
 * Only matches canonical path-based IDs from toCanvasId().
 */
function findCanvasPath(root, canvasId) {
  const files = findCanvasFiles(root)

  for (const file of files) {
    const id = toCanvasId(file)
    if (id === canvasId) {
      return path.resolve(root, file)
    }
  }

  return null
}

/**
 * Read a .canvas.jsonl file and materialize its current state.
 */
function readCanvas(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return materializeFromText(raw)
}

/**
 * Append a single event line to a .canvas.jsonl file.
 */
function appendEventRaw(filePath, event) {
  fs.appendFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
}

/**
 * Generate a unique widget ID.
 */
function generateWidgetId(type) {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${type}-${suffix}`
}

/**
 * Create the canvas API route handler.
 */
export function createCanvasHandler(ctx) {
  const { root, sendJson, hotPool } = ctx

  /**
   * Compute a target position relative to a reference widget.
   * @param {object} refWidget — widget to position near (must have position + type/props)
   * @param {string} direction — 'right' | 'left' | 'above' | 'below'
   * @param {string} newType — type of the widget being created (for size defaults)
   * @param {object} newProps — props of the widget being created
   * @param {number} gap — spacing between widgets (default 40)
   * @returns {{ x: number, y: number }}
   */
  function computeNearPosition(refWidget, direction = 'right', newType = 'sticky-note', newProps = {}, gap = 40) {
    const refBounds = getWidgetBounds(refWidget)
    const newDefaults = getWidgetBounds({ type: newType, props: newProps, position: { x: 0, y: 0 } })
    switch (direction) {
      case 'left':
        return { x: refBounds.x - newDefaults.width - gap, y: refBounds.y }
      case 'above':
        return { x: refBounds.x, y: refBounds.y - newDefaults.height - gap }
      case 'below':
        return { x: refBounds.x, y: refBounds.y + refBounds.height + gap }
      case 'right':
      default:
        return { x: refBounds.x + refBounds.width + gap, y: refBounds.y }
    }
  }

  /**
   * Compute a smart default position when no --near or explicit x,y is given.
   * Priority chain:
   *   1. Active agent/terminal (source widget ID from request)
   *   2. User-selected widget (from .selectedwidgets.json, same canvas)
   *   3. Viewport center (from .selectedwidgets.json)
   *   4. Last widget on canvas
   *   5. Origin (0, 0) — empty canvas, no viewport
   *
   * @param {object[]} canvasWidgets — current widgets on the canvas
   * @param {string} type — widget type being created
   * @param {object} props — widget props
   * @param {string} projectRoot — project root directory
   * @param {string|null} canvasName — canvas ID for matching selectedwidgets context
   * @param {string|null} sourceWidgetId — caller's widget ID (agent/terminal creating this widget)
   */
  async function computeAutoPosition(canvasWidgets, type, props, projectRoot, canvasName, sourceWidgetId) {
    const widgetMap = new Map((canvasWidgets || []).map(w => [w.id, w]))

    // 1. Place near the source agent/terminal widget
    if (sourceWidgetId && widgetMap.has(sourceWidgetId)) {
      return computeNearPosition(widgetMap.get(sourceWidgetId), 'right', type, props)
    }

    // 2–3. Read .selectedwidgets.json for selection + viewport context
    try {
      const { readSelectedWidgets } = await import('./selectedWidgets.js')
      const sw = readSelectedWidgets(projectRoot)
      if (sw && sw.canvasId === canvasName) {
        // 2. Place near the selected widget
        if (sw.selectedWidgetIds?.length > 0) {
          const selectedId = sw.selectedWidgetIds[0]
          if (widgetMap.has(selectedId)) {
            return computeNearPosition(widgetMap.get(selectedId), 'right', type, props)
          }
        }

        // 3. Place at viewport center
        const vp = sw.viewport
        if (vp && vp.centerX != null && vp.centerY != null) {
          return { x: Math.round(vp.centerX / 24) * 24, y: Math.round(vp.centerY / 24) * 24 }
        }
      }
    } catch { /* selectedWidgets bridge may not be initialized */ }

    // 4. Place near the last widget on the canvas
    if (canvasWidgets && canvasWidgets.length > 0) {
      const lastWidget = canvasWidgets[canvasWidgets.length - 1]
      return computeNearPosition(lastWidget, 'right', type, props)
    }

    // 5. Truly empty canvas, no viewport
    return { x: 0, y: 0 }
  }

  function stableHubId(canvasId, widgetIds) {
    const sorted = [...widgetIds].sort()
    const hash = createHash('sha1').update(`${canvasId}::${sorted.join(',')}`).digest('hex').slice(0, 10)
    return `hub_${hash}`
  }

  function buildComponents(widgets, connectors) {
    const ids = new Set(widgets.map((w) => w.id))
    const adj = new Map()
    for (const id of ids) adj.set(id, new Set())
    for (const conn of connectors) {
      const a = conn.start?.widgetId
      const b = conn.end?.widgetId
      if (!a || !b || !ids.has(a) || !ids.has(b) || a === b) continue
      adj.get(a).add(b)
      adj.get(b).add(a)
    }

    const seen = new Set()
    const components = []
    for (const id of ids) {
      if (seen.has(id)) continue
      const queue = [id]
      const comp = new Set()
      seen.add(id)
      while (queue.length > 0) {
        const cur = queue.shift()
        comp.add(cur)
        for (const next of adj.get(cur) || []) {
          if (seen.has(next)) continue
          seen.add(next)
          queue.push(next)
        }
      }
      components.push(comp)
    }
    return components
  }

  function computeHubRoleState(canvasName, widgets, connectors) {
    const roles = listHubRoles(root)
    const defaultRole = getDefaultRoleId(roles)
    const uniqueRoles = new Set(roles.filter((r) => r.type === 'unique').map((r) => r.id))
    const roleById = new Map(roles.map((r) => [r.id, r]))

    const widgetMap = new Map(widgets.map((w) => [w.id, w]))
    const components = buildComponents(widgets, connectors)

    const roleByWidget = new Map()
    const hubsByWidget = new Map()

    for (const comp of components) {
      const compIds = [...comp]
      const compSet = new Set(compIds)
      const compWidgets = compIds.map((id) => widgetMap.get(id)).filter(Boolean)
      const agentWidgets = compWidgets.filter((w) => w.type === 'agent')
      const terminalWidgets = compWidgets.filter((w) => w.type === 'agent' || w.type === 'terminal' || w.type === 'prompt')
      if (terminalWidgets.length === 0) continue

      // Start with requested role from props, defaulting to "member" (or configured default) for agents.
      for (const w of agentWidgets) {
        const requested = w.props?.role
        const resolved = requested && roleById.has(requested) ? requested : defaultRole
        roleByWidget.set(w.id, resolved)
      }

      // Enforce unique role semantics.
      for (const roleId of uniqueRoles) {
        const holders = agentWidgets.filter((w) => roleByWidget.get(w.id) === roleId)
        if (holders.length <= 1) continue
        // Keep first holder deterministically, revert the rest to default.
        for (const w of holders.slice(1)) roleByWidget.set(w.id, defaultRole)
      }

      // Auto-leader bootstrap for 3+ agent hubs when no leader exists.
      const hasLeader = agentWidgets.some((w) => roleByWidget.get(w.id) === 'leader')
      if (!hasLeader && agentWidgets.length >= 3) {
        const connectorLeader = connectors.find((conn) => {
          const startId = conn.start?.widgetId
          const endId = conn.end?.widgetId
          if (!startId || !endId) return false
          if (!compSet.has(startId) || !compSet.has(endId)) return false
          const start = widgetMap.get(startId)
          const end = widgetMap.get(endId)
          return start?.type === 'agent' && end?.type === 'agent'
        })?.start?.widgetId
        if (connectorLeader && compSet.has(connectorLeader)) {
          roleByWidget.set(connectorLeader, 'leader')
        }
      }

      const hubId = stableHubId(canvasName, compIds)
      for (const tw of terminalWidgets) {
        const peers = terminalWidgets
          .filter((other) => other.id !== tw.id)
          .map((other) => ({
            widgetId: other.id,
            displayName: other.props?.prettyName || other.id,
            role: roleByWidget.get(other.id) || (other.type === 'agent' ? defaultRole : 'passive'),
            type: other.type,
          }))

        const role = roleByWidget.get(tw.id) || (tw.type === 'agent' ? defaultRole : 'passive')
        const hub = {
          hubId,
          role,
          goal: null,
          peers,
          messageLogPath: `.storyboard/messages/channels/hub--${canvasName.replace(/\//g, '--')}--${hubId}.jsonl`,
          activeConversationId: null,
          hasHubToken: role === 'leader',
          pendingMessageToken: null,
        }

        if (!hubsByWidget.has(tw.id)) hubsByWidget.set(tw.id, [])
        hubsByWidget.get(tw.id).push(hub)
      }
    }

    return { roles, defaultRole, roleByWidget, hubsByWidget }
  }

  /**
   * Update terminal configs when connectors change.
   * Finds all terminal widgets in the canvas, computes their connected widget IDs
   * from the current connector list, and updates their config files.
   */
  async function updateTerminalConnectionsForCanvas(root, canvasName, canvasData, connectors) {
    try {
      const { updateTerminalConnections, initTerminalConfig, readTerminalConfigById } = await import('./terminal-config.js')
      const { execSync } = await import('node:child_process')
      const { findTmuxNameForWidget } = await import('./terminal-registry.js')
      initTerminalConfig(root)

      let branch = 'unknown'
      try {
        branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
      } catch { /* empty */ }

      const widgets = canvasData.widgets || []
      const widgetMap = new Map(widgets.map(w => [w.id, w]))
      const terminalWidgets = widgets.filter((w) => w.type === 'terminal' || w.type === 'agent' || w.type === 'prompt')
      const { defaultRole, roleByWidget, hubsByWidget } = computeHubRoleState(canvasName, widgets, connectors)

      for (const tw of terminalWidgets) {
        const prevConfig = readTerminalConfigById(tw.id)
        const prevRole = prevConfig?.role || null
        const connectedIds = new Set()
        const messagingPeers = []
        for (const conn of connectors) {
          let peerId = null
          let direction = null
          if (conn.start?.widgetId === tw.id) {
            peerId = conn.end?.widgetId
            direction = 'outgoing' // tw → peer
          }
          if (conn.end?.widgetId === tw.id) {
            peerId = conn.start?.widgetId
            direction = 'incoming' // peer → tw
          }
          if (peerId) {
            connectedIds.add(peerId)
            const mode = conn.meta?.messagingMode || 'none'
            if (mode !== 'none') {
              const peerWidget = widgetMap.get(peerId)
              if (peerWidget && (peerWidget.type === 'terminal' || peerWidget.type === 'agent')) {
                const canSend = mode === 'two-way' || (mode === 'one-way' && direction === 'outgoing')
                const canReceive = mode === 'two-way' || (mode === 'one-way' && direction === 'incoming')
                messagingPeers.push({
                  widgetId: peerId,
                  displayName: peerWidget.props?.prettyName || peerId,
                  configPath: `.storyboard/terminals/${peerId}.json`,
                  type: peerWidget.type,
                  canSend,
                  canReceive,
                  mode,
                })
              }
            }
          }
        }
        connectedIds.delete(undefined)
        connectedIds.delete(null)

        // Resolve full widget objects for connected widgets
        const connectedWidgets = [...connectedIds]
          .map(id => widgetMap.get(id))
          .filter(Boolean)
          .map(w => ({ id: w.id, type: w.type, props: w.props, position: w.position }))

        // Build messaging section if there are messaging-enabled peers
        const messaging = messagingPeers.length > 0 ? { peers: messagingPeers } : null
        const role = roleByWidget.get(tw.id) || (tw.type === 'agent' ? defaultRole : 'passive')
        const hubs = hubsByWidget.get(tw.id) || []

        updateTerminalConnections({
          branch,
          canvasId: canvasName,
          widgetId: tw.id,
          connectedWidgets,
          widgetProps: tw.props || null,
          messaging,
          role,
          hubs,
        })

        // Push role instruction updates to running sessions when role changes.
        if ((tw.type === 'agent' || tw.type === 'prompt') && prevRole && prevRole !== role) {
          const tmuxName = findTmuxNameForWidget(tw.id)
          if (tmuxName) {
            const roleMsg = `Your role in the hub is ${role}, read .agents/roles/${role}.role.md to follow additional instructions`
            try {
              execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(roleMsg)}`, { stdio: 'ignore' })
              execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
            } catch { /* best-effort */ }
          }
        }
      }
    } catch (err) {
      devLog().logEvent('warn', 'Failed to update terminal connections', { error: err.message })
    }
  }

  // Append an event to an existing canvas file.
  // Marks the file in the write guard so the data plugin's watcher handler
  // skips sending a duplicate HMR event (the server pushes its own via
  // pushCanvasUpdate after the write).
  function appendEvent(filePath, event) {
    markCanvasWrite(filePath)
    appendEventRaw(filePath, event)
    // Unmark after enough time for the watcher to fire and be suppressed.
    // macOS FSEvents latency is typically 100-500ms; 1s covers edge cases.
    setTimeout(() => unmarkCanvasWrite(filePath), 1000)
  }

  /**
   * Prepare a terminal/agent widget: auto-assign displayName and pre-reserve identity.
   * Shared by POST /widget and batch create-widget.
   * @param {{ type: string, props: Object }} opts
   * @param {string} widgetId
   * @param {string} canvasName
   * @param {import('node:http').IncomingMessage} [req]
   */
  async function prepareTerminalWidget({ type, props, widgetId, canvasName, req }) {
    if (type !== 'terminal' && type !== 'agent') return

    if (!props.prettyName) {
      try {
        const { generateFriendlyName } = await import('./terminal-registry.js')
        props.prettyName = generateFriendlyName()
      } catch { /* registry not initialized yet */ }
    }

    try {
      const { preReserveTerminalIdentity, initTerminalConfig } = await import('./terminal-config.js')
      initTerminalConfig(root)
      let branch = 'unknown'
      try {
        const { execSync } = await import('node:child_process')
        branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
      } catch { /* empty */ }
      const serverUrl = `http://localhost:${req?.socket?.localPort || 1234}`
      preReserveTerminalIdentity({
        widgetId,
        preDisplayName: props.prettyName || null,
        canvasId: canvasName,
        branch,
        serverUrl,
      })
    } catch { /* best effort */ }
  }

  /**
   * Resolve which hot pool to use for a widget type + props.
   * Agent widgets use their agentId as pool ID; terminals use 'terminal'.
   */
  function resolvePoolId(type, props) {
    if (type === 'agent' && props?.agentId) return props.agentId
    return 'terminal'
  }

  /**
   * Try to acquire a warm session from the hot pool.
   * @param {Object|null} hotPool — HotPoolManager instance
   * @param {string} poolId — pool to acquire from
   * @param {string} [mode] — 'auto' (default), 'hot', or 'cold'
   * @returns {Object|null} acquired session or null
   */
  function acquireFromPool(hotPool, poolId, mode) {
    if (!hotPool || mode === 'cold') return null
    const effectiveMode = mode || 'auto'
    if (effectiveMode === 'cold') return null
    if (!hotPool.has(poolId)) return null
    return hotPool.acquire(poolId) || null
  }

  /**
   * Push live canvas update to connected clients via Vite HMR.
   * Reads the full materialized state from disk and sends it as a custom
   * event so useCanvas can update in-place without a page refresh.
   */
  function pushCanvasUpdate(canvasName, filePath, viteWs) {
    if (!viteWs) return
    try {
      const data = readCanvas(filePath)
      viteWs.send({
        type: 'custom',
        event: 'storyboard:canvas-file-changed',
        data: { canvasId: canvasName, name: canvasName, metadata: data },
      })

      // Refresh terminal config files on every canvas change so agents
      // always see up-to-date connectedWidgets and widget props.
      updateTerminalConnectionsForCanvas(root, canvasName, data, data.connectors || [])
    } catch { /* best effort — watcher will catch it eventually */ }
  }

  // Write a new JSONL file with a single creation event.
  // New files are detected naturally by Vite's watcher as an `add` event,
  // which correctly triggers a full reload to register new routes.
  function writeNewCanvas(filePath, event) {
    fs.writeFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
  }

  return async (req, res, { body, path: routePath, method, __viteWs }) => {
    // GET /folders — list available canvas folders
    if (routePath === '/folders' && method === 'GET') {
      const canvasDir = path.join(root, 'src', 'canvas')
      let folders = []
      try {
        if (fs.existsSync(canvasDir)) {
          const entries = fs.readdirSync(canvasDir, { withFileTypes: true })
          // .folder directories (existing behavior)
          const folderDirs = entries
            .filter((d) => d.isDirectory() && d.name.endsWith('.folder'))
            .map((d) => d.name.replace('.folder', ''))
          // Plain directories containing .canvas.jsonl files
          const plainDirs = entries
            .filter((d) => {
              if (!d.isDirectory() || d.name.endsWith('.folder') || d.name.startsWith('_')) return false
              const files = fs.readdirSync(path.join(canvasDir, d.name))
              return files.some((f) => f.endsWith('.canvas.jsonl'))
            })
            .map((d) => d.name)
          folders = [...folderDirs, ...plainDirs]
        }
      } catch { /* empty */ }
      sendJson(res, 200, { folders })
      return
    }

    // GET /roles — list hub role definitions from .agents/roles/*.role.md
    if (routePath === '/roles' && method === 'GET') {
      const roles = listHubRoles(root)
      const defaultRole = getDefaultRoleId(roles)
      sendJson(res, 200, { roles, defaultRole, defaultRoleId: defaultRole })
      return
    }

    // GET /read?name=... — read materialized canvas data from disk
    if (routePath.startsWith('/read') && method === 'GET') {
      const url = new URL(routePath, 'http://localhost')
      const name = url.searchParams.get('name')
      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required (?name=...)' })
        return
      }
      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }
      try {
        const data = readCanvas(filePath)
        const widgetFilter = url.searchParams.get('widget')
        if (widgetFilter) {
          const widget = (data.widgets || []).find((w) => w.id === widgetFilter)
          if (!widget) {
            sendJson(res, 404, { error: `Widget "${widgetFilter}" not found in canvas "${name}"` })
            return
          }
          sendJson(res, 200, { ...data, widgets: [widget] })
        } else {
          sendJson(res, 200, data)
        }
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read canvas: ${err.message}` })
      }
      return
    }

    // GET /list — list all canvases
    if (routePath === '/list' && method === 'GET') {
      const files = findCanvasFiles(root)
      const canvases = files.map((file) => {
        const id = toCanvasId(file)
        if (!id) return null
        const { segments } = parseCanvasId(id)
        const group = segments.length > 1 ? segments.slice(0, -1).join('/') : null
        try {
          const data = readCanvas(path.resolve(root, file))
          return {
            name: id,
            title: data.title || segments[segments.length - 1],
            path: file,
            widgetCount: (data.widgets || []).length + (data.sources || []).length,
            group,
          }
        } catch {
          return { name: id, title: segments[segments.length - 1], path: file, widgetCount: 0, group }
        }
      }).filter(Boolean)
      const groups = findCanvasMeta(root)

      // Sort canvases within each group by saved pageOrder from .meta.json
      const groupOrderMaps = new Map()
      for (const [groupName, meta] of Object.entries(groups)) {
        if (Array.isArray(meta.pageOrder)) {
          const orderMap = new Map()
          meta.pageOrder.forEach((entry, idx) => {
            if (typeof entry === 'string' && !entry.startsWith('sep-')) orderMap.set(entry, idx)
          })
          groupOrderMaps.set(groupName, orderMap)
        }
      }
      if (groupOrderMaps.size > 0) {
        canvases.sort((a, b) => {
          if (a.group !== b.group) return 0
          const orderMap = a.group ? groupOrderMaps.get(a.group) : null
          if (!orderMap) return 0
          const ai = orderMap.has(a.name) ? orderMap.get(a.name) : Infinity
          const bi = orderMap.has(b.name) ? orderMap.get(b.name) : Infinity
          return ai - bi
        })
      }

      sendJson(res, 200, { canvases, groups })
      return
    }

    // PUT /update — append update events to the canvas stream
    if (routePath === '/update' && method === 'PUT') {
      const { name, widgets, sources, settings, connectors } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const ts = new Date().toISOString()

        if (widgets) {
          // Guard against accidental canvas wipes: if the incoming widget count
          // is much smaller than the current canvas, reject unless explicitly confirmed.
          // This protects against agents/scripts that accidentally send a partial widget
          // array to the widgets_replaced endpoint (which replaces ALL widgets).
          const current = readCanvas(filePath)
          const currentCount = (current.widgets || []).length
          if (currentCount > 1 && widgets.length < currentCount * 0.5 && body.replaceAll !== true) {
            sendJson(res, 400, {
              error: `Refusing to replace ${currentCount} widgets with ${widgets.length}. `
                + `This would delete ${currentCount - widgets.length} widgets. `
                + `Use PATCH /_storyboard/canvas/widget to update individual widgets, `
                + `or pass "replaceAll": true to confirm full replacement.`,
            })
            return
          }
          const stamped = stampBoundsAll(widgets)
          appendEvent(filePath, { event: 'widgets_replaced', timestamp: ts, widgets: stamped })
        }

        if (sources) {
          appendEvent(filePath, { event: 'source_updated', timestamp: ts, sources })
        }

        if (connectors) {
          appendEvent(filePath, { event: 'connectors_replaced', timestamp: ts, connectors })
        }

        if (settings) {
          const filtered = {}
          for (const [key, value] of Object.entries(settings)) {
            if (['title', 'description', 'grid', 'gridSize', 'colorMode', 'dotted', 'centered', 'author', 'snapToGrid'].includes(key)) {
              filtered[key] = value
            }
          }
          if (Object.keys(filtered).length > 0) {
            appendEvent(filePath, { event: 'settings_updated', timestamp: ts, settings: filtered })
          }
        }

        sendJson(res, 200, { success: true, name })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update canvas: ${err.message}` })
      }
      return
    }

    // POST /widget — append a widget_added event
    if (routePath === '/widget' && method === 'POST') {
      const { name, type, props = {}, pool, near, direction, resolve, source } = body
      let position = body.position || { x: 0, y: 0 }

      // Detect whether the caller provided an explicit position.
      // `near === false` is the explicit opt-out ("put it exactly here").
      const hasExplicitPosition = body.position && (body.position.x !== 0 || body.position.y !== 0)
      const hasNearOptOut = near === false
      const needsAutoPosition = !near && !hasExplicitPosition && !hasNearOptOut

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }
      if (!type) {
        sendJson(res, 400, { error: 'Widget type is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        // Always read canvas when we need near, resolve, or auto-positioning
        const needsCanvasRead = near || resolve || needsAutoPosition
        let canvasWidgets = null
        let canvasData = null
        if (needsCanvasRead) {
          canvasData = readCanvas(filePath)
          canvasWidgets = canvasData.widgets || []
        }

        if (near) {
          const refWidget = canvasWidgets.find((w) => w.id === near)
          if (!refWidget) {
            sendJson(res, 400, { error: `Widget "${near}" not found (--near)` })
            return
          }
          position = computeNearPosition(refWidget, direction || 'right', type, props)
        }

        // Auto-position: no --near, no explicit x,y → smart default
        if (needsAutoPosition && !near) {
          position = await computeAutoPosition(canvasWidgets, type, props, root, name, source || null)
        }

        if (near || resolve || needsAutoPosition) {
          const resolved = resolvePosition({
            x: position.x, y: position.y, type, props,
            widgets: canvasWidgets,
            gridSize: (canvasData && canvasData.gridSize) || 24,
          })
          position = { x: resolved.x, y: resolved.y }
        }

        const widgetId = generateWidgetId(type)

        await prepareTerminalWidget({ type, props, widgetId, canvasName: name, req })

        // Hot pool acquisition for terminal/agent widgets
        let hotSession = null
        if ((type === 'terminal' || type === 'agent') && pool !== 'cold') {
          const poolId = resolvePoolId(type, props)
          hotSession = acquireFromPool(hotPool, poolId, pool)
          if (!hotSession && pool === 'hot') {
            sendJson(res, 409, { error: `No warm sessions available in pool "${poolId}"` })
            return
          }
        }

        const widget = stampBounds({ id: widgetId, type, position, props })

        appendEvent(filePath, {
          event: 'widget_added',
          timestamp: new Date().toISOString(),
          widget,
        })

        const response = { success: true, widget }
        if (hotSession) response.hotSession = { id: hotSession.id, tmuxName: hotSession.tmuxName || null, webglReady: !!hotSession.webglReady }
        sendJson(res, 201, response)
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to add widget: ${err.message}` })
      }
      return
    }

    // DELETE /widget — append a widget_removed event
    if (routePath === '/widget' && method === 'DELETE') {
      const { name, widgetId } = body

      if (!name || !widgetId) {
        sendJson(res, 400, { error: 'Canvas name and widgetId are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        // Verify the widget exists before appending the removal event
        const data = readCanvas(filePath)
        const widget = (data.widgets || []).find((w) => w.id === widgetId)
        if (!widget) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found in canvas "${name}"` })
          return
        }

        appendEvent(filePath, {
          event: 'widget_removed',
          timestamp: new Date().toISOString(),
          widgetId,
        })

        // Orphan terminal session when a terminal widget is deleted (not killed)
        if (widget.type === 'terminal' || widget.type === 'agent') {
          try {
            const { orphanTerminalSession } = await import('./terminal-server.js')
            orphanTerminalSession(widgetId)
          } catch (err) {
            devLog().logEvent('warn', `Failed to orphan terminal session for ${widgetId}`, { widgetId, error: err.message })
          }
        }

        sendJson(res, 200, { success: true, removed: 1 })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove widget: ${err.message}` })
      }
      return
    }

    // PATCH /widget — update a single widget's props
    if (routePath === '/widget' && method === 'PATCH') {
      const { name, widgetId, props, position } = body

      if (!name || !widgetId) {
        sendJson(res, 400, { error: 'Canvas name and widgetId are required' })
        return
      }
      if (!props && !position) {
        sendJson(res, 400, { error: 'At least one of props or position is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const widget = (data.widgets || []).find((w) => w.id === widgetId)
        if (!widget) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found in canvas "${name}"` })
          return
        }

        const ts = new Date().toISOString()

        if (props) {
          appendEvent(filePath, {
            event: 'widget_updated',
            timestamp: ts,
            widgetId,
            props,
          })
        }

        if (position) {
          // Merge with existing position so partial updates (only --x or --y) are safe
          const mergedPosition = { ...widget.position, ...position }
          appendEvent(filePath, {
            event: 'widget_moved',
            timestamp: ts,
            widgetId,
            position: mergedPosition,
          })
        }

        // Return the merged widget for convenience
        const merged = {
          ...widget,
          props: { ...widget.props, ...(props || {}) },
          position: position ? { ...widget.position, ...position } : widget.position,
        }
        sendJson(res, 200, { success: true, widget: merged })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update widget: ${err.message}` })
      }
      return
    }

    // POST /connector — append a connector_added event
    if (routePath === '/connector' && method === 'POST') {
      const { name, startWidgetId, startAnchor, endWidgetId, endAnchor, connectorType = 'default', meta = null } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }
      if (!startWidgetId || !endWidgetId) {
        sendJson(res, 400, { error: 'startWidgetId and endWidgetId are required' })
        return
      }
      const validAnchors = ['top', 'bottom', 'left', 'right']
      if (!validAnchors.includes(startAnchor) || !validAnchors.includes(endAnchor)) {
        sendJson(res, 400, { error: `Anchors must be one of: ${validAnchors.join(', ')}` })
        return
      }
      if (startWidgetId === endWidgetId) {
        sendJson(res, 400, { error: 'Cannot connect a widget to itself' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const widgetIds = new Set((data.widgets || []).map((w) => w.id))
        if (!widgetIds.has(startWidgetId)) {
          sendJson(res, 404, { error: `Widget "${startWidgetId}" not found` })
          return
        }
        if (!widgetIds.has(endWidgetId)) {
          sendJson(res, 404, { error: `Widget "${endWidgetId}" not found` })
          return
        }

        const connectorId = generateWidgetId('connector')
        const connector = {
          id: connectorId,
          type: 'connector',
          connectorType,
          start: { widgetId: startWidgetId, anchor: startAnchor },
          end: { widgetId: endWidgetId, anchor: endAnchor },
          meta: meta && typeof meta === 'object' ? { ...meta } : {},
        }

        appendEvent(filePath, {
          event: 'connector_added',
          timestamp: new Date().toISOString(),
          connector,
        })

        sendJson(res, 201, { success: true, connector })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to add connector: ${err.message}` })
      }
      return
    }

    // PATCH /connector — update connector anchors and/or meta
    if (routePath === '/connector' && method === 'PATCH') {
      const { name, connectorId, meta, startAnchor, endAnchor } = body

      if (!name || !connectorId) {
        sendJson(res, 400, { error: 'Canvas name and connectorId are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const connector = (data.connectors || []).find((c) => c.id === connectorId)
        if (!connector) {
          sendJson(res, 404, { error: `Connector "${connectorId}" not found in canvas "${name}"` })
          return
        }

        const validAnchors = ['top', 'right', 'bottom', 'left']
        if (startAnchor && !validAnchors.includes(startAnchor)) {
          sendJson(res, 400, { error: `Invalid startAnchor "${startAnchor}". Must be one of: ${validAnchors.join(', ')}` })
          return
        }
        if (endAnchor && !validAnchors.includes(endAnchor)) {
          sendJson(res, 400, { error: `Invalid endAnchor "${endAnchor}". Must be one of: ${validAnchors.join(', ')}` })
          return
        }

        const updates = {}
        if (meta) updates.meta = { ...meta }
        if (startAnchor) updates.startAnchor = startAnchor
        if (endAnchor) updates.endAnchor = endAnchor

        appendEvent(filePath, {
          event: 'connector_updated',
          timestamp: new Date().toISOString(),
          connectorId,
          updates,
        })

        sendJson(res, 200, { success: true })
        pushCanvasUpdate(name, filePath, __viteWs)

        // Inject messaging skill into both terminals when mode changes
        if (meta?.messagingMode || meta?.messaging) {
          const widgets = data.widgets || []
          const startWidget = widgets.find((w) => w.id === connector.start?.widgetId)
          const endWidget = widgets.find((w) => w.id === connector.end?.widgetId)
          const isTerminalType = (w) => w && (w.type === 'terminal' || w.type === 'agent')

          if (isTerminalType(startWidget) && isTerminalType(endWidget)) {
            try {
              const { execSync } = await import('node:child_process')
              const { findTmuxNameForWidget } = await import('./terminal-registry.js')

              // Resolve effective mode per widget
              const getMode = (w) => {
                if (meta.messagingMode === 'two-way') return 'two-way'
                if (meta.messaging?.[w.id]) return meta.messaging[w.id]
                return 'none'
              }

              const pairs = [
                { widget: startWidget, peer: endWidget },
                { widget: endWidget, peer: startWidget },
              ]

              for (const { widget: w, peer } of pairs) {
                const tmuxName = findTmuxNameForWidget(w.id)
                if (!tmuxName) continue

                const peerName = peer.props?.prettyName || peer.id
                const mode = getMode(w)
                let skillMsg

                if (mode === 'two-way') {
                  skillMsg = `📡 [Two-way messaging ACTIVE with ${peerName}]\n\nYou are in a live conversation with ${peerName} (${peer.id}). Messages appear as: 📩 ${peerName}: <their message>\n\nWhen you receive a message:\n1. Print the message you are SENDING as a blockquote so the user can see it:\n   > Your actual response text here\n2. Then save and send in one step:\n   npx storyboard terminal output --summary "summary" --content "your response" && npx storyboard terminal send ${peer.id} "your response"\n\nIMPORTANT: Always show your actual response text as a > blockquote BEFORE the shell command. The user needs to see what you said, not just "I fired back with a joke."\n\nDo NOT ask for permission. Respond immediately. Keep it concise.`
                } else if (mode === 'one-way') {
                  skillMsg = `📡 [One-way messaging → to ${peerName}]\nYou can send messages to ${peerName} (${peer.id}).\n\nAfter EVERY response, save your output:\n  npx storyboard terminal output --summary "summary" --content "your full response"\n\nTo send a message:\n  npx storyboard terminal send ${peer.id} "message"`
                } else {
                  skillMsg = `📡 [Messaging with ${peerName} disabled]`
                }

                try {
                  execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(skillMsg)}`, { stdio: 'ignore' })
                  execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                } catch { /* tmux session may not be active */ }
              }
            } catch { /* best effort */ }
          }
        }
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update connector: ${err.message}` })
      }
      return
    }

    // DELETE /connector — append a connector_removed event
    if (routePath === '/connector' && method === 'DELETE') {
      const { name, connectorId } = body

      if (!name || !connectorId) {
        sendJson(res, 400, { error: 'Canvas name and connectorId are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const exists = (data.connectors || []).some((c) => c.id === connectorId)
        if (!exists) {
          sendJson(res, 404, { error: `Connector "${connectorId}" not found in canvas "${name}"` })
          return
        }

        appendEvent(filePath, {
          event: 'connector_removed',
          timestamp: new Date().toISOString(),
          connectorId,
        })

        sendJson(res, 200, { success: true, removed: 1 })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to remove connector: ${err.message}` })
      }
      return
    }

    // POST /broadcast — toggle broadcast messaging for a widget and its connections.
    // Default: direct neighbors only. passThrough: true → BFS full connected component.
    if (routePath === '/broadcast' && method === 'POST') {
      const { name, widgetId, mode = 'two-way', passThrough = false } = body

      if (!name || !widgetId) {
        sendJson(res, 400, { error: 'Canvas name and widgetId are required' })
        return
      }
      if (mode !== 'two-way' && mode !== 'one-way' && mode !== 'none') {
        sendJson(res, 400, { error: 'mode must be "two-way", "one-way", or "none"' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const data = readCanvas(filePath)
        const widgets = data.widgets || []
        const connectors = data.connectors || []
        const widgetMap = new Map(widgets.map((w) => [w.id, w]))

        const sourceWidget = widgetMap.get(widgetId)
        if (!sourceWidget) {
          sendJson(res, 404, { error: `Widget "${widgetId}" not found` })
          return
        }

        const isTerminalType = (w) => w && (w.type === 'terminal' || w.type === 'agent')

        // Find connectors to update via BFS (or direct neighbors only)
        const affectedConnectorIds = new Set()
        const affectedWidgetIds = new Set([widgetId])

        if (passThrough) {
          // BFS: traverse entire connected component of terminal/agent widgets
          const visited = new Set([widgetId])
          const queue = [widgetId]
          while (queue.length > 0) {
            const current = queue.shift()
            for (const conn of connectors) {
              let peerId = null
              if (conn.start?.widgetId === current && conn.end?.widgetId) peerId = conn.end.widgetId
              if (conn.end?.widgetId === current && conn.start?.widgetId) peerId = conn.start.widgetId
              if (!peerId || visited.has(peerId)) continue
              const peer = widgetMap.get(peerId)
              if (!isTerminalType(peer)) continue
              affectedConnectorIds.add(conn.id)
              affectedWidgetIds.add(peerId)
              visited.add(peerId)
              queue.push(peerId)
            }
          }
        } else {
          // Direct neighbors only
          for (const conn of connectors) {
            let peerId = null
            if (conn.start?.widgetId === widgetId && conn.end?.widgetId) peerId = conn.end.widgetId
            if (conn.end?.widgetId === widgetId && conn.start?.widgetId) peerId = conn.start.widgetId
            if (!peerId) continue
            const peer = widgetMap.get(peerId)
            if (!isTerminalType(peer)) continue
            affectedConnectorIds.add(conn.id)
            affectedWidgetIds.add(peerId)
          }
        }

        // Update all affected connectors
        const ts = new Date().toISOString()
        const messagingMode = mode === 'none' ? null : mode
        for (const connId of affectedConnectorIds) {
          appendEvent(filePath, {
            event: 'connector_updated',
            timestamp: ts,
            connectorId: connId,
            updates: { meta: { messagingMode } },
          })
        }

        sendJson(res, 200, {
          success: true,
          affectedConnectors: [...affectedConnectorIds],
          affectedWidgets: [...affectedWidgetIds],
        })
        pushCanvasUpdate(name, filePath, __viteWs)

        // Inject messaging skill into affected terminals
        if (affectedConnectorIds.size > 0) {
          try {
            const { execSync } = await import('node:child_process')
            const { findTmuxNameForWidget } = await import('./terminal-registry.js')

            for (const wId of affectedWidgetIds) {
              const w = widgetMap.get(wId)
              if (!isTerminalType(w)) continue
              const tmuxName = findTmuxNameForWidget(wId)
              if (!tmuxName) continue

              // Build peer list for this widget
              const peers = []
              for (const conn of connectors) {
                let peerId = null
                if (conn.start?.widgetId === wId) peerId = conn.end?.widgetId
                if (conn.end?.widgetId === wId) peerId = conn.start?.widgetId
                if (peerId && affectedWidgetIds.has(peerId) && peerId !== wId) {
                  const peer = widgetMap.get(peerId)
                  if (peer) peers.push(peer)
                }
              }

              if (mode === 'none') {
                const msg = '📡 [Broadcast disabled]'
                try {
                  execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
                  execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                } catch { /* session may not be active */ }
              } else {
                const peerNames = peers.map((p) => p.props?.prettyName || p.id).join(', ')
                const msg = `📡 [Broadcast ${mode} ACTIVE with ${peerNames}]`
                try {
                  execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
                  execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                } catch { /* session may not be active */ }
              }
            }
          } catch { /* best effort */ }
        }
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update broadcast: ${err.message}` })
      }
      return
    }

    // POST /batch — execute multiple canvas operations in a single request.
    // Reads the canvas once, appends all events, pushes ONE HMR update at the end.
    // Operations reference earlier results via $index (auto) or $refName (opt-in).
    if (routePath === '/batch' && method === 'POST') {
      const { name, operations } = body

      if (!name) {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }
      if (!Array.isArray(operations) || operations.length === 0) {
        sendJson(res, 400, { error: 'operations must be a non-empty array' })
        return
      }
      if (operations.length > 200) {
        sendJson(res, 400, { error: 'Maximum 200 operations per batch' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const canvasData = readCanvas(filePath)
        const widgetIds = new Set((canvasData.widgets || []).map((w) => w.id))
        const connectorIds = new Set((canvasData.connectors || []).map((c) => c.id))
        const widgetMap = new Map((canvasData.widgets || []).map((w) => [w.id, { ...w }]))
        const connectorMap = new Map((canvasData.connectors || []).map((c) => [c.id, { ...c }]))

        const refs = {}
        const results = []
        const validAnchors = ['top', 'bottom', 'left', 'right']

        // Resolve $ref strings — "$0", "$myName", etc.
        function resolveRef(val) {
          if (typeof val !== 'string' || !val.startsWith('$')) return val
          const refName = val.slice(1)
          if (refs[refName] !== undefined) return refs[refName]
          throw new Error(`Unknown ref "${val}"`)
        }

        for (let i = 0; i < operations.length; i++) {
          const op = operations[i]
          const ts = new Date().toISOString()

          try {
            switch (op.op) {
              case 'create-widget': {
                const { type, props = {}, ref, pool, near, direction, resolve: doResolve, source: opSource } = op
                let position = op.position || { x: 0, y: 0 }
                if (!type) throw new Error('type is required')

                // Detect whether an explicit position was provided
                const hasExplicitPos = op.position && (op.position.x !== 0 || op.position.y !== 0)
                const hasNearOptOut = near === false
                const needsAuto = !near && !hasExplicitPos && !hasNearOptOut

                // --near: compute position relative to a reference widget
                if (near) {
                  const nearId = resolveRef(near)
                  const refWidget = widgetMap.get(nearId)
                  if (!refWidget) throw new Error(`Widget "${nearId}" not found (near)`)
                  position = computeNearPosition(refWidget, direction || 'right', type, props)
                }

                // Auto-position: no --near, no explicit x,y → smart default
                if (needsAuto && !near) {
                  const currentWidgets = Array.from(widgetMap.values())
                  position = await computeAutoPosition(currentWidgets, type, props, root, name, opSource || null)
                }

                // Collision resolution: uses live widgetMap (includes earlier batch creates)
                if (near || doResolve || needsAuto) {
                  const resolved = resolvePosition({
                    x: position.x, y: position.y, type, props,
                    widgets: Array.from(widgetMap.values()),
                    gridSize: canvasData.gridSize || 24,
                  })
                  position = { x: resolved.x, y: resolved.y }
                }

                const widgetId = generateWidgetId(type)
                await prepareTerminalWidget({ type, props, widgetId, canvasName: name, req })

                let hotSession = null
                if ((type === 'terminal' || type === 'agent') && pool !== 'cold') {
                  const poolId = resolvePoolId(type, props)
                  hotSession = acquireFromPool(hotPool, poolId, pool)
                  if (!hotSession && pool === 'hot') throw new Error(`No warm sessions available in pool "${poolId}"`)
                }

                const widget = stampBounds({ id: widgetId, type, position, props })

                appendEvent(filePath, { event: 'widget_added', timestamp: ts, widget })

                widgetIds.add(widgetId)
                widgetMap.set(widgetId, widget)
                refs[String(i)] = widgetId
                if (ref) refs[ref] = widgetId

                const result = { index: i, op: 'create-widget', ref: ref || undefined, widgetId, widget }
                if (hotSession) result.hotSession = { id: hotSession.id, tmuxName: hotSession.tmuxName || null, webglReady: !!hotSession.webglReady }
                results.push(result)
                break
              }

              case 'update-widget': {
                const widgetId = resolveRef(op.widgetId)
                const { props } = op
                if (!widgetId) throw new Error('widgetId is required')
                if (!props) throw new Error('props is required')
                if (!widgetIds.has(widgetId)) throw new Error(`Widget "${widgetId}" not found`)

                appendEvent(filePath, { event: 'widget_updated', timestamp: ts, widgetId, props })

                const existing = widgetMap.get(widgetId)
                if (existing) existing.props = { ...existing.props, ...props }

                results.push({ index: i, op: 'update-widget', widgetId, success: true })
                break
              }

              case 'move-widget': {
                const widgetId = resolveRef(op.widgetId)
                const { position } = op
                if (!widgetId) throw new Error('widgetId is required')
                if (!position) throw new Error('position is required')
                if (!widgetIds.has(widgetId)) throw new Error(`Widget "${widgetId}" not found`)

                const existing = widgetMap.get(widgetId)
                const mergedPosition = { ...(existing?.position || {}), ...position }

                appendEvent(filePath, { event: 'widget_moved', timestamp: ts, widgetId, position: mergedPosition })

                if (existing) existing.position = mergedPosition

                results.push({ index: i, op: 'move-widget', widgetId, success: true })
                break
              }

              case 'delete-widget': {
                const widgetId = resolveRef(op.widgetId)
                if (!widgetId) throw new Error('widgetId is required')
                if (!widgetIds.has(widgetId)) throw new Error(`Widget "${widgetId}" not found`)

                appendEvent(filePath, { event: 'widget_removed', timestamp: ts, widgetId })

                widgetIds.delete(widgetId)
                widgetMap.delete(widgetId)

                results.push({ index: i, op: 'delete-widget', widgetId, success: true })
                break
              }

              case 'create-connector': {
                const startWidgetId = resolveRef(op.startWidgetId)
                const endWidgetId = resolveRef(op.endWidgetId)
                const { startAnchor = 'right', endAnchor = 'left', connectorType = 'default', ref } = op

                if (!startWidgetId || !endWidgetId) throw new Error('startWidgetId and endWidgetId are required')
                if (!validAnchors.includes(startAnchor) || !validAnchors.includes(endAnchor)) {
                  throw new Error(`Anchors must be one of: ${validAnchors.join(', ')}`)
                }
                if (startWidgetId === endWidgetId) throw new Error('Cannot connect a widget to itself')
                if (!widgetIds.has(startWidgetId)) throw new Error(`Widget "${startWidgetId}" not found`)
                if (!widgetIds.has(endWidgetId)) throw new Error(`Widget "${endWidgetId}" not found`)

                const connectorId = generateWidgetId('connector')
                const connector = {
                  id: connectorId,
                  type: 'connector',
                  connectorType,
                  start: { widgetId: startWidgetId, anchor: startAnchor },
                  end: { widgetId: endWidgetId, anchor: endAnchor },
                  meta: {},
                }

                appendEvent(filePath, { event: 'connector_added', timestamp: ts, connector })

                connectorIds.add(connectorId)
                connectorMap.set(connectorId, connector)
                refs[String(i)] = connectorId
                if (ref) refs[ref] = connectorId

                results.push({ index: i, op: 'create-connector', ref: ref || undefined, connectorId, success: true })
                break
              }

              case 'delete-connector': {
                const connectorId = resolveRef(op.connectorId)
                if (!connectorId) throw new Error('connectorId is required')
                if (!connectorIds.has(connectorId)) throw new Error(`Connector "${connectorId}" not found`)

                appendEvent(filePath, { event: 'connector_removed', timestamp: ts, connectorId })
                connectorIds.delete(connectorId)
                connectorMap.delete(connectorId)

                results.push({ index: i, op: 'delete-connector', connectorId, success: true })
                break
              }

              case 'update-connector': {
                const connectorId = resolveRef(op.connectorId)
                const { meta } = op
                if (!connectorId) throw new Error('connectorId is required')
                if (!meta) throw new Error('meta is required')
                if (!connectorIds.has(connectorId)) throw new Error(`Connector "${connectorId}" not found`)

                appendEvent(filePath, { event: 'connector_updated', timestamp: ts, connectorId, updates: { meta } })

                const existing = connectorMap.get(connectorId)
                if (existing) existing.meta = { ...(existing.meta || {}), ...meta }

                results.push({ index: i, op: 'update-connector', connectorId, success: true })
                break
              }

              case 'broadcast': {
                const wId = resolveRef(op.widgetId)
                const mode = op.mode || 'two-way'
                const passThrough = !!op.passThrough
                if (!wId) throw new Error('widgetId is required')
                if (!widgetIds.has(wId)) throw new Error(`Widget "${wId}" not found`)

                const isTerminalType = (w) => w && (w.type === 'terminal' || w.type === 'agent')
                const allConnectors = [...connectorMap.values()]
                const affectedConnectorIds = new Set()
                const affectedWidgetIds = new Set([wId])

                if (passThrough) {
                  const visited = new Set([wId])
                  const queue = [wId]
                  while (queue.length > 0) {
                    const current = queue.shift()
                    for (const conn of allConnectors) {
                      let peerId = null
                      if (conn.start?.widgetId === current && conn.end?.widgetId) peerId = conn.end.widgetId
                      if (conn.end?.widgetId === current && conn.start?.widgetId) peerId = conn.start.widgetId
                      if (!peerId || visited.has(peerId)) continue
                      const peer = widgetMap.get(peerId)
                      if (!isTerminalType(peer)) continue
                      affectedConnectorIds.add(conn.id)
                      affectedWidgetIds.add(peerId)
                      visited.add(peerId)
                      queue.push(peerId)
                    }
                  }
                } else {
                  for (const conn of allConnectors) {
                    let peerId = null
                    if (conn.start?.widgetId === wId && conn.end?.widgetId) peerId = conn.end.widgetId
                    if (conn.end?.widgetId === wId && conn.start?.widgetId) peerId = conn.start.widgetId
                    if (!peerId) continue
                    const peer = widgetMap.get(peerId)
                    if (!isTerminalType(peer)) continue
                    affectedConnectorIds.add(conn.id)
                    affectedWidgetIds.add(peerId)
                  }
                }

                const messagingMode = mode === 'none' ? null : mode
                for (const connId of affectedConnectorIds) {
                  appendEvent(filePath, { event: 'connector_updated', timestamp: ts, connectorId: connId, updates: { meta: { messagingMode } } })
                  const conn = connectorMap.get(connId)
                  if (conn) conn.meta = { ...(conn.meta || {}), messagingMode }
                }

                results.push({
                  index: i, op: 'broadcast',
                  affectedConnectors: [...affectedConnectorIds],
                  affectedWidgets: [...affectedWidgetIds],
                  success: true,
                })
                break
              }

              default:
                throw new Error(`Unknown operation "${op.op}"`)
            }
          } catch (opErr) {
            // Fail-fast: push what we have so far, then return the error
            pushCanvasUpdate(name, filePath, __viteWs)
            sendJson(res, 400, {
              success: false,
              error: `Operation ${i} (${op.op}) failed: ${opErr.message}`,
              failedAt: i,
              results,
              refs,
            })
            return
          }
        }

        sendJson(res, 200, { success: true, results, refs })
        pushCanvasUpdate(name, filePath, __viteWs)
      } catch (err) {
        sendJson(res, 500, { error: `Batch failed: ${err.message}` })
      }
      return
    }

    // PUT /rename-page — rename a canvas page file
    if (routePath === '/rename-page' && method === 'PUT') {
      const { name, newTitle } = body

      if (!name || !newTitle) {
        sendJson(res, 400, { error: 'Canvas name and newTitle are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      const kebab = newTitle
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'newTitle must contain at least one alphanumeric character' })
        return
      }

      try {
        const dir = path.dirname(filePath)
        const newFilename = `${kebab}.canvas.jsonl`
        const newPath = path.join(dir, newFilename)

        if (newPath !== filePath && fs.existsSync(newPath)) {
          sendJson(res, 409, { error: `A canvas file named "${newFilename}" already exists in this directory` })
          return
        }

        fs.renameSync(filePath, newPath)

        const newCanonicalId = toCanvasId(path.relative(root, newPath).replace(/\\/g, '/'))

        appendEvent(newPath, {
          event: 'settings_updated',
          timestamp: new Date().toISOString(),
          settings: { title: newTitle },
        })

        // Update pageOrder in .meta.json if it exists
        const metaForOrder = readFolderMeta(dir)
        if (metaForOrder?.pageOrder) {
          try {
            const updated = metaForOrder.pageOrder.map((entry) =>
              typeof entry === 'string' && entry === name ? newCanonicalId : entry
            )
            metaForOrder.pageOrder = updated
            writeFolderMeta(dir, metaForOrder)
          } catch { /* skip */ }
        }

        sendJson(res, 200, { success: true, name: newCanonicalId, route: '/canvas/' + newCanonicalId })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to rename page: ${err.message}` })
      }
      return
    }

    // PUT /reorder-pages — save page order for a canvas folder
    if (routePath === '/reorder-pages' && method === 'PUT') {
      const { folder, order } = body

      if (!folder || !Array.isArray(order)) {
        sendJson(res, 400, { error: 'folder (string) and order (array) are required' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const folderDir = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        meta.pageOrder = order
        writeFolderMeta(folderDir, meta)
        sendJson(res, 200, { success: true })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to save page order: ${err.message}` })
      }
      return
    }

    // GET /page-order?folder=... — read page order for a folder
    if (routePath.startsWith('/page-order') && method === 'GET') {
      const pageOrderUrl = new URL(routePath, 'http://localhost')
      const folder = pageOrderUrl.searchParams.get('folder')

      if (!folder) {
        sendJson(res, 400, { error: 'folder query parameter is required' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const folderDir = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        sendJson(res, 200, { order: meta?.pageOrder || null })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read page order: ${err.message}` })
      }
      return
    }

    // PUT /update-folder-meta — update folder .meta.json title
    if (routePath === '/update-folder-meta' && method === 'PUT') {
      const { folder, title } = body

      if (!folder || !title) {
        sendJson(res, 400, { error: 'folder and title are required' })
        return
      }

      const kebab = title
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'title must contain at least one alphanumeric character' })
        return
      }

      const canvasDir = path.join(root, 'src', 'canvas')
      const isFolderSuffix = fs.existsSync(path.join(canvasDir, `${folder}.folder`))
      const folderDir = isFolderSuffix
        ? path.join(canvasDir, `${folder}.folder`)
        : fs.existsSync(path.join(canvasDir, folder))
          ? path.join(canvasDir, folder)
          : null

      if (!folderDir) {
        sendJson(res, 404, { error: `Folder "${folder}" not found` })
        return
      }

      try {
        const meta = readFolderMeta(folderDir)
        const dirName = path.basename(folderDir).replace(/\.folder$/, '')
        meta.title = title

        // Rename folder directory if the kebab name differs
        const needsRename = kebab !== dirName
        let newDirName = dirName

        if (needsRename) {
          const suffix = isFolderSuffix ? '.folder' : ''
          const newFolderDir = path.join(canvasDir, `${kebab}${suffix}`)
          if (fs.existsSync(newFolderDir)) {
            sendJson(res, 409, { error: `A folder named "${kebab}" already exists` })
            return
          }
          // Write updated meta, rename file to match new dir name, rename dir
          writeFolderMeta(folderDir, meta)
          const metaPath = path.join(folderDir, `${dirName}.meta.json`)
          const newMetaPath = path.join(folderDir, `${kebab}.meta.json`)
          if (newMetaPath !== metaPath) {
            fs.renameSync(metaPath, newMetaPath)
          }
          fs.renameSync(folderDir, newFolderDir)
          newDirName = kebab
        } else {
          writeFolderMeta(folderDir, meta)
        }

        sendJson(res, 200, { success: true, folder: newDirName, renamed: needsRename })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update folder meta: ${err.message}` })
      }
      return
    }

    // POST /duplicate — duplicate an existing canvas page with its widgets
    if (routePath === '/duplicate' && method === 'POST') {
      const { name, newTitle } = body

      if (!name || !newTitle) {
        sendJson(res, 400, { error: 'Canvas name and newTitle are required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      const kebab = newTitle
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'newTitle must contain at least one alphanumeric character' })
        return
      }

      try {
        const sourceData = readCanvas(filePath)
        const dir = path.dirname(filePath)
        const newFilename = `${kebab}.canvas.jsonl`
        const newPath = path.join(dir, newFilename)

        if (fs.existsSync(newPath)) {
          sendJson(res, 409, { error: `A canvas file named "${newFilename}" already exists` })
          return
        }

        // Re-ID all widgets to avoid collisions
        const widgets = (sourceData.widgets || []).map(w => ({
          ...w,
          id: generateWidgetId(w.type || 'widget'),
        }))

        const creationEvent = {
          event: 'canvas_created',
          timestamp: new Date().toISOString(),
          title: newTitle,
          grid: sourceData.grid ?? true,
          gridSize: sourceData.gridSize ?? 24,
          colorMode: sourceData.colorMode ?? 'auto',
          widgets,
        }

        writeNewCanvas(newPath, creationEvent)

        const relPath = path.relative(root, newPath).replace(/\\/g, '/')
        const canonicalName = toCanvasId(relPath) || kebab

        sendJson(res, 201, {
          success: true,
          name: canonicalName,
          path: relPath,
          route: `/canvas/${canonicalName}`,
        })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to duplicate canvas: ${err.message}` })
      }
      return
    }

    // POST /create — create a new .canvas.jsonl file
    // Supports `convertFrom` to convert a single-page canvas into a multi-page folder.
    if (routePath === '/create' && method === 'POST') {
      const {
        name,
        title,
        folder,
        convertFrom,
        author,
        description,
        meta,
        grid = true,
        gridSize = 24,
        colorMode = 'auto',
      } = body

      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const kebab = name
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'Name must contain at least one alphanumeric character' })
        return
      }

      // ── Convert single-page canvas to multi-page folder ──────────────
      if (convertFrom && typeof convertFrom === 'string') {
        // Only allow flat root canvases (no path segments, no proto:)
        if (convertFrom.includes('/') || convertFrom.startsWith('proto:')) {
          sendJson(res, 400, { error: 'convertFrom only supports flat root canvases (no path segments or proto: prefix)' })
          return
        }

        const canvasDir = path.join(root, 'src', 'canvas')
        const existingPath = findCanvasPath(root, convertFrom)
        if (!existingPath) {
          sendJson(res, 404, { error: `Canvas "${convertFrom}" not found` })
          return
        }

        // Verify it's actually a flat file in src/canvas/ (not already in a folder)
        const existingRel = path.relative(canvasDir, existingPath).replace(/\\/g, '/')
        if (existingRel.includes('/')) {
          sendJson(res, 400, { error: `Canvas "${convertFrom}" is already inside a folder` })
          return
        }

        const newDir = path.join(canvasDir, convertFrom)
        const dotFolderDir = path.join(canvasDir, `${convertFrom}.folder`)

        // Preflight: check for collisions
        if (fs.existsSync(newDir)) {
          sendJson(res, 409, { error: `Directory "${convertFrom}" already exists in src/canvas/` })
          return
        }
        if (fs.existsSync(dotFolderDir)) {
          sendJson(res, 409, { error: `Directory "${convertFrom}.folder" already exists in src/canvas/` })
          return
        }

        // Read the existing canvas to extract metadata for .meta.json
        let existingData
        try {
          existingData = readCanvas(existingPath)
        } catch (err) {
          sendJson(res, 500, { error: `Failed to read existing canvas: ${err.message}` })
          return
        }

        const existingBasename = path.basename(existingPath)

        const movedCanvasPath = path.join(newDir, existingBasename)
        const newPagePath = path.join(newDir, `${kebab}.canvas.jsonl`)

        if (existingBasename === `${kebab}.canvas.jsonl`) {
          sendJson(res, 409, { error: `New page name "${kebab}" collides with existing canvas filename` })
          return
        }

        // Perform the conversion with rollback on failure
        const rollbackOps = []
        try {
          // 1. Create the directory
          fs.mkdirSync(newDir, { recursive: true })
          rollbackOps.push(() => { try { fs.rmdirSync(newDir) } catch { /* ignore */ } })

          // 2. Move the existing canvas file
          fs.renameSync(existingPath, movedCanvasPath)
          rollbackOps.push(() => { try { fs.renameSync(movedCanvasPath, existingPath) } catch { /* ignore */ } })

          // 3. Write .meta.json with metadata from the existing canvas
          const metaObj = { title: existingData?.title || convertFrom }
          if (existingData?.description) metaObj.description = existingData.description
          if (existingData?.author) metaObj.author = existingData.author
          const metaPath = path.join(newDir, `${convertFrom}.meta.json`)
          fs.writeFileSync(metaPath, JSON.stringify(metaObj, null, 2) + '\n', 'utf-8')
          rollbackOps.push(() => { try { fs.unlinkSync(metaPath) } catch { /* ignore */ } })

          // 4. Create the new page
          const creationEvent = {
            event: 'canvas_created',
            timestamp: new Date().toISOString(),
            title: title || kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            grid,
            gridSize,
            colorMode,
            widgets: [],
          }
          writeNewCanvas(newPagePath, creationEvent)

          const relPath = path.relative(root, newPagePath).replace(/\\/g, '/')
          const canonicalName = toCanvasId(relPath) || kebab

          sendJson(res, 201, {
            success: true,
            converted: true,
            name: canonicalName,
            path: relPath,
            route: `/canvas/${canonicalName}`,
          })
        } catch (err) {
          // Rollback in reverse order
          for (let i = rollbackOps.length - 1; i >= 0; i--) {
            rollbackOps[i]()
          }
          sendJson(res, 500, { error: `Failed to convert canvas to folder: ${err.message}` })
        }
        return
      }

      // ── Standard canvas creation ─────────────────────────────────────
      // Determine target directory
      const canvasDir = path.join(root, 'src', 'canvas')
      let targetDir = canvasDir

      if (folder) {
        const dotFolderDir = path.join(canvasDir, `${folder}.folder`)
        const plainDir = path.join(canvasDir, folder)

        if (fs.existsSync(dotFolderDir)) {
          // Existing .folder/ directory
          targetDir = dotFolderDir
        } else if (fs.existsSync(plainDir) && fs.statSync(plainDir).isDirectory()) {
          // Existing plain directory
          targetDir = plainDir
        } else {
          // Create new plain directory
          try {
            fs.mkdirSync(plainDir, { recursive: true })
            // Write .meta.json if meta was provided
            if (meta && typeof meta === 'object') {
              const metaPath = path.join(plainDir, `${folder}.meta.json`)
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
            }
          } catch (err) {
            sendJson(res, 500, { error: `Failed to create directory: ${err.message}` })
            return
          }
          targetDir = plainDir
        }
      }

      const canvasPath = path.join(targetDir, `${kebab}.canvas.jsonl`)
      if (fs.existsSync(canvasPath)) {
        sendJson(res, 409, { error: `Canvas "${kebab}" already exists` })
        return
      }

      const creationEvent = {
        event: 'canvas_created',
        timestamp: new Date().toISOString(),
        title: title || kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        grid,
        gridSize,
        colorMode,
        widgets: [],
      }

      if (author) {
        creationEvent.author = author
      }

      if (description) {
        creationEvent.description = description
      }

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        writeNewCanvas(canvasPath, creationEvent)

        const relPath = path.relative(root, canvasPath).replace(/\\/g, '/')
        const canonicalName = toCanvasId(relPath) || kebab

        const result = {
          success: true,
          name: canonicalName,
          path: relPath,
          route: `/canvas/${canonicalName}`,
        }

        sendJson(res, 201, result)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to create canvas: ${err.message}` })
      }
      return
    }

    // ── Story routes ──────────────────────────────────────────────────

    // GET /stories — list all .story.{jsx,tsx} files with their exports
    if (routePath === '/stories' && method === 'GET') {
      try {
        const storyFiles = findStoryFiles(root)
        sendJson(res, 200, { stories: storyFiles })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to list stories: ${err.message}` })
      }
      return
    }

    // POST /create-story — scaffold a new .story.jsx/.tsx file
    if (routePath === '/create-story' && method === 'POST') {
      const { name, location, format = 'jsx', canvasName: storyCanvasName } = body

      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Component name is required' })
        return
      }

      const kebab = name
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!kebab) {
        sendJson(res, 400, { error: 'Name must contain at least one alphanumeric character' })
        return
      }

      const ext = format === 'tsx' ? 'tsx' : 'jsx'

      // Resolve target directory from location + canvas name
      let targetDir
      if (location === 'components') {
        targetDir = path.join(root, 'src', 'components')
      } else if (storyCanvasName) {
        const canvasPath = findCanvasPath(root, storyCanvasName)
        targetDir = canvasPath ? path.dirname(canvasPath) : path.join(root, 'src', 'canvas')
      } else {
        targetDir = path.join(root, 'src', 'canvas')
      }

      const storyPath = path.join(targetDir, `${kebab}.story.${ext}`)
      if (fs.existsSync(storyPath)) {
        sendJson(res, 409, { error: `Story "${kebab}.story.${ext}" already exists at ${path.relative(root, targetDir)}` })
        return
      }

      // Check for duplicate story name anywhere in the project (Vite data plugin
      // enforces global uniqueness and would fail the build on duplicates)
      const existing = findStoryFiles(root)
      if (existing.some(s => s.name === kebab)) {
        sendJson(res, 409, { error: `A story named "${kebab}" already exists in the project` })
        return
      }

      const componentName = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
      const content = `/**
 * ${componentName} component stories.
 * Each named export becomes a draggable widget on the canvas.
 */

export function Default() {
  return (
    <div style={{ padding: '1.5rem', minWidth: 200 }}>
      <h3>${componentName}</h3>
      <p>Edit this file to build your component.</p>
    </div>
  )
}
`

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(storyPath, content, 'utf-8')

        const relPath = path.relative(root, storyPath)
        sendJson(res, 201, {
          success: true,
          name: kebab,
          path: relPath,
          storyId: kebab,
        })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to create story: ${err.message}` })
      }
      return
    }

    // GET /github/available — check if gh CLI is installed locally
    if (routePath === '/github/available' && method === 'GET') {
      sendJson(res, 200, {
        available: isGhCliAvailable(),
        installUrl: GH_INSTALL_URL,
      })
      return
    }

    // POST /github/embed — fetch metadata for GitHub issue/discussion/comment links
    if (routePath === '/github/embed' && method === 'POST') {
      const rawUrl = typeof body?.url === 'string' ? body.url.trim() : ''

      if (!rawUrl) {
        sendJson(res, 400, { code: 'invalid_url', error: 'url is required' })
        return
      }

      if (!isGitHubEmbedUrl(rawUrl)) {
        sendJson(res, 400, {
          code: 'unsupported_url',
          error: 'Only GitHub issue, discussion, and comment URLs are supported.',
        })
        return
      }

      try {
        const snapshot = fetchGitHubEmbedSnapshot(rawUrl)
        sendJson(res, 200, { success: true, snapshot })
      } catch (error) {
        if (error instanceof GitHubEmbedError) {
          sendJson(res, error.status ?? 500, {
            code: error.code,
            error: error.message,
            installUrl: error.code === 'gh_unavailable' ? GH_INSTALL_URL : undefined,
          })
          return
        }

        sendJson(res, 500, {
          code: 'gh_fetch_failed',
          error: error?.message || 'Failed to fetch GitHub metadata.',
        })
      }
      return
    }

    // ── Image routes ──────────────────────────────────────────────────

    const imagesDir = path.join(root, 'assets', 'canvas', 'images')
    const snapshotsDir = path.join(root, 'assets', 'canvas', 'snapshots')

    const MIME_TO_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }
    const EXT_TO_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

    // Route snapshot uploads (snapshot-* prefix) to the snapshots directory
    function resolveWriteDir(canvasName) {
      return canvasName?.startsWith('snapshot-') ? snapshotsDir : imagesDir
    }

    function resolveImagePath(filename) {
      // Check snapshots dir first, then images
      const snapshotPath = path.join(snapshotsDir, filename)
      if (fs.existsSync(snapshotPath)) return snapshotPath
      const imagePath = path.join(imagesDir, filename)
      if (fs.existsSync(imagePath)) return imagePath
      return null
    }

    // POST /image — upload a pasted image (base64 data URL)
    if (routePath === '/image' && method === 'POST') {
      const { dataUrl, canvasName } = body

      if (!dataUrl || typeof dataUrl !== 'string') {
        sendJson(res, 400, { error: 'dataUrl is required' })
        return
      }

      const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i)
      if (!match) {
        sendJson(res, 400, { error: 'Invalid data URL format' })
        return
      }

      const mime = match[1].toLowerCase()
      const ext = MIME_TO_EXT[mime]
      if (!ext) {
        sendJson(res, 400, { error: `Unsupported image type: ${mime}` })
        return
      }

      const base64 = match[2]
      const buffer = Buffer.from(base64, 'base64')

      if (buffer.length > MAX_IMAGE_SIZE) {
        sendJson(res, 413, { error: `Image exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` })
        return
      }

      const now = new Date()
      const pad = (n) => String(n).padStart(2, '0')
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}--${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
      const suffix = `-${Math.random().toString(36).slice(2, 6)}`
      const prefix = canvasName ? `${canvasName.replace(/[/:]/g, '--')}--` : ''

      // Support explicit filename for snapshot uploads (stable naming)
      // and cropped image uploads (user-initiated crop)
      const explicitName = body.filename
      let filename
      if (explicitName && /^snapshot-[a-z0-9_-]+--(latest|light|dark)\.webp$/i.test(explicitName)) {
        filename = explicitName
      } else if (explicitName && /--cropped--\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2}\.\w+$/.test(explicitName)) {
        // Cropped image: validate format, strip path traversal
        const safeName = explicitName.replace(/[/\\]/g, '')
        if (safeName === explicitName && !explicitName.includes('..')) {
          filename = explicitName
        } else {
          filename = `${prefix}${dateStr}${suffix}.${ext}`
        }
      } else {
        filename = `${prefix}${dateStr}${suffix}.${ext}`
      }
      const targetDir = resolveWriteDir(canvasName || '')

      try {
        fs.mkdirSync(targetDir, { recursive: true })
        fs.writeFileSync(path.join(targetDir, filename), buffer)
        sendJson(res, 201, { success: true, filename })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to save image: ${err.message}` })
      }
      return
    }

    // GET /images/<filename> — serve an image file
    if (routePath.startsWith('/images/') && method === 'GET') {
      // Strip query string (e.g. ?v=123 cache busters) from filename
      let filename = routePath.slice('/images/'.length)
      const qIdx = filename.indexOf('?')
      if (qIdx !== -1) filename = filename.slice(0, qIdx)

      // Block path traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        sendJson(res, 400, { error: 'Invalid filename' })
        return
      }

      const filePath = resolveImagePath(filename)
      if (!filePath) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }

      const ext = path.extname(filename).slice(1).toLowerCase()
      const contentType = EXT_TO_MIME[ext] || 'application/octet-stream'

      try {
        const data = fs.readFileSync(filePath)
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': data.length,
          'Cache-Control': 'no-cache',
        })
        res.end(data)
      } catch (err) {
        sendJson(res, 500, { error: `Failed to serve image: ${err.message}` })
      }
      return
    }

    // POST /image/duplicate — copy an image file with a new timestamped name
    if (routePath === '/image/duplicate' && method === 'POST') {
      const { filename } = body

      if (!filename || typeof filename !== 'string') {
        sendJson(res, 400, { error: 'filename is required' })
        return
      }

      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        sendJson(res, 400, { error: 'Invalid filename' })
        return
      }

      const sourcePath = resolveImagePath(filename)
      if (!sourcePath) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }

      try {
        const ext = path.extname(filename)
        const now = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}--${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
        // Preserve privacy prefix
        const prefix = filename.startsWith('~') ? '~' : ''
        const baseName = filename.replace(/^~/, '').replace(ext, '')
        // Extract canvas prefix (everything before the date pattern or the full base)
        const canvasMatch = baseName.match(/^(.+?--)\d{4}-/)
        const canvasPrefix = canvasMatch ? canvasMatch[1] : ''
        const newFilename = `${prefix}${canvasPrefix}${dateStr}${ext}`
        const targetDir = path.dirname(sourcePath)
        fs.copyFileSync(sourcePath, path.join(targetDir, newFilename))
        sendJson(res, 201, { success: true, filename: newFilename })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to duplicate image: ${err.message}` })
      }
      return
    }

    // POST /image/toggle-private — toggle tilde prefix on image filename
    if (routePath === '/image/toggle-private' && method === 'POST') {
      const { filename } = body

      if (!filename || typeof filename !== 'string') {
        sendJson(res, 400, { error: 'filename is required' })
        return
      }

      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        sendJson(res, 400, { error: 'Invalid filename' })
        return
      }

      const isPrivate = filename.startsWith('~')
      const newFilename = isPrivate ? filename.slice(1) : `~${filename}`
      const oldPath = resolveImagePath(filename)
      if (!oldPath) {
        sendJson(res, 404, { error: 'Image not found' })
        return
      }
      const parentDir = path.dirname(oldPath)
      const newPath = path.join(parentDir, newFilename)

      try {
        fs.renameSync(oldPath, newPath)
        sendJson(res, 200, { success: true, filename: newFilename, private: !isPrivate })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to toggle private: ${err.message}` })
      }
      return
    }

    // ── Agent Signal API ──────────────────────────────────────────────────

    // POST /agent/signal — agent signals status (done/error/running)
    if (routePath === '/agent/signal' && method === 'POST') {
      const { widgetId, canvasId, branch, status, message, data: payload } = body

      if (!widgetId || !status) {
        sendJson(res, 400, { error: 'widgetId and status are required' })
        return
      }

      const validStatuses = ['done', 'error', 'running']
      if (!validStatuses.includes(status)) {
        sendJson(res, 400, { error: `status must be one of: ${validStatuses.join(', ')}` })
        return
      }

      try {
        const { updateAgentStatus, initTerminalConfig } = await import('./terminal-config.js')
        initTerminalConfig(root)
        updateAgentStatus({
          branch: branch || 'unknown',
          canvasId: canvasId || 'unknown',
          widgetId,
          status,
          message: message || null,
          data: payload || null,
        })

        // Push status to canvas clients via Vite WS custom event
        if (__viteWs) {
          __viteWs.send({
            type: 'custom',
            event: 'storyboard:agent-status',
            data: { widgetId, canvasId, status, message, timestamp: new Date().toISOString() },
          })
        }

        sendJson(res, 200, { success: true, status })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update agent status: ${err.message}` })
      }
      return
    }

    // GET /agent/status — poll agent status for a widget
    if (routePath === '/agent/status' && method === 'GET') {
      const url = new URL(req.url, 'http://localhost')
      const widgetId = url.searchParams.get('widgetId')
      const canvasId = url.searchParams.get('canvasId') || 'unknown'
      const branch = url.searchParams.get('branch') || 'unknown'

      if (!widgetId) {
        sendJson(res, 400, { error: 'widgetId query parameter is required' })
        return
      }

      try {
        const { readTerminalConfig, initTerminalConfig } = await import('./terminal-config.js')
        initTerminalConfig(root)
        const config = readTerminalConfig({ branch, canvasId, widgetId })
        sendJson(res, 200, { agentStatus: config?.agentStatus || null })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read agent status: ${err.message}` })
      }
      return
    }

    // POST /agent/spawn — spawn a headless agent session
    if (routePath === '/agent/spawn' && method === 'POST') {
      const { canvasId, widgetId, prompt, autopilot = true, branch: reqBranch, agentId } = body

      if (!canvasId || !widgetId || !prompt) {
        sendJson(res, 400, { error: 'canvasId, widgetId, and prompt are required' })
        return
      }

      try {
        const { execSync } = await import('node:child_process')
        const { writeTerminalConfig, updateAgentStatus, initTerminalConfig } = await import('./terminal-config.js')
        const { generateTmuxName, registerSession } = await import('./terminal-registry.js')
        const fsModule = await import('node:fs')

        initTerminalConfig(root)

        let branch = reqBranch || 'unknown'
        try {
          branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }

        const tmuxName = generateTmuxName(branch, canvasId, widgetId)

        // Register in session registry
        registerSession({ branch, canvasId, widgetId, prettyName: null })

        // Write terminal config with connected widget context
        writeTerminalConfig({ branch, canvasId, widgetId })

        // Mark as running
        updateAgentStatus({ branch, canvasId, widgetId, status: 'running', message: 'Agent spawning...' })

        // Push running status to clients
        if (__viteWs) {
          __viteWs.send({
            type: 'custom',
            event: 'storyboard:agent-status',
            data: { widgetId, canvasId, status: 'running', timestamp: new Date().toISOString() },
          })
        }

        // Build server URL for agent env vars
        const serverUrl = `http://localhost:${req.socket?.localPort || 1234}`

        // Create headless tmux session
        try {
          execSync(`tmux new-session -d -s "${tmuxName}" -c "${root}"`, { stdio: 'ignore' })
          execSync(`tmux set-option -t "${tmuxName}" status off`, { stdio: 'ignore' })
          execSync(`tmux set-option -t "${tmuxName}" mouse on`, { stdio: 'ignore' })
          execSync(`tmux set-option -t "${tmuxName}" set-clipboard off`, { stdio: 'ignore' })
        } catch (err) {
          // Session may already exist
          devLog().logEvent('warn', 'tmux session create failed', { tmuxName, error: err.message })
        }

        // Set environment variables at tmux session level (inherited by new panes)
        const envMap = {
          STORYBOARD_WIDGET_ID: widgetId,
          STORYBOARD_CANVAS_ID: canvasId,
          STORYBOARD_BRANCH: branch,
          STORYBOARD_SERVER_URL: serverUrl,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          TERM_PROGRAM: 'storyboard',
        }
        for (const [key, val] of Object.entries(envMap)) {
          execSync(`tmux setenv -t "${tmuxName}" ${key} "${val}"`, { stdio: 'ignore' })
        }

        // Write env file for this terminal session — sourced before copilot launch
        // This avoids race conditions with tmux send-keys export
        const envFile = path.join(root, '.storyboard', 'terminals', `${tmuxName}.env`)
        const envContent = Object.entries(envMap).map(([k, v]) => `export ${k}=${JSON.stringify(v)}`).join('\n') + '\n'
        fsModule.writeFileSync(envFile, envContent)

        // Resolve agent config from storyboard.config.json
        let agentConfig = null
        try {
          const configPath = path.join(root, 'storyboard.config.json')
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
          const agents = config?.canvas?.agents || {}
          if (agentId && agents[agentId]) {
            agentConfig = agents[agentId]
          } else {
            agentConfig = Object.values(agents).find(a => a.default) || Object.values(agents)[0] || null
          }
        } catch { /* empty */ }

        // Build command from widgets.config.json (prompt mode) or storyboard.config.json (interactive)
        let copilotCmd
        if (autopilot) {
          copilotCmd = buildPromptCmd({ prompt, envFile, agentId })
          if (!copilotCmd) {
            const execution = getPromptExecution()
            sendJson(res, 400, { error: `Agent "${agentId || execution?.default || 'unknown'}" has no prompt command configured` })
            return
          }
        } else {
          const startupCmd = agentConfig?.startupCommand || 'copilot'
          copilotCmd = `source ${envFile} && ${startupCmd}`
        }

        setTimeout(() => {
          try {
            execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(copilotCmd)}`, { stdio: 'ignore' })
            execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          } catch (err) {
            devLog().logEvent('warn', 'Failed to launch copilot', { tmuxName, error: err.message })
          }
          // Poll for agent readiness using configured readinessSignal
          const readinessSignal = agentConfig?.readinessSignal || 'Environment loaded:'
          const postStartup = agentConfig?.postStartup || '/allow-all on'
          let sent = false
          const poll = setInterval(() => {
            if (sent) { clearInterval(poll); return }
            try {
              const pane = execSync(`tmux capture-pane -t "${tmuxName}" -p`, { encoding: 'utf8', timeout: 1000 })
              if (pane.includes(readinessSignal)) {
                sent = true
                clearInterval(poll)
                if (postStartup) {
                  setTimeout(() => {
                    try {
                      execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(postStartup)}`, { stdio: 'ignore' })
                      execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                    } catch { /* empty */ }
                  }, 500)
                }
              }
            } catch { /* empty */ }
          }, 1000)
          setTimeout(() => { if (!sent) { sent = true; clearInterval(poll) } }, 15000)
        }, 500)

        // Set up idle timeout (5 minutes)
        const IDLE_TIMEOUT = 5 * 60 * 1000
        setTimeout(async () => {
          try {
            const { readTerminalConfig } = await import('./terminal-config.js')
            const config = readTerminalConfig({ branch, canvasId, widgetId })
            if (config?.agentStatus?.status === 'running') {
              updateAgentStatus({ branch, canvasId, widgetId, status: 'error', message: 'Agent timed out (5 min idle)' })
              if (__viteWs) {
                __viteWs.send({
                  type: 'custom',
                  event: 'storyboard:agent-status',
                  data: { widgetId, canvasId, status: 'error', message: 'Agent timed out', timestamp: new Date().toISOString() },
                })
              }
            }
          } catch { /* empty */ }
        }, IDLE_TIMEOUT)

        sendJson(res, 200, { success: true, tmuxName, status: 'running' })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to spawn agent: ${err.message}` })
      }
      return
    }

    // POST /agent/peek — reconnect a headless agent session to a visible terminal widget
    if (routePath === '/agent/peek' && method === 'POST') {
      const { widgetId, canvasId } = body

      if (!widgetId) {
        sendJson(res, 400, { error: 'widgetId is required' })
        return
      }

      try {
        const { execSync } = await import('node:child_process')
        const { generateTmuxName } = await import('./terminal-registry.js')

        let branch = 'unknown'
        try {
          branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }

        const tmuxName = generateTmuxName(branch, canvasId || 'unknown', widgetId)

        // Check if the tmux session exists
        try {
          execSync(`tmux has-session -t "${tmuxName}"`, { stdio: 'ignore' })
        } catch {
          sendJson(res, 404, { error: `No tmux session found for widget ${widgetId}` })
          return
        }

        // The session exists — return info so the client can create a terminal widget
        // that connects to it
        sendJson(res, 200, {
          success: true,
          tmuxName,
          widgetId,
          canvasId: canvasId || 'unknown',
          message: 'Session is alive. Create a terminal widget to connect.',
        })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to peek agent session: ${err.message}` })
      }
      return
    }

    // ── Terminal Messaging API ──────────────────────────────────────────

    // POST /terminal/send — send a message via the messaging bus
    if (routePath === '/terminal/send' && method === 'POST') {
      const { widgetId: targetWidgetId, message, from: senderWidgetId } = body

      if (!targetWidgetId || !message) {
        sendJson(res, 400, { error: 'widgetId and message are required' })
        return
      }

      try {
        const { publish, subscribe } = await import('../messaging/bus.js')
        const { terminalChannel, isBound } = await import('../messaging/delivery.js')
        const { readTerminalConfigById, initTerminalConfig } = await import('./terminal-config.js')

        initTerminalConfig(root)

        // Resolve sender display name
        let senderName = senderWidgetId || 'unknown'
        if (senderWidgetId) {
          try {
            const senderConfig = readTerminalConfigById(senderWidgetId)
            if (senderConfig?.displayName) senderName = senderConfig.displayName
          } catch { /* use widgetId as fallback */ }
        }

        // Resolve target branch/canvas from config
        const targetConfig = readTerminalConfigById(targetWidgetId)
        let currentBranch = 'unknown'
        try {
          const { execSync: ex } = await import('node:child_process')
          currentBranch = ex('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }
        const targetBranch = targetConfig?.branch || currentBranch
        const targetCanvasId = targetConfig?.canvasId || 'unknown'
        const channel = terminalChannel(targetBranch, targetCanvasId, targetWidgetId)

        // Publish to the bus — delivery bridge handles tmux injection
        const event = await publish(channel, {
          type: 'message:request',
          senderId: senderWidgetId || 'cli',
          senderName,
          body: message,
          widgetId: targetWidgetId,
        })

        // If the delivery bridge is bound, wait briefly for delivery ack
        if (isBound(targetWidgetId)) {
          const ackPromise = new Promise((resolve) => {
            let timer
            const unsub = subscribe(channel, (ack) => {
              if (ack.correlationId === event.id && (ack.type === 'message:delivered' || ack.type === 'message:failed')) {
                clearTimeout(timer)
                unsub()
                resolve(ack)
              }
            })
            timer = setTimeout(() => { unsub(); resolve(null) }, 5000)
          })

          const ack = await ackPromise
          if (ack?.type === 'message:delivered') {
            sendJson(res, 200, { success: true, delivered: true, eventId: event.id })
          } else if (ack?.type === 'message:failed') {
            sendJson(res, 200, { success: true, queued: true, eventId: event.id, note: 'tmux delivery failed, message persisted on bus' })
          } else {
            sendJson(res, 200, { success: true, queued: true, eventId: event.id, note: 'delivery timeout, message persisted on bus' })
          }
        } else {
          // No binding — message is on the bus, will be delivered when agent binds
          sendJson(res, 200, { success: true, queued: true, eventId: event.id })
        }
      } catch (err) {
        sendJson(res, 500, { error: `Failed to send message: ${err.message}` })
      }
      return
    }

    // POST /terminal/output — save latest output to terminal config
    if (routePath === '/terminal/output' && method === 'POST') {
      const { widgetId: outputWidgetId, content, summary } = body

      if (!outputWidgetId) {
        sendJson(res, 400, { error: 'widgetId is required' })
        return
      }

      try {
        const { updateLatestOutput, initTerminalConfig } = await import('./terminal-config.js')
        initTerminalConfig(root)

        updateLatestOutput(outputWidgetId, {
          content: content || '',
          summary: summary || '',
          updatedAt: new Date().toISOString(),
        })

        sendJson(res, 200, { success: true })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to save output: ${err.message}` })
      }
      return
    }

    // POST /prompt/spawn — spawn a prompt agent session (acquires from hot pool)
    if (routePath === '/prompt/spawn' && method === 'POST') {
      const { canvasId, widgetId, prompt } = body

      if (!canvasId || !widgetId || !prompt) {
        sendJson(res, 400, { error: 'canvasId, widgetId, and prompt are required' })
        return
      }

      // Try to acquire a warm tmux session from the prompt pool
      const warmSession = hotPool?.acquire('prompt') || null

      // Delegate to agent/spawn — the prompt widget is just a specialized agent
      // We reuse the same tmux-based infrastructure
      try {
        const { execSync } = await import('node:child_process')
        const { writeTerminalConfig, updateAgentStatus, updateTerminalConnections, initTerminalConfig } = await import('./terminal-config.js')
        const { generateTmuxName, registerSession } = await import('./terminal-registry.js')
        const fsModule = await import('node:fs')

        initTerminalConfig(root)

        let branch = 'unknown'
        try {
          branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }

        const serverUrl = `http://localhost:${req.socket?.localPort || 1234}`
        const tmuxName = generateTmuxName(branch, canvasId, widgetId)

        registerSession({ branch, canvasId, widgetId, prettyName: null })
        writeTerminalConfig({ branch, canvasId, widgetId, serverUrl, tmuxName })
        updateAgentStatus({ branch, canvasId, widgetId, status: 'running', message: 'Prompt agent spawning...' })

        // Resolve connected widgets so the terminal-agent has context
        try {
          const canvasFilePath = findCanvasPath(root, canvasId)
          if (canvasFilePath) {
            const canvasData = readCanvas(canvasFilePath)
            const widgetMap = new Map((canvasData.widgets || []).map(w => [w.id, w]))
            const connectors = canvasData.connectors || []
            const connectedIds = new Set()
            for (const conn of connectors) {
              if (conn.start?.widgetId === widgetId) connectedIds.add(conn.end?.widgetId)
              if (conn.end?.widgetId === widgetId) connectedIds.add(conn.start?.widgetId)
            }
            connectedIds.delete(undefined)
            connectedIds.delete(null)
            const connectedWidgets = [...connectedIds]
              .map(id => widgetMap.get(id))
              .filter(Boolean)
              .map(w => ({ id: w.id, type: w.type, props: w.props, position: w.position }))
            if (connectedWidgets.length > 0) {
              updateTerminalConnections({ branch, canvasId, widgetId, connectedWidgets })
            }
          }
        } catch (err) {
          devLog().logEvent('warn', 'Failed to resolve prompt connections', { error: err.message })
        }

        if (__viteWs) {
          __viteWs.send({
            type: 'custom',
            event: 'storyboard:agent-status',
            data: { widgetId, canvasId, status: 'running', timestamp: new Date().toISOString() },
          })
        }

        // If we got a warm tmux session, rename it to the canonical name.
        // Otherwise, create a fresh tmux session from scratch.
        let usedWarm = false
        if (warmSession?.tmuxName) {
          try {
            // Kill any existing session with the canonical name first
            try { execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' }) } catch { /* empty */ }
            // Rename the warm session to the canonical name
            execSync(`tmux rename-session -t "${warmSession.tmuxName}" "${tmuxName}"`, { stdio: 'ignore' })
            usedWarm = true
            hotPool.consume('prompt', warmSession.id)
          } catch {
            // Rename failed — fall back to creating fresh session
            hotPool.release('prompt', warmSession.id)
          }
        }

        if (!usedWarm) {
          // Fresh tmux session (cold path)
          try {
            execSync(`tmux -f /dev/null new-session -d -s "${tmuxName}" -c "${root}"`, { stdio: 'ignore' })
            execSync(`tmux set-option -t "${tmuxName}" status off`, { stdio: 'ignore' })
            execSync(`tmux set-option -t "${tmuxName}" set-clipboard off 2>/dev/null`, { stdio: 'ignore' })
          } catch { /* session may already exist */ }
        }

        // Set env vars — use send-keys to export into the running shell
        const envMap = {
          STORYBOARD_WIDGET_ID: widgetId,
          STORYBOARD_CANVAS_ID: canvasId,
          STORYBOARD_BRANCH: branch,
          STORYBOARD_SERVER_URL: serverUrl,
        }

        // Write env file for the copilot command to source
        const { join } = await import('node:path')
        const envFile = join(root, '.storyboard', 'terminals', `${tmuxName}.env`)
        const envContent = Object.entries(envMap).map(([k, v]) => `export ${k}=${JSON.stringify(v)}`).join('\n') + '\n'
        fsModule.writeFileSync(envFile, envContent)

        const copilotCmd = buildPromptCmd({ prompt, envFile })
        if (!copilotCmd) {
          const execution = getPromptExecution()
          sendJson(res, 400, { error: `Default agent "${execution?.default || 'unknown'}" has no prompt command configured` })
          return
        }

        // Send the copilot command — warm sessions have a shell ready, no delay needed
        const delay = usedWarm ? 0 : 500
        const displayName = (() => {
          try {
            const canvasFilePath = findCanvasPath(root, canvasId)
            if (!canvasFilePath) return null
            const canvasData = readCanvas(canvasFilePath)
            const w = (canvasData.widgets || []).find(w => w.id === widgetId)
            return w?.props?.prettyName || null
          } catch { return null }
        })()
        const sendCmd = () => {
          try {
            execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(copilotCmd)}`, { stdio: 'ignore' })
            execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
          } catch { /* empty */ }
          // Inject identity after the agent command starts
          setTimeout(() => {
            const configFile = `.storyboard/terminals/${widgetId}.json`
            const msg = `[System] Your terminal identity has been set. widgetId=${widgetId} displayName=${displayName || widgetId} canvasId=${canvasId} configFile=${configFile} serverUrl=${serverUrl} — this is a configuration step, no response needed.`
            try {
              execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
              execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
            } catch { /* empty */ }
          }, 3000)
        }

        if (delay > 0) {
          setTimeout(sendCmd, delay)
        } else {
          sendCmd()
        }

        // Idle timeout (5 min)
        setTimeout(async () => {
          try {
            const { readTerminalConfig } = await import('./terminal-config.js')
            const cfg = readTerminalConfig({ branch, canvasId, widgetId })
            if (cfg?.agentStatus?.status === 'running') {
              updateAgentStatus({ branch, canvasId, widgetId, status: 'error', message: 'Prompt timed out (5 min)' })
              if (__viteWs) {
                __viteWs.send({
                  type: 'custom',
                  event: 'storyboard:agent-status',
                  data: { widgetId, canvasId, status: 'error', message: 'Prompt timed out', timestamp: new Date().toISOString() },
                })
              }
            }
          } catch { /* empty */ }
        }, 5 * 60 * 1000)

        sendJson(res, 200, { success: true, tmuxName, status: 'running', warm: usedWarm })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to spawn prompt agent: ${err.message}` })
      }
      return
    }

    // POST /terminal/kill — kill a terminal/prompt tmux session
    if (routePath === '/terminal/kill' && method === 'POST') {
      const { widgetId: targetWidgetId } = body

      if (!targetWidgetId) {
        sendJson(res, 400, { error: 'widgetId is required' })
        return
      }

      try {
        const { findTmuxNameForWidget, killSession } = await import('./terminal-registry.js')
        const { updateAgentStatus, initTerminalConfig } = await import('./terminal-config.js')

        initTerminalConfig(root)

        const tmuxName = findTmuxNameForWidget(targetWidgetId)
        if (!tmuxName) {
          sendJson(res, 404, { error: `No active session for widget ${targetWidgetId}` })
          return
        }

        // Close any WS connections for this session
        const { orphanTerminalSession } = await import('./terminal-server.js')
        orphanTerminalSession(targetWidgetId)

        // Kill the tmux session and clean up registry
        killSession(tmuxName)

        // Update agent status
        const pathParts = req.url.split('/')
        const _canvasIdx = pathParts.indexOf('canvas')
        void _canvasIdx
        let branch = 'unknown'
        try {
          const { execSync } = await import('node:child_process')
          branch = execSync('git branch --show-current', { encoding: 'utf8', cwd: root }).trim()
        } catch { /* empty */ }

        try {
          updateAgentStatus({ branch, canvasId: 'unknown', widgetId: targetWidgetId, status: 'cancelled', message: 'Cancelled by user' })
        } catch { /* empty */ }

        // Notify via HMR
        if (__viteWs) {
          __viteWs.send({
            type: 'custom',
            event: 'storyboard:agent-status',
            data: { widgetId: targetWidgetId, status: 'cancelled', message: 'Cancelled by user', timestamp: new Date().toISOString() },
          })
        }

        sendJson(res, 200, { success: true, killed: tmuxName })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to kill session: ${err.message}` })
      }
      return
    }

    // GET /terminal-buffer/:widgetId — read terminal buffer JSON
    // Accepts optional ?length=N query param to truncate scrollback
    if (routePath.startsWith('/terminal-buffer/') && method === 'GET') {
      const widgetId = routePath.slice('/terminal-buffer/'.length).split('?')[0]
      if (!widgetId || widgetId.includes('..') || widgetId.includes('/')) {
        sendJson(res, 400, { error: 'Invalid widgetId' })
        return
      }

      const urlObj = new URL(req.url, 'http://localhost')
      const lengthParam = urlObj.searchParams.get('length')
      const maxLength = lengthParam ? parseInt(lengthParam, 10) : undefined

      try {
        const { readTerminalBuffer } = await import('./terminal-server.js')
        const buffer = readTerminalBuffer(widgetId, { maxLength: maxLength || undefined })
        if (buffer) {
          sendJson(res, 200, buffer)
          return
        }
        sendJson(res, 404, { error: 'Buffer not found' })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read buffer: ${err.message}` })
      }
      return
    }

    // GET /terminal-snapshot/:widgetId — read terminal snapshot JSON (new + legacy fallback)
    if (routePath.startsWith('/terminal-snapshot/') && method === 'GET') {
      const widgetId = routePath.slice('/terminal-snapshot/'.length)
      if (!widgetId || widgetId.includes('..') || widgetId.includes('/')) {
        sendJson(res, 400, { error: 'Invalid widgetId' })
        return
      }

      try {
        const { readTerminalSnapshot } = await import('./terminal-server.js')

        // Try new path first
        const snapshot = readTerminalSnapshot(widgetId)
        if (snapshot) {
          sendJson(res, 200, snapshot)
          return
        }

        // Legacy fallback: .storyboard/terminal-snapshots/<canvasDir>/<widgetId>.json
        const snapshotsRoot = path.join(root, '.storyboard', 'terminal-snapshots')
        if (fs.existsSync(snapshotsRoot)) {
          const dirs = fs.readdirSync(snapshotsRoot, { withFileTypes: true })
          for (const d of dirs) {
            if (!d.isDirectory()) continue
            const filePath = path.join(snapshotsRoot, d.name, `${widgetId}.json`)
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, 'utf8')
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(data)
              return
            }
          }
        }
        sendJson(res, 404, { error: 'Snapshot not found' })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to read snapshot: ${err.message}` })
      }
      return
    }

    // DELETE /delete-canvas — delete a canvas and its directory
    if (routePath === '/delete-canvas' && method === 'DELETE') {
      const { name } = body
      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        const dir = path.dirname(filePath)
        const canvasDir = path.join(root, 'src', 'canvas')

        // Delete the canvas file
        fs.unlinkSync(filePath)

        // If the parent directory is inside src/canvas/ and now empty (or only has .meta.json), remove it
        if (dir !== canvasDir) {
          const remaining = fs.readdirSync(dir).filter(f => !f.endsWith('.meta.json'))
          if (remaining.length === 0) {
            for (const f of fs.readdirSync(dir)) {
              fs.unlinkSync(path.join(dir, f))
            }
            fs.rmdirSync(dir)
          }
        }

        sendJson(res, 200, { success: true, deleted: name })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to delete canvas: ${err.message}` })
      }
      return
    }

    // PUT /update-meta — update canvas metadata
    if (routePath === '/update-meta' && method === 'PUT') {
      const { name, title, description, author } = body
      if (!name || typeof name !== 'string') {
        sendJson(res, 400, { error: 'Canvas name is required' })
        return
      }

      const filePath = findCanvasPath(root, name)
      if (!filePath) {
        sendJson(res, 404, { error: `Canvas "${name}" not found` })
        return
      }

      try {
        // Try to find and update .meta.json first
        const dir = path.dirname(filePath)
        const dirName = path.basename(dir).replace(/\.folder$/, '')
        const metaPath = path.join(dir, `${dirName}.meta.json`)

        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
          if (title !== undefined) meta.title = title
          if (description !== undefined) meta.description = description
          if (author !== undefined) meta.author = author
          fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8')
        } else {
          // Update the canvas JSONL's canvas_created event metadata
          const text = fs.readFileSync(filePath, 'utf-8')
          const lines = text.split('\n').filter(Boolean)
          if (lines.length > 0) {
            const firstEvent = JSON.parse(lines[0])
            if (title !== undefined) firstEvent.title = title
            if (description !== undefined) firstEvent.description = description
            if (author !== undefined) firstEvent.author = author
            lines[0] = JSON.stringify(firstEvent)
            fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8')
          }
        }

        // Notify via WebSocket
        pushCanvasUpdate(name, filePath, __viteWs)

        sendJson(res, 200, { success: true, updated: name })
      } catch (err) {
        sendJson(res, 500, { error: `Failed to update canvas metadata: ${err.message}` })
      }
      return
    }

    sendJson(res, 404, { error: `Unknown route: ${method} ${routePath}` })
  }
}
