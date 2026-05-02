/**
 * storyboard exit — Stop all running dev servers and the Caddy proxy.
 */

import * as p from '@clack/prompts'
import { list, unregister } from '../worktree/serverRegistry.js'
import { isCaddyRunning, stopCaddy } from './proxy.js'

p.intro('storyboard exit')

// 1. Stop all registered dev servers
const servers = list()
if (servers.length > 0) {
  let stopped = 0
  for (const s of servers) {
    try {
      process.kill(s.pid, 'SIGTERM')
      stopped++
    } catch { /* already dead */ }
    unregister(s.id)
  }
  p.log.success(`Stopped ${stopped} dev server${stopped !== 1 ? 's' : ''}`)
} else {
  p.log.info('No dev servers running')
}

// 2. Stop Caddy proxy via admin API (no sudo needed)
if (isCaddyRunning()) {
  if (stopCaddy()) {
    p.log.success('Proxy stopped')
  } else {
    p.log.warning('Failed to stop proxy via admin API')
  }
} else {
  p.log.info('Proxy was not running')
}

p.outro('All stopped')
