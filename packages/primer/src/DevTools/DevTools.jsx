import { useState, useEffect, useCallback } from 'react'
import { ActionMenu, ActionList } from '@primer/react'
import { loadScene } from '@storyboard/core'
import { BeakerIcon, InfoIcon, SyncIcon, XIcon } from '@primer/octicons-react'
import styles from './DevTools.module.css'

function getSceneName() {
  return new URLSearchParams(window.location.search).get('scene') || 'default'
}

/**
 * Storyboard DevTools — a floating toolbar for development.
 *
 * Features:
 *  - Floating button (bottom-center) that opens a menu
 *  - "Show scene info" — translucent overlay panel with resolved scene JSON
 *  - "Reset all params" — clears all URL hash session params
 *  - Cmd+. (Mac) / Ctrl+. (other) toggles the toolbar visibility
 */
export default function DevTools() {
  const [visible, setVisible] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [sceneData, setSceneData] = useState(null)
  const [sceneError, setSceneError] = useState(null)

  // Cmd+. keyboard shortcut to toggle toolbar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setVisible((v) => !v)
        if (visible) {
          setPanelOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  const handleShowSceneInfo = useCallback(() => {
    const sceneName = getSceneName()
    setPanelOpen(true)
    setSceneError(null)

    try {
      setSceneData(loadScene(sceneName))
    } catch (err) {
      setSceneError(err.message)
    }
  }, [])

  const handleResetParams = useCallback(() => {
    window.location.hash = ''
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Scene info overlay panel */}
      {panelOpen && (
        <div className={styles.overlay}>
          <div
            className={styles.overlayBackdrop}
            onClick={() => setPanelOpen(false)}
          />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                Scene: {getSceneName()}
              </span>
              <button
                className={styles.panelClose}
                onClick={() => setPanelOpen(false)}
                aria-label="Close panel"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className={styles.panelBody}>
              {sceneError && (
                <span className={styles.error}>{sceneError}</span>
              )}
              {!sceneError && sceneData && (
                <pre className={styles.codeBlock}>
                  {JSON.stringify(sceneData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <div className={styles.wrapper}>
        <ActionMenu>
          <ActionMenu.Anchor>
            <button
              className={styles.trigger}
              aria-label="Storyboard DevTools"
            >
              <BeakerIcon className={styles.triggerIcon} size={16} />
            </button>
          </ActionMenu.Anchor>
          <ActionMenu.Overlay align="center" side="outside-top" sideOffset={16}>
            <ActionList>
              <ActionList.Item onSelect={handleShowSceneInfo}>
                <ActionList.LeadingVisual>
                  <InfoIcon size={16} />
                </ActionList.LeadingVisual>
                Show scene info
              </ActionList.Item>
              <ActionList.Item onSelect={handleResetParams}>
                <ActionList.LeadingVisual>
                  <SyncIcon size={16} />
                </ActionList.LeadingVisual>
                Reset all params
              </ActionList.Item>
              <div className={styles.shortcutHint}>
                Press <code>⌘ + .</code> to hide
              </div>
              
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>
      </div>
    </>
  )
}
