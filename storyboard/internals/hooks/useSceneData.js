import { useContext, useMemo, useSyncExternalStore } from 'react'
import { StoryboardContext } from '../StoryboardContext.js'
import { getByPath, deepClone, setByPath } from '../../core/dotPath.js'
import { getParam, getAllParams } from '../../core/session.js'
import { subscribeToHash, getHashSnapshot } from '../../core/hashSubscribe.js'

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

  // Re-render on any hash change
  const hashString = useSyncExternalStore(subscribeToHash, getHashSnapshot)

  // Collect overrides relevant to this path
  const result = useMemo(() => {
    if (loading || error || data == null) return undefined

    if (!path) {
      // No path → return full scene data with all hash overrides applied
      const allParams = getAllParams()
      const keys = Object.keys(allParams)
      if (keys.length === 0) return data
      const merged = deepClone(data)
      for (const key of keys) setByPath(merged, key, allParams[key])
      return merged
    }

    // Exact match: hash param directly for this path
    const exact = getParam(path)
    if (exact !== null) return exact

    // Child overrides: hash params that are nested under this path
    const prefix = path + '.'
    const allParams = getAllParams()
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
  }, [data, loading, error, path, hashString]) // eslint-disable-line react-hooks/exhaustive-deps

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
