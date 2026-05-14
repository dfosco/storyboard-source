/**
 * Resolve the dev server URL for the current worktree.
 *
 * Simple lookup: prefer the env var (set by terminal/agent sessions),
 * then check the live server registry, finally fall back to the
 * worktree's allocated port.
 */

import { detectWorktreeName, resolveRunningPort } from '../worktree/port.js'
import { findByWorktree } from '../worktree/serverRegistry.js'

export function getServerUrl() {
  if (process.env.STORYBOARD_SERVER_URL) {
    return process.env.STORYBOARD_SERVER_URL.replace(/\/$/, '')
  }

  const name = detectWorktreeName()

  try {
    const servers = findByWorktree(name)
    if (servers.length > 0) return `http://localhost:${servers[0].port}`
  } catch { /* fall through */ }

  const port = resolveRunningPort(name)
  return `http://localhost:${port}`
}
