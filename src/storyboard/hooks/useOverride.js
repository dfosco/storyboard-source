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
 * Read/write hash-param overrides on top of scene data.
 *
 * Read priority:  URL hash param  →  Scene JSON value  →  undefined
 * Write target:   URL hash only (scene JSON is read-only)
 *
 * Use this hook when you need to **write** an override (e.g. form inputs,
 * toggle buttons). For read-only access to scene data (with overrides
 * applied transparently), prefer `useSceneData()`.
 *
 * @param {string} path - Dot-notation key (e.g. 'settings.theme')
 * @returns {[any, function, function]}
 *   [0] current value (override ?? scene default)
 *   [1] setValue(newValue)  – write an override to the URL hash
 *   [2] clearValue()       – remove the override, reverting to scene default
 */
export function useOverride(path) {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useOverride must be used within a <StoryboardProvider>')
  }

  const { data } = context

  // Scene default for this path (fallback when no override exists)
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
