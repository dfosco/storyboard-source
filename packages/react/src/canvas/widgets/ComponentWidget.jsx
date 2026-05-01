import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import ComponentErrorBoundary from '../ComponentErrorBoundary.jsx'
import { useIframeDevLogs } from './iframeDevLogs.js'
import styles from './ComponentWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

/**
 * Renders a live JSX export from a .story.jsx file.
 *
 * In dev mode (isLocalDev), each component is rendered inside an iframe
 * via the /_storyboard/canvas/isolate middleware. This isolates broken
 * components so they cannot crash the entire canvas page.
 *
 * In production, the component is rendered directly with an ErrorBoundary
 * as a fallback safety net.
 *
 * Double-click the overlay to enter interactive mode (dropdowns, buttons work).
 * Click outside to exit interactive mode.
 */
export default function ComponentWidget({
  component: Component,
  jsxModule,
  exportName,
  canvasTheme,
  isLocalDev,
  width,
  height,
  onUpdate,
  resizable,
}) {
  const containerRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showIframe, setShowIframe] = useState(false)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  // Exit interactive mode when clicking outside the component.
  // Keep the iframe mounted (don't reset showIframe) to avoid a full
  // reload cost every time the user clicks away and back.
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  // Build iframe src for dev isolation
  const iframeSrc = useMemo(() => {
    if (!isLocalDev || !jsxModule || !exportName) return null
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    const params = new URLSearchParams({
      module: jsxModule,
      export: exportName,
      theme: canvasTheme || 'light',
    })
    return `${basePath}/_storyboard/canvas/isolate?${params}`
  }, [isLocalDev, jsxModule, exportName, canvasTheme])

  const useIframe = isLocalDev && iframeSrc

  useIframeDevLogs({
    widget: 'ComponentWidget',
    loaded: Boolean(useIframe && showIframe),
    src: iframeSrc,
  })

  if (!useIframe && !Component) return null

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.content}>
          {useIframe ? (
            showIframe ? (
              <iframe
                src={iframeSrc}
                className={styles.iframe}
                title={exportName || 'Component widget'}
                sandbox="allow-same-origin allow-scripts"
                onLoad={(e) => e.target.blur()}
              />
            ) : (
              <div className={styles.placeholder} />
            )
          ) : Component ? (
            <ComponentErrorBoundary name={exportName}>
              <Component />
            </ComponentErrorBoundary>
          ) : null}
        </div>
        {!interactive && (
          <div
            className={overlayStyles.interactOverlay}
            onClick={(e) => {
              // Don't enter interactive mode for modifier clicks (shift/meta/ctrl for multi-select)
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              if (useIframe) setShowIframe(true)
              enterInteractive()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                if (useIframe) setShowIframe(true)
                enterInteractive()
              }
            }}
            aria-label="Click to interact with component"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}
        {resizable && (
          <ResizeHandle
            targetRef={containerRef}
            minWidth={100}
            minHeight={60}
            onResize={handleResize}
          />
        )}
      </div>
    </WidgetWrapper>
  )
}
