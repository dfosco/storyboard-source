/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { Text } from '@primer/react'
import { loadScene, sceneExists } from './core/loader.js'
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
 * Page-matching: if a scene file exists whose name matches the current
 * page (e.g. scenes/Overview.json for the /Overview route), it is used
 * automatically — no ?scene= param needed.
 * 
 * Blocks rendering children until scene data is loaded.
 */
export default function StoryboardProvider({ sceneName, fallback, children }) {
  const pageScene = getPageSceneName()
  const activeSceneName = getSceneParam() || sceneName || (sceneExists(pageScene) ? pageScene : 'default')

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only show loading state on initial mount or when scene actually changes
    if (data === null) {
      setLoading(true)
    }
    setError(null)

    loadScene(activeSceneName)
      .then((sceneData) => {
        setData(sceneData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [activeSceneName]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    data,
    error,
    loading,
    sceneName: activeSceneName,
  }

  // Block children until loaded
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
