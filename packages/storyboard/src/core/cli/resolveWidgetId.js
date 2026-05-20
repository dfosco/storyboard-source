/**
 * resolveWidgetId — robust widget-id resolution for CLI commands invoked
 * from inside a tmux pane (typically a terminal-agent shell tool).
 *
 * Resolution order:
 *   1. Explicit argument (e.g. --widget / --sender flag)
 *   2. $STORYBOARD_WIDGET_ID_OVERRIDE (manual escape hatch)
 *   3. $STORYBOARD_WIDGET_ID — but only if it doesn't look like a hot-pool
 *      session id (e.g. "pool-copilot-1779236104099-t0pg"). Pool ids leak
 *      into the agent's env when a TUI is handed off from the hot pool;
 *      the running process's env stays pinned to the pool id even after
 *      the warm-handoff env.sh is written, so child shells (like the
 *      ones spawned by Copilot/Claude/Codex bash tools) inherit the
 *      stale id.
 *   4. Look up the current tmux session in
 *      .storyboard/terminal-sessions.json and return its bound widgetId.
 *   5. Fall back to whatever $STORYBOARD_WIDGET_ID held (even if pool-*),
 *      so behavior never gets worse than before.
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const POOL_ID_RE = /^pool-/

function looksLikePoolId(value) {
  return typeof value === 'string' && POOL_ID_RE.test(value)
}

function getCurrentTmuxSessionName() {
  if (!process.env.TMUX) return null
  try {
    const out = execSync(`tmux display-message -p '#{session_name}'`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 500,
    }).trim()
    return out || null
  } catch {
    return null
  }
}

function findWidgetIdByTmuxName(projectRoot, tmuxName) {
  if (!projectRoot || !tmuxName) return null
  const registryPath = join(projectRoot, '.storyboard', 'terminal-sessions.json')
  if (!existsSync(registryPath)) return null
  try {
    const raw = readFileSync(registryPath, 'utf8')
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed) ? parsed : []
    const match = arr.find((s) => s && s.tmuxName === tmuxName)
    return match?.widgetId || null
  } catch {
    return null
  }
}

/**
 * @param {string|null|undefined} explicit  — explicit override (e.g. CLI flag)
 * @returns {string|null}
 */
export function resolveWidgetId(explicit) {
  if (explicit) return explicit

  const override = process.env.STORYBOARD_WIDGET_ID_OVERRIDE
  if (override) return override

  const envId = process.env.STORYBOARD_WIDGET_ID || null
  if (envId && !looksLikePoolId(envId)) return envId

  const tmuxName = getCurrentTmuxSessionName()
  const projectRoot = process.env.STORYBOARD_PROJECT_ROOT || process.cwd()
  const mapped = findWidgetIdByTmuxName(projectRoot, tmuxName)
  if (mapped) return mapped

  return envId
}
