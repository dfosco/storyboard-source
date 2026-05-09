import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync, openSync, closeSync } from 'node:fs'
import { dirname } from 'node:path'
import { LOCKFILE, PIDFILE, RUNTIME_HOME } from './constants.js'

/**
 * Lockfile-based singleton enforcement.
 *
 * On daemon start we attempt an exclusive create of `~/.storyboard/runtime.lock`.
 * Two daemons can never coexist — without this guarantee the runtime's whole
 * raison d'être (single source of truth for proxy + devservers) collapses.
 *
 * If the lockfile exists but its PID is dead, we treat it as stale and reclaim
 * it. This handles crashes / `kill -9` cleanly without operator intervention.
 */

export class RuntimeAlreadyRunningError extends Error {
  constructor(public readonly pid: number) {
    super(`Storyboard Runtime is already running (pid ${pid})`)
    this.name = 'RuntimeAlreadyRunningError'
  }
}

function ensureRuntimeHome(): void {
  if (!existsSync(RUNTIME_HOME)) mkdirSync(RUNTIME_HOME, { recursive: true })
}

/** Returns true if the OS reports a process with `pid` is alive. */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * Acquire the runtime lock. Throws RuntimeAlreadyRunningError if another
 * live daemon holds it. On success, writes `process.pid` to the pidfile and
 * returns a release function the caller MUST invoke on shutdown.
 */
export function acquireRuntimeLock(): () => void {
  ensureRuntimeHome()

  if (existsSync(LOCKFILE)) {
    const raw = readFileSync(LOCKFILE, 'utf8').trim()
    const pid = Number(raw)
    if (Number.isFinite(pid) && pid > 0 && isProcessAlive(pid)) {
      throw new RuntimeAlreadyRunningError(pid)
    }
    // Stale lock — the previous daemon crashed. Reclaim it.
    try { unlinkSync(LOCKFILE) } catch { /* race: another claimant */ }
  }

  // O_EXCL — atomic create-or-fail. Wins over racing daemons.
  let fd: number
  try {
    fd = openSync(LOCKFILE, 'wx')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      // Another daemon raced us to the lock.
      const raw = readFileSync(LOCKFILE, 'utf8').trim()
      const pid = Number(raw) || 0
      throw new RuntimeAlreadyRunningError(pid)
    }
    throw err
  }
  writeFileSync(fd, String(process.pid))
  closeSync(fd)
  writeFileSync(PIDFILE, String(process.pid))

  let released = false
  return function release(): void {
    if (released) return
    released = true
    try { unlinkSync(LOCKFILE) } catch { /* already gone */ }
    try { unlinkSync(PIDFILE) } catch { /* already gone */ }
  }
}

/** Returns the live daemon's PID, or null if no daemon is running. */
export function readLivePid(): number | null {
  if (!existsSync(PIDFILE)) return null
  try {
    const pid = Number(readFileSync(PIDFILE, 'utf8').trim())
    if (!Number.isFinite(pid) || pid <= 0) return null
    return isProcessAlive(pid) ? pid : null
  } catch {
    return null
  }
}

void dirname // tree-shaking hint: keep node:path import even if unused above
