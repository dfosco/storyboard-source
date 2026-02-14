/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from '@primer/react'
// Side-effect import: seeds the core data index via init()
import 'virtual:storyboard-data-index'
import { loadScene, sceneExists, findRecord } from '../core/loader.js'
import { deepMerge } from '../core/loader.js'
import { StoryboardContext } from './StoryboardContext.js'

export { StoryboardContext }

/**
 * Read the ?scene= param directly from window.location.
 * Avoids useSearchParams() which re-renders on every router
 * navigation event (including hash changes), causing a flash.
 */
function getSceneParam() {
  return new URLSearchParams(window.location.search).get('scene')
}

/**
 * Derives a scene name from the current page pathname.
 * "/Overview" → "Overview", "/" → "index", "/nested/Page" → "Page"
 */
function getPageSceneName() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'index'
  const last = path.split('/').pop()
  return last || 'index'
}

/**
 * Provides loaded scene data to the component tree.
 * Reads the scene name from the ?scene= URL param, the sceneName prop,
 * a matching scene file for the current page, or defaults to "default".
 *
 * Optionally merges record data when `recordName` and `recordParam` are provided.
 * The matched record entry is injected under the "record" key in scene data.
 */
export default function StoryboardProvider({ sceneName, recordName, recordParam, fallback, children }) {
  const pageScene = getPageSceneName()
  const activeSceneName = getSceneParam() || sceneName || (sceneExists(pageScene) ? pageScene : 'default')
  const params = useParams()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data === null) {
      setLoading(true)
    }
    setError(null)

    loadScene(activeSceneName)
      .then((sceneData) => {
        // Merge record data if configured
        if (recordName && recordParam && params[recordParam]) {
          const entry = findRecord(recordName, params[recordParam])
          if (entry) {
            sceneData = deepMerge(sceneData, { record: entry })
          }
        }
        setData(sceneData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [activeSceneName, recordName, recordParam, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    data,
    error,
    loading,
    sceneName: activeSceneName,
  }

  if (loading) {
    return fallback ?? <Text>Loading scene…</Text>
  }

  if (error) {
    return <Text color="danger.fg">Error loading scene: {error}</Text>
  }

  return (
    <StoryboardContext.Provider value={value}>
      {children}
    </StoryboardContext.Provider>
  )
}
