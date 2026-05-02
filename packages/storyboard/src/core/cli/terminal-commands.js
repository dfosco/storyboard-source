#!/usr/bin/env node
/**
 * storyboard terminal {close|open|remove} --id <name-or-id>
 *
 * Subcommands for managing terminal sessions by friendly name, tmux name, or widget ID.
 */

import * as p from '@clack/prompts'
import { execSync } from 'node:child_process'
import { detectWorktreeName, resolveRunningPort } from '../worktree/port.js'
import { readDevDomain } from './proxy.js'
import { parseFlags } from './flags.js'
import { dim, cyan, bold, yellow } from './intro.js'

const flagSchema = {
  id: { type: 'string', required: true, description: 'Session name, tmux name, or widget ID' },
}

const subcommand = process.argv[3]
const { flags, missing, errors } = parseFlags(process.argv.slice(4), flagSchema)

/** Resolve the dev server base URL (proxy or direct) */
function getBaseUrl(worktreeName, port) {
  const domain = readDevDomain()
  const isMain = worktreeName === 'main'
  const proxyBase = isMain ? `http://${domain}/` : `http://${domain}/branch--${worktreeName}/`
  const directBase = isMain ? `http://localhost:${port}/` : `http://localhost:${port}/branch--${worktreeName}/`
  return { proxyBase, directBase }
}

/** Fetch all sessions from the dev server */
async function fetchSessions(worktreeName, port) {
  const { proxyBase, directBase } = getBaseUrl(worktreeName, port)
  for (const base of [proxyBase, directBase]) {
    try {
      const res = await fetch(`${base}_storyboard/terminal/sessions`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) continue
      const data = await res.json()
      return { sessions: data.sessions || [], base }
    } catch { continue }
  }
  return null
}

/** POST/DELETE helper that tries proxy then direct */
async function apiRequest(worktreeName, port, path, method = 'POST', body = null) {
  const { proxyBase, directBase } = getBaseUrl(worktreeName, port)
  for (const base of [proxyBase, directBase]) {
    try {
      const opts = { method, signal: AbortSignal.timeout(5000) }
      if (body) {
        opts.headers = { 'Content-Type': 'application/json' }
        opts.body = JSON.stringify(body)
      }
      const res = await fetch(`${base}${path}`, opts)
      if (res.ok) return { ok: true, data: await res.json().catch(() => ({})) }
    } catch { continue }
  }
  return { ok: false }
}

/**
 * Resolve --id to a session entry. Tries:
 * 1. Friendly name match (e.g. "red-robin")
 * 2. Exact tmux name match (e.g. "sb-abc123def456")
 * 3. Widget ID match (e.g. "terminal-abc123")
 */
function resolveSession(sessions, id) {
  // Friendly name
  const byName = sessions.find(s => s.name === id)
  if (byName) return byName
  // Tmux name
  const byTmux = sessions.find(s => s.tmuxName === id)
  if (byTmux) return byTmux
  // Widget ID
  const byWidget = sessions.find(s => s.widgetId === id)
  if (byWidget) return byWidget
  return null
}

/** Detect the current tmux session name (only if it's a storyboard session) */
function getCurrentTmuxSession() {
  try {
    const name = execSync('tmux display-message -p "#{session_name}" 2>/dev/null', {
      encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    // Only return if this is a storyboard terminal session
    return name.startsWith('sb-') ? name : null
  } catch {
    return null
  }
}

/** Check if we're inside ANY tmux (storyboard or user's own) */
function _isInsideTmux() {
  return Boolean(process.env.TMUX)
}
void _isInsideTmux

// ── Close (archive) ──

async function closeSession(session, worktreeName, port) {
  p.intro(bold('Close session'))

  const label = session.name || session.tmuxName

  if (session.status === 'live') {
    p.log.info(`Session ${cyan(label)} is live — detaching first...`)
    const detachResult = await apiRequest(
      worktreeName, port,
      `_storyboard/terminal/sessions/${encodeURIComponent(session.tmuxName)}/detach`,
    )
    if (!detachResult.ok) {
      p.log.warn('Could not detach via API, continuing with archive...')
    }
  }

  // Orphan the session (archive with grace timer)
  const orphanResult = await apiRequest(
    worktreeName, port,
    `_storyboard/terminal/sessions/${encodeURIComponent(session.tmuxName)}/orphan`,
  )

  if (orphanResult.ok) {
    p.log.success(`Session ${cyan(label)} archived. Tmux session kept alive with grace timer.`)
  } else {
    p.log.error(`Failed to archive session ${cyan(label)}`)
    process.exit(1)
  }

  p.outro('')
}

// ── Open (attach) ──

async function openSession(session, _worktreeName, _port) {
  void _worktreeName
  void _port
  p.intro(bold('Open session'))

  const label = session.name || session.tmuxName
  const currentSb = getCurrentTmuxSession()

  if (session.status === 'live' && session.tmuxName !== currentSb) {
    p.log.warn(
      `Session ${cyan(label)} is currently live on widget ${dim(session.widgetId)} ` +
      `in canvas ${cyan(session.canvasId)}.`
    )
    const confirm = await p.confirm({
      message: 'Attach anyway? This may cause conflicts with the live widget.',
    })
    if (p.isCancel(confirm) || !confirm) {
      p.outro(dim('Cancelled'))
      process.exit(0)
    }
  }

  // If we're inside a storyboard tmux session, use switch-client.
  // Otherwise always use attach-session (even if user has their own tmux).
  if (currentSb) {
    p.outro(`Switching to ${bold(label)}...`)
    try {
      execSync(`tmux switch-client -t "${session.tmuxName}"`, { stdio: 'inherit' })
    } catch {
      p.log.error('Failed to switch tmux client')
      process.exit(1)
    }
  } else {
    p.outro(`Attaching to ${bold(label)}...`)
    try {
      execSync(`tmux attach-session -t "${session.tmuxName}"`, { stdio: 'inherit' })
    } catch {
      p.log.error('Failed to attach to tmux session')
      process.exit(1)
    }
  }
}

// ── Remove (destroy) ──

async function removeSession(session, worktreeName, port) {
  p.intro(bold('Remove session'))

  const label = session.name || session.tmuxName

  const widgetNote = session.widgetId && session.widgetId !== 'unknown'
    ? `\n  This will also ${yellow('remove the terminal widget')} from canvas ${cyan(session.canvasId)}.`
    : ''

  const confirm = await p.confirm({
    message: `Permanently destroy session ${bold(label)}?${widgetNote}\n  The tmux session and all running processes inside it will be lost.`,
  })

  if (p.isCancel(confirm) || !confirm) {
    p.outro(dim('Cancelled'))
    process.exit(0)
  }

  // Kill via API
  const killResult = await apiRequest(
    worktreeName, port,
    `_storyboard/terminal/sessions/${encodeURIComponent(session.tmuxName)}`,
    'DELETE',
  )

  if (killResult.ok) {
    p.log.success(`Session ${cyan(label)} destroyed`)
  } else {
    p.log.warn('API call failed, killing tmux session directly...')
    try {
      execSync(`tmux kill-session -t "${session.tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
      p.log.success(`Session ${cyan(label)} killed via tmux`)
    } catch {
      p.log.error('Failed to kill session')
      process.exit(1)
    }
  }

  // Remove widget from canvas
  if (session.widgetId && session.widgetId !== 'unknown' && session.canvasId && session.canvasId !== 'unknown') {
    const removeResult = await apiRequest(
      worktreeName, port,
      '_storyboard/canvas/widget',
      'DELETE',
      { name: session.canvasId, widgetId: session.widgetId },
    )
    if (removeResult.ok) {
      p.log.success(`Widget ${dim(session.widgetId)} removed from canvas ${cyan(session.canvasId)}`)
    }
  }

  p.outro('')
}

// ── Main ──

async function main() {
  if (missing.length > 0 || errors.length > 0) {
    p.intro(bold('Terminal'))
    if (errors.length) errors.forEach(e => p.log.error(e))
    if (missing.length) p.log.error(`Missing required flag: ${bold('--id')}`)
    p.log.info(`Usage: ${cyan(`storyboard terminal ${subcommand} --id <name-or-id>`)}`)
    p.outro('')
    process.exit(1)
  }

  const worktreeName = detectWorktreeName()
  const port = resolveRunningPort(worktreeName)
  const result = await fetchSessions(worktreeName, port)

  if (!result) {
    p.intro(bold('Terminal'))
    p.log.error('Could not connect to dev server. Is it running?')
    p.outro('')
    process.exit(1)
  }

  const session = resolveSession(result.sessions, flags.id)
  if (!session) {
    p.intro(bold('Terminal'))
    p.log.error(`No session found matching ${bold(flags.id)}`)
    p.log.info(`Try ${cyan('storyboard terminal')} to browse sessions.`)
    p.outro('')
    process.exit(1)
  }

  switch (subcommand) {
    case 'close':
    case 'archive':
      await closeSession(session, worktreeName, port)
      break
    case 'open':
      await openSession(session, worktreeName, port)
      break
    case 'remove':
      await removeSession(session, worktreeName, port)
      break
    default:
      p.log.error(`Unknown subcommand: ${subcommand}`)
      process.exit(1)
  }
}

main().catch((err) => {
  p.log.error(err.message)
  process.exit(1)
})
