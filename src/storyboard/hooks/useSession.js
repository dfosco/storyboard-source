import { useCallback, useContext, useSyncExternalStore } from 'react'
import { StoryboardContext } from '../StoryboardContext.js'
import { getByPath } from '../core/dotPath.js'
import { getParam, setParam, removeParam } from '../core/session.js'

/**
 * Subscribe to hash changes so React re-renders when the hash updates.
 */
function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

/**
 * Read/write session state backed by URL hash params,
 * with scene data as the fallback default.
 *
 * Read priority:  URL hash param  ??  Scene JSON value  ??  undefined
 * Write target:   URL hash only (scene JSON is read-only)
 *
 * @param {string} path - Dot-notation key (e.g. 'settings.theme')
 * @returns {[any, function, function]}
 *   [0] current value
 *   [1] setter  – setValue(newValue)
 *   [2] clear   – clearValue() removes the hash param, reverting to scene default
 */
export function useSession(path) {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useSession must be used within a <StoryboardProvider>')
  }

  const { data } = context

  // Scene default for this path (read-only fallback)
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  // Read the hash param reactively via useSyncExternalStore
  const getSnapshot = useCallback(() => getParam(path), [path])
  const hashValue = useSyncExternalStore(subscribeToHash, getSnapshot)

  // Resolved value: hash param wins, then scene default
  const value = hashValue !== null ? hashValue : sceneDefault

  /** Write a value to the hash param */
  const setValue = useCallback(
    (newValue) => {
      setParam(path, newValue)
    },
    [path],
  )

  /** Remove the hash param, reverting to scene default */
  const clearValue = useCallback(() => {
    removeParam(path)
  }, [path])

  return [value, setValue, clearValue]
}
