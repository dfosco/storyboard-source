import { useContext, useCallback } from 'react'
import { StoryboardContext } from '../StoryboardContext.js'

/**
 * Read the current scene name and programmatically switch scenes.
 *
 * @returns {{ sceneName: string, switchScene: (name: string) => void }}
 *   - sceneName   – current active scene (e.g. "default")
 *   - switchScene – navigate to a different scene by updating ?scene= param
 */
export function useScene() {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useScene must be used within a <StoryboardProvider>')
  }

  const switchScene = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.set('scene', name)
    // Clear hash params (they belonged to the old scene)
    url.hash = ''
    window.location.href = url.toString()
  }, [])

  return {
    sceneName: context.sceneName,
    switchScene,
  }
}
