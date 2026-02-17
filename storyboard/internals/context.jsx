/* eslint-disable react/prop-types */
import { useMemo } from 'react'
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
export default function StoryboardProvider({ sceneName, recordName, recordParam, children }) {
  const pageScene = getPageSceneName()
  const activeSceneName = getSceneParam() || sceneName || (sceneExists(pageScene) ? pageScene : 'default')
  const params = useParams()

  const { data, error } = useMemo(() => {
    try {
      let sceneData = loadScene(activeSceneName)

      // Merge record data if configured
      if (recordName && recordParam && params[recordParam]) {
        const entry = findRecord(recordName, params[recordParam])
        if (entry) {
          sceneData = deepMerge(sceneData, { record: entry })
        }
      }

      return { data: sceneData, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [activeSceneName, recordName, recordParam, params])

  const value = {
    data,
    error,
    loading: false,
    sceneName: activeSceneName,
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
