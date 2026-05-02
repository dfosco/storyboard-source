/**
 * tmux helpers for integration tests.
 *
 * Every operation is timed via perf.js and recorded via transcript.js.
 */

import { execSync } from 'node:child_process'
import * as perf from './perf.js'
import * as transcript from './transcript.js'

/** List all tmux sessions. Returns array of session name strings. */
export function listSessions() {
  try {
    const out = execSync('tmux list-sessions -F "#{session_name}"', { encoding: 'utf8', timeout: 5000 })
    return out.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

/** Check if a tmux session exists. */
export function hasSession(name) {
  try {
    execSync(`tmux has-session -t "${name}" 2>/dev/null`, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/** Capture the full pane content of a tmux session. */
export function capturePane(sessionName) {
  const timer = perf.start('tmux.capture', { session: sessionName })
  try {
    const out = execSync(`tmux capture-pane -t "${sessionName}" -p`, { encoding: 'utf8', timeout: 10000 })
    timer.end()
    transcript.logStdout(sessionName, out)
    return out
  } catch (err) {
    timer.end({ error: err.message })
    return ''
  }
}

/** Send keystrokes to a tmux session. */
export function sendKeys(sessionName, keys) {
  transcript.logStdin(sessionName, keys)
  try {
    execSync(`tmux send-keys -t "${sessionName}" ${keys}`, { timeout: 5000 })
  } catch (err) {
    transcript.logEvent(sessionName, `sendKeys error: ${err.message}`)
    throw err
  }
}

/** Send literal text (properly escaped) to a tmux session. */
export function sendText(sessionName, text) {
  transcript.logStdin(sessionName, text)
  try {
    // Use -- to prevent tmux from interpreting flags in the text
    execSync(`tmux send-keys -t "${sessionName}" -l -- ${JSON.stringify(text)}`, { timeout: 5000 })
  } catch (err) {
    transcript.logEvent(sessionName, `sendText error: ${err.message}`)
    throw err
  }
}

/**
 * Poll capturePane until the output matches a pattern, or timeout.
 * Returns the matched output on success, throws on timeout.
 */
export async function waitForOutput(sessionName, pattern, timeoutMs = 30000, intervalMs = 1000) {
  const timer = perf.start('tmux.waitForOutput', { session: sessionName, pattern: String(pattern) })
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const output = capturePane(sessionName)
    if (regex.test(output)) {
      timer.end({ matched: true })
      return output
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  // Final attempt
  const output = capturePane(sessionName)
  if (regex.test(output)) {
    timer.end({ matched: true })
    return output
  }

  timer.end({ matched: false, timedOut: true })
  const err = new Error(`[tmux] waitForOutput timed out after ${timeoutMs}ms waiting for ${pattern}\nLast capture:\n${output}`)
  err.lastCapture = output
  throw err
}

/**
 * Wait for a tmux session to appear. Polls tmux list-sessions.
 * Returns the matching session name, or throws on timeout.
 */
export async function waitForSession(namePattern, timeoutMs = 15000, intervalMs = 500) {
  const timer = perf.start('tmux.session.start')
  const regex = typeof namePattern === 'string' ? new RegExp(namePattern) : namePattern
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const sessions = listSessions()
    const match = sessions.find((s) => regex.test(s))
    if (match) {
      timer.end({ session: match })
      return match
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }

  timer.end({ timedOut: true })
  throw new Error(`[tmux] No session matching ${namePattern} appeared within ${timeoutMs}ms`)
}

/** Kill a tmux session. */
export function killSession(name) {
  try {
    execSync(`tmux kill-session -t "${name}" 2>/dev/null`, { timeout: 5000 })
    transcript.logEvent(name, 'Session killed')
  } catch {
    // Session may already be dead
  }
}
