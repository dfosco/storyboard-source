/**
 * Agent Session — capture & resume per-widget agent CLI sessions.
 *
 * Copilot CLI doesn't accept a `--settings` arg the way Claude Code does —
 * its hooks are loaded from `~/.copilot/hooks/*.json` (and `.github/hooks/`
 * + a few other locations). We install a single user-level hook file once
 * that runs on `sessionStart` for every copilot invocation; the hook reads
 * `STORYBOARD_WIDGET_ID` from its env (we already export it into the agent
 * shell) and the JSON payload from stdin, then writes the captured
 * `sessionId` to a per-widget capture file under the widget's project root.
 *
 * A watcher on the per-widget capture file persists the captured id onto
 * the widget's terminal config as `lastAgentSessionId`. On the next cold
 * restart, the launch is rewritten to `copilot --resume=<id> --agent ...`,
 * with a pre-flight check that the session-state directory still exists
 * (copilot exits non-interactively when `--resume=<id>` doesn't match an
 * existing session, so we can't rely on `||` shell fallback — we have to
 * pre-validate).
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync, watch as fsWatch } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const CAPTURE_DIR = join('.storyboard', 'agent-sessions')
const COPILOT_USER_HOOKS_DIR = join(homedir(), '.copilot', 'hooks')
const COPILOT_HOOK_FILENAME = 'storyboard-capture.json'
const COPILOT_SESSION_STATE_DIR = join(homedir(), '.copilot', 'session-state')

/** Resolve absolute path to the per-widget capture directory under root. */
function captureDir(root) {
  const dir = join(root, CAPTURE_DIR)
  if (!existsSync(dir)) {
    try { mkdirSync(dir, { recursive: true }) } catch { /* empty */ }
  }
  return dir
}

/** Path to the per-widget capture file written by the user-level hook. */
export function captureFilePath(root, widgetKey) {
  return join(captureDir(root), `${widgetKey}.session-id`)
}

/**
 * Install (idempotently) a user-level Copilot CLI hook that captures the
 * session id of every storyboard-managed widget into a per-widget file.
 *
 * The hook fires on `sessionStart` (both new + resume), reads:
 *   - `STORYBOARD_WIDGET_ID` from env (exported by terminal-server)
 *   - `STORYBOARD_PROJECT_ROOT` from env (we export this too — see below)
 *   - `sessionId` from the hook's JSON stdin payload
 * and writes the sessionId to
 *   `$STORYBOARD_PROJECT_ROOT/.storyboard/agent-sessions/$STORYBOARD_WIDGET_ID.session-id`.
 *
 * If either env var is missing (e.g. user runs copilot outside storyboard),
 * the hook silently no-ops.
 *
 * Safe to call on every dev-server boot.
 */
export function ensureCopilotCaptureHookInstalled() {
  try { mkdirSync(COPILOT_USER_HOOKS_DIR, { recursive: true }) } catch { /* empty */ }

  const hookPath = join(COPILOT_USER_HOOKS_DIR, COPILOT_HOOK_FILENAME)

  // Single-line bash script. Reads stdin JSON, extracts sessionId via sed
  // (no jq dependency), writes it to the widget's per-project capture file.
  const bashScript =
    'wid="${STORYBOARD_WIDGET_ID}"; ' +
    'root="${STORYBOARD_PROJECT_ROOT}"; ' +
    '[ -z "$wid" ] && exit 0; ' +
    '[ -z "$root" ] && exit 0; ' +
    'id=$(cat | sed -n \'s/.*"sessionId"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p\' | head -n1); ' +
    '[ -z "$id" ] && exit 0; ' +
    'dir="$root/.storyboard/agent-sessions"; ' +
    'mkdir -p "$dir" 2>/dev/null; ' +
    'printf %s "$id" > "$dir/$wid.session-id"'

  const hook = {
    version: 1,
    hooks: {
      sessionStart: [
        { type: 'command', bash: bashScript, timeoutSec: 5 },
      ],
    },
  }

  // Only rewrite if content changed, to avoid unnecessary fs churn.
  let existing = null
  try { existing = readFileSync(hookPath, 'utf8') } catch { /* missing */ }
  const next = JSON.stringify(hook, null, 2) + '\n'
  if (existing !== next) {
    try { writeFileSync(hookPath, next) } catch { /* best-effort */ }
  }
  return hookPath
}

/**
 * Build a resume-aware startup command for an agent.
 *
 * Pre-validates that a captured `sessionId` looks like a UUID AND that the
 * session-state directory still exists for it under `~/.copilot/session-state/`.
 * If validation fails, returns the original `startupCommand` unchanged so
 * the agent launches a fresh session — same UX as today.
 *
 * Otherwise returns `agentCfg.resumeCommand` with `{id}` substituted. The
 * resume command is the FULL command to run (including the binary, the
 * --agent flag, and any other startup args), not just the resume flag —
 * keeping it in one field avoids confusion about which args go where.
 */
export function buildResumeStartupCommand({ startupCommand, sessionId, agentCfg }) {
  if (!startupCommand || !sessionId) return startupCommand
  if (!isResumableSessionId(sessionId, agentCfg)) return startupCommand

  const template = agentCfg?.resumeCommand
  if (!template || !template.includes('{id}')) return startupCommand

  return template.replace('{id}', sessionId)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Decide whether a captured sessionId is still resumable. For copilot, this
 * means the id is a UUID and `~/.copilot/session-state/<id>/` still exists.
 * Other agents can opt out of validation by setting `sessionStateDir` to null.
 */
export function isResumableSessionId(sessionId, agentCfg = {}) {
  if (!sessionId) return false
  if (!UUID_RE.test(sessionId)) return false
  const stateDir = agentCfg.sessionStateDir === undefined
    ? COPILOT_SESSION_STATE_DIR
    : agentCfg.sessionStateDir
  if (!stateDir) return true // explicit opt-out of fs validation
  return existsSync(join(stateDir, sessionId))
}

/**
 * Watch `captureFile` for the agent's session id and call `onCapture(id)`
 * once it appears or is updated. Unlike the previous one-shot version,
 * this keeps watching so subsequent sessions on the same widget (e.g.
 * after `/new` inside the agent) overwrite the captured id.
 *
 * Returns a `stop()` function the caller can invoke to cancel.
 */
export function watchSessionIdFile(captureFile, onCapture, { pollMs = 1500 } = {}) {
  let stopped = false
  let watcher = null
  let pollTimer = null
  let lastSeen = null

  const tryRead = () => {
    if (stopped) return
    try {
      if (!existsSync(captureFile)) return
      const id = readFileSync(captureFile, 'utf8').trim()
      if (!id || id === lastSeen) return
      lastSeen = id
      try { onCapture(id) } catch { /* empty */ }
    } catch { /* empty */ }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (watcher) { try { watcher.close() } catch { /* empty */ } }
    if (pollTimer) clearInterval(pollTimer)
  }

  // Try once immediately
  tryRead()

  try {
    const dir = join(captureFile, '..')
    watcher = fsWatch(dir, () => tryRead())
  } catch { /* fall through to polling */ }

  pollTimer = setInterval(tryRead, pollMs)
  return stop
}

/**
 * Read a previously-captured session id from a capture file. Returns null
 * if the file is missing or empty.
 */
export function readCapturedSessionId(captureFile) {
  try {
    if (!existsSync(captureFile)) return null
    const id = readFileSync(captureFile, 'utf8').trim()
    return id || null
  } catch { return null }
}

/**
 * Remove a capture file (e.g. after a widget is deleted). Best-effort.
 */
export function clearCaptureFile(captureFile) {
  try { unlinkSync(captureFile) } catch { /* empty */ }
}
