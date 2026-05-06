/**
 * storyboard run — Start proxy + dev server in one command.
 *
 * Combines `storyboard proxy start` and `storyboard dev` into a single command.
 * Useful for fresh starts when neither proxy nor dev server is running.
 *
 * Usage:
 *   storyboard run             # start proxy + dev for current worktree
 *   storyboard run <branch>    # start proxy + dev for a specific branch
 */

import * as p from '@clack/prompts'
import { generateCaddyfile, isCaddyInstalled, isCaddyRunning, startCaddy } from './proxy.js'

p.intro('storyboard run')

// 1. Ensure proxy is running
if (isCaddyInstalled()) {
  const caddyfilePath = generateCaddyfile()
  
  if (isCaddyRunning()) {
    p.log.success('Proxy already running')
  } else {
    const spin = p.spinner()
    spin.start('Starting proxy...')
    try {
      startCaddy(caddyfilePath)
      spin.stop('Proxy started')
    } catch (err) {
      spin.stop('Proxy failed to start')
      p.log.warning(`Continuing without proxy: ${err.message}`)
    }
  }
} else {
  p.log.warning('Caddy not installed — run `npx storyboard setup` first')
  p.log.info('Continuing without proxy (will use direct port URLs)')
}

// 2. Hand off to dev.js (passes through all args)
p.log.step('Starting dev server...')
await import('./dev.js')
