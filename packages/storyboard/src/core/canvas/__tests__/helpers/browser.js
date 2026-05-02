/**
 * agent-browser helpers for integration tests.
 *
 * Wraps the agent-browser CLI for headless browser interaction.
 * Each agent chain should use its own session name.
 */

import { execSync } from 'node:child_process'
import * as perf from './perf.js'

const DEFAULT_TIMEOUT = 30000

function run(args, timeout = DEFAULT_TIMEOUT) {
  try {
    return execSync(`agent-browser ${args}`, { encoding: 'utf8', timeout })
  } catch (err) {
    const msg = err.stderr || err.stdout || err.message
    throw new Error(`[agent-browser] ${args} failed: ${msg}`)
  }
}

/** Open a URL in a browser session. */
export function open(sessionName, url) {
  const timer = perf.start('browser.open', { session: sessionName, url })
  const out = run(`--session ${sessionName} open "${url}"`)
  timer.end()
  return out
}

/** Take an accessibility snapshot. */
export function snapshot(sessionName, options = '') {
  const timer = perf.start('browser.snapshot', { session: sessionName })
  const out = run(`--session ${sessionName} snapshot ${options}`)
  timer.end()
  return out
}

/** Take a screenshot. */
export function screenshot(sessionName, path, options = '') {
  const timer = perf.start('browser.screenshot', { session: sessionName })
  const out = run(`--session ${sessionName} screenshot ${options} ${path}`)
  timer.end()
  return out
}

/** Check if an element is visible. */
export function isVisible(sessionName, selector) {
  try {
    const out = run(`--session ${sessionName} is visible "${selector}"`)
    return out.toLowerCase().includes('true') || out.toLowerCase().includes('visible')
  } catch {
    return false
  }
}

/** Get text content of an element. */
export function getText(sessionName, selectorOrRef) {
  return run(`--session ${sessionName} get text "${selectorOrRef}"`)
}

/** Click an element. */
export function click(sessionName, selectorOrRef) {
  return run(`--session ${sessionName} click "${selectorOrRef}"`)
}

/** Fill an input with text. */
export function fill(sessionName, selectorOrRef, text) {
  return run(`--session ${sessionName} fill "${selectorOrRef}" "${text}"`)
}

/** Wait for a specific condition. */
export function waitForLoad(sessionName, condition = 'networkidle') {
  const timer = perf.start('browser.wait', { session: sessionName, condition })
  const out = run(`--session ${sessionName} wait --load ${condition}`, 60000)
  timer.end()
  return out
}

/** Close a browser session. */
export function close(sessionName) {
  try {
    run(`--session ${sessionName} close`)
  } catch {
    // Session may already be closed
  }
}

/** Close all browser sessions. */
export function closeAll() {
  try {
    run('close --all')
  } catch {
    // Nothing to close
  }
}
