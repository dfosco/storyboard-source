/**
 * StorySetWidget — renders all exports from a story in a single iframe grid.
 *
 * Instead of N iframes (one per export), this widget loads one iframe pointing
 * to the isolate-set endpoint. Each export renders in a grid cell inside
 * that single page. The user can select a cell (via label click) which updates
 * `props.selected` — visible to connected agents.
 *
 * User-facing label: "Component Set"
 *
 * Props: { storyId, layout, selected, width, height }
 */
import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData } from '../../../core/index.js'
import { useThemeState, useThemeSyncTargets } from '../../hooks/useThemeState.js'
import Icon from '../../Icon.jsx'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import ExpandedPane from './ExpandedPane.jsx'
import { buildSecondaryIframeUrl, getSplitPaneLabel } from './expandUtils.js'
import { useExpandOverride } from './useExpandOverride.js'
import { useIframeDevLogs } from './iframeDevLogs.js'
import styles from './StorySetWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function GridIcon({ size = 16 }) {
  return <Icon name="iconoir/view-grid" size={size} />
}

function resolveStorySetUrl(storyId, layout, selected, density, theme) {
  const story = getStoryData(storyId)
  if (!story?._storyModule) return ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('module', story._storyModule)
  if (layout) params.set('layout', layout)
  if (selected) params.set('selected', selected)
  if (density) params.set('density', density)
  if (theme) params.set('theme', theme)
  return `${base}/_storyboard/canvas/isolate-set?${params}`
}

export default forwardRef(function StorySetWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const rawLayout = props?.layout || 'auto'
  // Migrate legacy values (horizontal/vertical) to the new vocabulary.
  const layout = rawLayout === 'horizontal' ? 'wide' : rawLayout === 'vertical' ? 'tall' : rawLayout
  const density = props?.density || ''
  const selected = props?.selected || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const contentSizeRef = useRef({ width: 0, height: 0 })
  const [snapping, setSnapping] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [storyIndexKey, setStoryIndexKey] = useState(0)
  const [expandedMode, setExpandedMode] = useExpandOverride('storyset', widgetId)
  const expanded = expandedMode === '1' || expandedMode === 'immersive'
  const immersive = expandedMode === 'immersive'
  const setExpanded = useCallback((mode) => {
    if (!mode) setExpandedMode(null)
    else if (mode === 'immersive') setExpandedMode('immersive')
    else setExpandedMode('1')
  }, [setExpandedMode])

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

  // Listen for selection messages from the embedded grid
  useEffect(() => {
    function handleMessage(e) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type === 'storyboard:component-set:select') {
        const newSelected = e.data.exportName || ''
        if (newSelected !== selected) {
          onUpdate?.({ selected: newSelected })
        }
      } else if (e.data?.type === 'storyboard:component-set:initial-size') {
        // Only honor the initial size hint when the widget has no dimensions
        // yet — never override a user-resized widget.
        if (typeof width === 'number' && typeof height === 'number') return
        const headerH = 37
        const newW = typeof width === 'number' ? width : Math.max(200, Math.ceil(e.data.width))
        const newH = typeof height === 'number' ? height : Math.max(120, Math.ceil(e.data.height) + headerH + 8)
        onUpdate?.({ width: newW, height: newH })
      } else if (e.data?.type === 'storyboard:component-set:content-size') {
        contentSizeRef.current = {
          width: Math.ceil(e.data.width) || 0,
          height: Math.ceil(e.data.height) || 0,
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [selected, width, height, onUpdate])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  // On resize end: if the widget is larger than the content grid needs in
  // either axis, snap that axis down to fit (with a CSS transition for a
  // smooth settle).
  const handleResizeEnd = useCallback((w, h) => {
    const headerH = 37
    const contentH = contentSizeRef.current.height
    const contentW = contentSizeRef.current.width
    if (!contentH && !contentW) return
    const fitH = contentH ? contentH + headerH + 8 : h
    const fitW = contentW || w
    const shouldSnapH = contentH && h > fitH + 2
    const shouldSnapW = contentW && w > fitW + 2
    if (!shouldSnapH && !shouldSnapW) return
    setSnapping(true)
    onUpdate?.({
      width: shouldSnapW ? fitW : w,
      height: shouldSnapH ? fitH : h,
    })
    setTimeout(() => setSnapping(false), 260)
  }, [onUpdate])

  useImperativeHandle(ref, () => ({
    handleAction(actionId, opts) {
      if (actionId === 'expand' || actionId === 'expand-single') {
        setExpanded(opts?.altKey ? 'immersive' : 'open')
        return true
      } else if (actionId === 'refresh-frame') {
        const iframe = iframeRef.current
        if (iframe) {
          // Force reload by re-assigning src
          // eslint-disable-next-line no-self-assign
          iframe.src = iframe.src
        }
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
  }), [storyId, layout, onUpdate, setExpanded])

  const { resolved: resolvedTheme } = useThemeState() || {}
  const { prototype: prototypeSync } = useThemeSyncTargets() || {}
  const effectiveTheme = prototypeSync ? (resolvedTheme || 'light') : 'light'

  const iframeSrc = useMemo(
    () => resolveStorySetUrl(storyId, layout, selected, density, effectiveTheme),
    // storyIndexKey forces re-evaluation when HMR mutates the story index
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storyId, layout, selected, density, storyIndexKey, effectiveTheme],
  )

  useIframeDevLogs({
    widget: 'StorySetWidget',
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
  if (snapping) sizeStyle.transition = 'width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), height 220ms cubic-bezier(0.2, 0.8, 0.2, 1)'

  return (
    <>
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.header}>
          <span className={styles.headerIcon}><GridIcon size={16} /></span>
          <span className={styles.headerTitle}>{displayName}</span>
          {selected && (
            <span className={styles.headerSelected}>· {selected}</span>
          )}
          <span className={styles.headerLayout} title={`Layout: ${layout}`}>
            {layout === 'wide' ? '▭' : layout === 'tall' ? '▯' : '▦'}
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
      {resizable && <ResizeHandle targetRef={containerRef} width={width} height={height} onResize={handleResize} onResizeEnd={handleResizeEnd} />}
    </WidgetWrapper>
    {expanded && (
      <ComponentSetExpandPane
        widgetId={widgetId}
        storyId={storyId}
        layout={layout}
        selected={selected}
        immersive={immersive}
        onClose={() => setExpanded(null)}
      />
    )}
    </>
  )
})

function ComponentSetExpandPane({ widgetId, storyId, layout, selected, immersive, onClose }) {
  const url = useMemo(
    () => buildSecondaryIframeUrl({ type: 'component-set', props: { storyId, layout, selected } }),
    [storyId, layout, selected],
  )
  const label = useMemo(
    () => getSplitPaneLabel({ type: 'component-set', props: { storyId } }),
    [storyId],
  )

  const pane = useMemo(() => ({
    id: widgetId,
    label,
    widgetType: 'component-set',
    kind: 'react',
    render: () => url
      ? <iframe src={url} style={{ border: 'none', width: '100%', height: '100%', display: 'block' }} title={storyId} onLoad={(e) => e.target.blur()} />
      : <div style={{ padding: 32, color: 'var(--fgColor-muted)' }}>Story &quot;{storyId}&quot; not found</div>,
  }), [widgetId, label, url, storyId])

  return (
    <ExpandedPane
      initialPanes={[pane]}
      variant={immersive ? 'immersive' : 'modal'}
      onClose={onClose}
    />
  )
}
