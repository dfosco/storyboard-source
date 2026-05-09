import { createRuntimeServer } from './http.js'
import { acquireRuntimeLock, RuntimeAlreadyRunningError } from './lock.js'
import { RUNTIME_HOST, RUNTIME_PORT } from './constants.js'

/**
 * Daemon entrypoint. Run via `node bin/runtime.js` (typically forked &
 * detached by the CLI on first call).
 *
 * Lifecycle:
 * 1. Acquire singleton lock (`~/.storyboard/runtime.lock`). Refuses to
 *    start if another live daemon already holds it.
 * 2. Bind the HTTP server on `127.0.0.1:4321`.
 * 3. On SIGINT/SIGTERM, drain in-flight requests, release the lock, exit 0.
 */
export async function startDaemon(): Promise<void> {
  let release: () => void
  try {
    release = acquireRuntimeLock()
  } catch (err) {
    if (err instanceof RuntimeAlreadyRunningError) {
      // eslint-disable-next-line no-console
      console.error(`[storyboard-runtime] already running (pid ${err.pid}). Exiting.`)
      process.exit(0)
    }
    throw err
  }

  const server = createRuntimeServer()

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(RUNTIME_PORT, RUNTIME_HOST, () => resolve())
  })

  // eslint-disable-next-line no-console
  console.log(`[storyboard-runtime] listening on http://${RUNTIME_HOST}:${RUNTIME_PORT}`)

  let shuttingDown = false
  function shutdown(signal: NodeJS.Signals): void {
    if (shuttingDown) return
    shuttingDown = true
    // eslint-disable-next-line no-console
    console.log(`[storyboard-runtime] received ${signal}, shutting down…`)
    server.close(() => {
      release()
      process.exit(0)
    })
    // Backstop — if connections won't close in 5s, kill anyway.
    setTimeout(() => {
      release()
      process.exit(0)
    }, 5000).unref()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
