/**
 * ComponentSetWidget — renders all exports from a story in a single iframe grid.
 *
 * Instead of N iframes (one per export), this widget loads one iframe pointing
 * to the story's ComponentSetPage. Each export renders in a grid cell inside
 * that single page. The user can select a cell (via label click) which updates
 * `props.selected` — visible to connected agents.
 *
 * Props: { storyId, layout, selected, width, height }
 */
import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData } from '@dfosco/storyboard-core'
import Icon from '../../Icon.jsx'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { useIframeDevLogs } from './iframeDevLogs.js'
import styles from './ComponentSetWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function GridIcon({ size = 16 }) {
  return <Icon name="iconoir/view-grid" size={size} />
}

function resolveComponentSetUrl(storyId, layout, selected) {
  const story = getStoryData(storyId)
  if (!story?._route) return ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('_sb_embed', '')
  params.set('_sb_hide_branch_bar', '')
  params.set('_sb_component_set', '')
  if (layout) params.set('layout', layout)
  if (selected) params.set('selected', selected)
  return `${base}${story._route}?${params}`
}

export default forwardRef(function ComponentSetWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const layout = props?.layout || 'horizontal'
  const selected = props?.selected || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [storyIndexKey, setStoryIndexKey] = useState(0)

  // Re-resolve when story index is live-patched
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  // Exit interactive mode when clicking outside
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${widgetId}"]`)
        if (chromeEl) return
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, widgetId])

  // Listen for selection messages from the embedded ComponentSetPage
  useEffect(() => {
    function handleMessage(e) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type === 'storyboard:component-set:select') {
        const newSelected = e.data.exportName || ''
        if (newSelected !== selected) {
          onUpdate?.({ selected: newSelected })
        }
      } else if (e.data?.type === 'storyboard:component-set:resize') {
        // Auto-size widget to fit the grid content (+ header height)
        const headerH = 32
        const newW = Math.max(200, Math.ceil(e.data.width))
        const newH = Math.max(60, Math.ceil(e.data.height) + headerH)
        if (newW !== width || newH !== height) {
          onUpdate?.({ width: newW, height: newH })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [selected, width, height, onUpdate])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'flip-layout') {
        const next = layout === 'horizontal' ? 'vertical' : 'horizontal'
        onUpdate?.({ layout: next })
        return true
      } else if (actionId === 'open-external') {
        const story = getStoryData(storyId)
        if (story?._route) {
          const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
          window.open(`${base}${story._route}`, '_blank', 'noopener')
        }
        return true
      }
    },
  }), [storyId, layout, onUpdate])

  const iframeSrc = useMemo(
    () => resolveComponentSetUrl(storyId, layout, selected),
    // storyIndexKey forces re-evaluation when HMR mutates the story index
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storyId, layout, selected, storyIndexKey],
  )

  useIframeDevLogs({
    widget: 'ComponentSetWidget',
    loaded: interactive && Boolean(iframeSrc),
    src: iframeSrc,
  })

  const displayName = storyId || 'Component Set'

  if (!storyId) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}><GridIcon size={20} /></span>
            <span className={styles.errorText}>Missing story ID</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!iframeSrc) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}><GridIcon size={20} /></span>
            <span className={styles.errorText}>Story &ldquo;{storyId}&rdquo; not found or has no route</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.header}>
          <span className={styles.headerIcon}><GridIcon size={16} /></span>
          <span className={styles.headerTitle}>{displayName}</span>
          {selected && (
            <span className={styles.headerSelected}>· {selected}</span>
          )}
          <span className={styles.headerLayout} title={`Layout: ${layout}`}>
            {layout === 'horizontal' ? '⇔' : '⇕'}
          </span>
        </div>
        <div className={styles.content}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className={styles.iframe}
            title={`${displayName} component set`}
            onLoad={(e) => e.target.blur()}
          />
        </div>
        {!interactive && (
          <div
            className={overlayStyles.interactOverlay}
            onClick={(e) => {
              if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
              enterInteractive()
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                enterInteractive()
              }
            }}
            aria-label="Click to interact"
          >
            <span className={overlayStyles.interactHint}>Click to interact</span>
          </div>
        )}
      </div>
      {resizable && <ResizeHandle targetRef={containerRef} width={width} height={height} onResize={handleResize} />}
    </WidgetWrapper>
  )
})
