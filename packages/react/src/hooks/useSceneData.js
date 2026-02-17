import { useContext, useMemo, useSyncExternalStore } from 'react'
import { StoryboardContext } from '../StoryboardContext.js'
import { getByPath, deepClone, setByPath } from '@storyboard/core'
import { getParam, getAllParams } from '@storyboard/core'
import { subscribeToHash, getHashSnapshot } from '@storyboard/core'
import { isHideMode, getShadow, getAllShadows } from '@storyboard/core'
import { subscribeToStorage, getStorageSnapshot } from '@storyboard/core'

/**
 * Access scene data by dot-notation path.
 * Hash params override scene data — both exact matches and nested paths.
 *
 * Examples:
 *   useSceneData('user.name') with #user.name=Alice → "Alice"
 *   useSceneData('repositories') with #repositories.0.name=Foo
 *     → deep clone of repositories array with [0].name overridden to "Foo"
 *
 * @param {string} [path] - Dot-notation path (e.g. 'user.profile.name').
 *                          Omit to get the entire scene object.
 * @returns {*} The resolved value. Returns {} if path is missing after loading.
 * @throws If used outside a StoryboardProvider.
 */
export function useSceneData(path) {
  const context = useContext(StoryboardContext)

  if (context === null) {
    throw new Error('useSceneData must be used within a <StoryboardProvider>')
  }

  const { data, loading, error } = context

  // Re-render on any hash or localStorage change
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageString = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  // Collect overrides relevant to this path
  const result = useMemo(() => {
    if (loading || error || data == null) return undefined

    const hidden = isHideMode()
    // In hide mode, read from shadow localStorage; otherwise from URL hash
    const readParam = hidden ? getShadow : getParam
    const readAllParams = hidden ? getAllShadows : getAllParams

    if (!path) {
      // No path → return full scene data with all overrides applied
      const allParams = readAllParams()
      const keys = Object.keys(allParams)
      if (keys.length === 0) return data
      const merged = deepClone(data)
      for (const key of keys) setByPath(merged, key, allParams[key])
      return merged
    }

    // Exact match: param directly for this path
    const exact = readParam(path)
    if (exact !== null) return exact

    // Child overrides: params that are nested under this path
    const prefix = path + '.'
    const allParams = readAllParams()
    const childKeys = Object.keys(allParams).filter(k => k.startsWith(prefix))

    const sceneValue = getByPath(data, path)

    if (childKeys.length > 0 && sceneValue !== undefined) {
      const merged = deepClone(sceneValue)
      for (const key of childKeys) {
        const relativePath = key.slice(prefix.length)
        setByPath(merged, relativePath, allParams[key])
      }
      return merged
    }

    if (sceneValue === undefined) {
      console.warn(`[useSceneData] Path "${path}" not found in scene data.`)
      return {}
    }

    return sceneValue
  }, [data, loading, error, path, hashString, storageString]) // eslint-disable-line react-hooks/exhaustive-deps

  return result
}

/**
 * Returns true while scene data is still loading.
 */
export function useSceneLoading() {
  const context = useContext(StoryboardContext)

  if (context === null) {
    throw new Error('useSceneLoading must be used within a <StoryboardProvider>')
  }

  return context.loading
}
