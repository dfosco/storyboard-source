import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useSearchParams } from 'react-router-dom'
import { Text } from '@primer/react'
import { loadScene } from '../../core/loader.js'
import styles from './SceneDebug.module.css'

/**
 * Debug component that displays loaded scene data as formatted JSON.
 * Used to verify the loader is working correctly.
 * Reads scene name from URL param (?scene=name) or uses prop/default.
 */
export default function SceneDebug({ sceneName } = {}) {
  const [searchParams] = useSearchParams()
  const sceneFromUrl = searchParams.get('scene')
  const activeSceneName = sceneName || sceneFromUrl || 'default'

  const { data, error } = useMemo(() => {
    try {
      return { data: loadScene(activeSceneName), error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [activeSceneName])

  if (error) {
    return (
      <div className={styles.error}>
        <Text className={styles.errorTitle}>Error loading scene</Text>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Scene: {activeSceneName}</h2>
      <pre className={styles.codeBlock}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

SceneDebug.propTypes = {
  sceneName: PropTypes.string,
}
