/**
 * Prototype reload guard — suppresses Vite HMR full-reloads for non-canvas pages.
 *
 * Controlled by the "prototype-auto-reload" feature flag (default: true).
 * When the flag is false (user opted out), sends heartbeat messages to the
 * Vite dev server which suppresses full-reload and update payloads for this
 * client. Custom storyboard events (canvas file changes, story changes, etc.)
 * always pass through.
 *
 * Heartbeats are sent every 3s and auto-expire server-side after 5s, so
 * closed tabs never leave the guard stuck.
 */
import { useEffect } from 'react'
import { getFlag, subscribeToStorage } from '../../core/index.js'

const FLAG_KEY = 'prototype-auto-reload'
const HEARTBEAT_MS = 3000

export default function usePrototypeReloadGuard() {
  useEffect(() => {
    if (!import.meta.hot) return

    let interval = null

    function start() {
      if (interval) return
      const msg = { active: true }
      import.meta.hot.send('storyboard:prototype-reload-guard', msg)
      interval = setInterval(() => {
        import.meta.hot.send('storyboard:prototype-reload-guard', msg)
      }, HEARTBEAT_MS)
    }

    function stop() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      import.meta.hot.send('storyboard:prototype-reload-guard', { active: false })
    }

    function sync() {
      const autoReload = getFlag(FLAG_KEY)
      if (autoReload) {
        stop()
      } else {
        start()
      }
    }

    // Initial sync
    sync()

    // Re-sync when any storyboard storage entry changes (subscribeToStorage
    // fires without a key arg, so we just re-read the flag every time).
    const unsub = subscribeToStorage(() => sync())

    return () => {
      stop()
      unsub()
    }
  }, [])
}
