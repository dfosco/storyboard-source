import { useCallback, useContext, useSyncExternalStore } from 'react'
import { StoryboardContext } from '../StoryboardContext.js'
import { getByPath } from '../../core/dotPath.js'
import { getParam, setParam, removeParam } from '../../core/session.js'
import { subscribeToHash } from '../../core/hashSubscribe.js'
import { isHideMode, getShadow, setShadow, removeShadow } from '../../core/hideMode.js'
import { subscribeToStorage, getStorageSnapshot } from '../../core/localStorage.js'

/**
 * Read/write overrides on top of scene data.
 *
 * **Normal mode:**
 *   Read priority:  URL hash param → Scene JSON value → undefined
 *   Write target:   URL hash + shadow copy to localStorage
 *
 * **Hide mode** (activated by `?hide`):
 *   Read priority:  shadow localStorage → Scene JSON value → undefined
 *   Write target:   shadow localStorage only (URL stays clean)
 *
 * Every write also mirrors to localStorage shadow keys, so hide mode
 * can hot-swap without data loss.
 *
 * @param {string} path - Dot-notation key (e.g. 'settings.theme')
 * @returns {[any, function, function]}
 *   [0] current value (override ?? scene default)
 *   [1] setValue(newValue)  – write an override
 *   [2] clearValue()       – remove the override, reverting to scene default
 */
export function useOverride(path) {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useOverride must be used within a <StoryboardProvider>')
  }

  const { data } = context
  const hidden = isHideMode()

  // Scene default for this path (fallback when no override exists)
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  // Subscribe to both sources for reactivity
  const getHashSnap = useCallback(() => getParam(path), [path])
  const hashValue = useSyncExternalStore(subscribeToHash, getHashSnap)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  // Resolved value depends on mode
  let value
  if (hidden) {
    const shadowValue = getShadow(path)
    value = shadowValue !== null ? shadowValue : sceneDefault
  } else {
    value = hashValue !== null ? hashValue : sceneDefault
  }

  /** Write a value — targets hash or shadow depending on mode */
  const setValue = useCallback(
    (newValue) => {
      if (isHideMode()) {
        setShadow(path, newValue)
      } else {
        setParam(path, newValue)
        // Always mirror to shadow so hide mode can hot-swap
        setShadow(path, newValue)
      }
    },
    [path],
  )

  /** Remove the override, reverting to scene default */
  const clearValue = useCallback(() => {
    if (isHideMode()) {
      removeShadow(path)
    } else {
      removeParam(path)
      removeShadow(path)
    }
  }, [path])

  return [value, setValue, clearValue]
}
