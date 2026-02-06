import { useState, useEffect } from 'react'
import { Text } from '@primer/react'
import { loadScene } from '../core/loader.js'
import styles from './SceneDebug.module.css'

/**
 * Debug component that displays loaded scene data as formatted JSON.
 * Used to verify the loader is working correctly.
 */
export default function SceneDebug({ sceneName = 'default' }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    loadScene(sceneName)
      .then((sceneData) => {
        setData(sceneData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [sceneName])

  if (loading) {
    return (
      <div className={styles.container}>
        <Text>Loading scene: {sceneName}...</Text>
      </div>
    )
  }

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
      <h2 className={styles.title}>Scene: {sceneName}</h2>
      <pre className={styles.codeBlock}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
