/**
 * Agent Session — capture & resume per-widget agent CLI sessions.
 *
 * When an agent CLI exposes a session ID via an env var inside its
 * SessionStart hook (e.g. Copilot CLI's `COPILOT_AGENT_SESSION_ID`), we
 * piggyback on the same hook mechanism `hot-pool.js` uses for readiness
 * to capture that ID into a small per-widget file. A watcher then
 * persists it onto the widget's terminal config so the next cold start
 * can launch with `--resume <id>` instead of a fresh session.
 *
 * The resume command is wrapped in `sh -c '<resume> || <fresh>'` so a
 * stale or invalid id (history pruned, machine swap, etc.) silently
 * falls back to a fresh session — same UX as today.
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync, watch as fsWatch } from 'node:fs'
import { join } from 'node:path'

const HOOK_DIR = join('.storyboard', 'agent-sessions')

/** Resolve absolute path to the hook directory under root. */
function hookDir(root) {
  const dir = join(root, HOOK_DIR)
  if (!existsSync(dir)) {
    try { mkdirSync(dir, { recursive: true }) } catch { /* empty */ }
  }
  return dir
}

/** Path to the per-widget capture file written by the SessionStart hook. */
export function captureFilePath(root, widgetKey) {
  return join(hookDir(root), `${widgetKey}.session-id`)
}

/** Path to the per-widget settings.json passed via `--settings`. */
export function settingsFilePath(root, widgetKey) {
  return join(hookDir(root), `${widgetKey}.settings.json`)
}

/**
 * Write a SessionStart-hook settings file that captures the agent's
 * session id from `agentCfg.sessionIdEnv` into a per-widget file.
 *
 * The hook prefers the env var; if absent it parses the JSON payload
 * Copilot/Claude pass on stdin (`{"session_id":"..."}`) so we work in
 * either case.
 *
 * Returns null if no `sessionIdEnv` is configured (capture is opt-in
 * per agent). Returns the absolute path to append as `--settings <path>`.
 *
 * @param {object} args
 * @param {string} args.root        — project root
 * @param {string} args.widgetKey   — stable per-widget hash (same as configKey)
 * @param {object} args.agentCfg    — resolved CanvasAgentConfig
 * @returns {{ settingsFile: string, captureFile: string } | null}
 */
export function writeSessionCaptureSettings({ root, widgetKey, agentCfg }) {
  const envName = agentCfg?.sessionIdEnv
  if (!envName || !widgetKey) return null

  const captureFile = captureFilePath(root, widgetKey)
  const settingsFile = settingsFilePath(root, widgetKey)

  // Best-effort: clear any stale capture from a previous run so the
  // watcher only fires for the new session.
  try { unlinkSync(captureFile) } catch { /* empty */ }

  // Hook: prefer env var, fall back to parsing session_id from stdin JSON.
  // Single-line sh script kept inline to avoid extra files on disk.
  const hookCmd =
    `sh -c 'id="${'$'}{${envName}}"; ` +
    'if [ -z "$id" ]; then ' +
    'id=$(cat | sed -n "s/.*\\"session_id\\"[[:space:]]*:[[:space:]]*\\"\\([^\\"]*\\)\\".*/\\1/p" | head -n1); ' +
    'fi; ' +
    `[ -n "$id" ] && printf %s "$id" > ${JSON.stringify(captureFile)}'`

  const settings = {
    hooks: {
      SessionStart: [{ type: 'command', command: hookCmd }],
    },
  }
  writeFileSync(settingsFile, JSON.stringify(settings))
  return { settingsFile, captureFile }
}

/**
 * Append `--settings <path>` to a startup command in a way that survives
 * the welcome-script's quoting. We add it to the inner agent command
 * (not the welcome wrapper) so the agent process is the one that sees it.
 */
export function withSettingsArg(startupCommand, settingsFile) {
  if (!startupCommand || !settingsFile) return startupCommand
  return `${startupCommand} --settings ${JSON.stringify(settingsFile)}`
}

/**
 * Build a resume-with-fallback startup command.
 *
 * Given the original `startupCommand` (e.g. `copilot --agent terminal-agent`)
 * and a captured `sessionId`, return a shell-wrapped command that tries
 * the resume form first and falls back to the original on non-zero exit:
 *
 *   sh -c 'copilot --resume <id> --agent terminal-agent || copilot --agent terminal-agent'
 *
 * The resume args come from `agentCfg.resumeArgsTemplate` (default
 * `--resume {id}`) and are injected immediately after the binary name so
 * subsequent flags compose naturally.
 *
 * Returns the original command unchanged if no resume args are configured
 * or no session id is provided.
 */
export function buildResumeStartupCommand({ startupCommand, sessionId, agentCfg }) {
  if (!startupCommand || !sessionId) return startupCommand
  const template = agentCfg?.resumeArgsTemplate || '--resume {id}'
  const resumeArgs = template.replace('{id}', sessionId)

  // Insert resume args after the first token (the binary).
  const trimmed = startupCommand.trimStart()
  const firstSpace = trimmed.indexOf(' ')
  const bin = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
  const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace)
  const resumeCmd = `${bin} ${resumeArgs}${rest}`

  // sh -c wrapper: if resume fails (unknown/stale id), fall through to
  // the original fresh command. Single-quote the inner script and
  // escape any single quotes inside.
  const inner = `${resumeCmd} || ${startupCommand}`
  return `sh -c ${shellQuote(inner)}`
}

/**
 * Build the SessionStart hook command that captures the agent's session
 * id from `sessionIdEnv` (or the JSON `session_id` field on stdin) into
 * `captureFile`. Returns a string suitable for `{ type: 'command', command }`.
 */
export function buildSessionCaptureHookCommand(captureFile, sessionIdEnv) {
  return (
    `sh -c 'id="${'$'}{${sessionIdEnv}}"; ` +
    'if [ -z "$id" ]; then ' +
    'id=$(cat | sed -n "s/.*\\"session_id\\"[[:space:]]*:[[:space:]]*\\"\\([^\\"]*\\)\\".*/\\1/p" | head -n1); ' +
    'fi; ' +
    `[ -n "$id" ] && printf %s "$id" > ${JSON.stringify(captureFile)}'`
  )
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

/** Quote a string for sh -c safely. */
function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`
}

/**
 * Watch `captureFile` for the agent's session id and call `onCapture(id)`
 * once it appears. The file is written once by the SessionStart hook and
 * never modified after, so we stop watching as soon as we read a non-empty
 * value.
 *
 * Uses `fs.watch` with a polling fallback for environments where watch
 * events don't fire (some editors, rapid sequences). Times out silently
 * after `timeoutMs`.
 *
 * Returns a `stop()` function the caller can invoke to cancel.
 */
export function watchSessionIdFile(captureFile, onCapture, { timeoutMs = 10 * 60 * 1000, pollMs = 1500 } = {}) {
  let stopped = false
  let watcher = null
  let pollTimer = null
  let timeoutTimer = null

  const tryRead = () => {
    if (stopped) return false
    try {
      if (!existsSync(captureFile)) return false
      const id = readFileSync(captureFile, 'utf8').trim()
      if (!id) return false
      stop()
      try { onCapture(id) } catch { /* empty */ }
      return true
    } catch { return false }
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    if (watcher) { try { watcher.close() } catch { /* empty */ } }
    if (pollTimer) clearInterval(pollTimer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
  }

  // Try once immediately in case it's already been written
  if (tryRead()) return stop

  try {
    const dir = join(captureFile, '..')
    watcher = fsWatch(dir, () => tryRead())
  } catch { /* fall through to polling */ }

  pollTimer = setInterval(tryRead, pollMs)
  timeoutTimer = setTimeout(stop, timeoutMs)
  return stop
}
