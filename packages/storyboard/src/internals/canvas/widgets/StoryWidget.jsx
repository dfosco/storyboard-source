/**
 * Renders a story at its route URL inside an iframe on canvas.
 *
 * Features:
 * - Title bar showing story name + export
 * - "Show code" action toggles between iframe and source view
 * - "Copy code" action copies the story source to clipboard
 *
 * Props: { storyId, exportName, width, height }
 */
import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData } from '../../../core/index.js'
import { getConfig } from '../../../core/stores/configStore.js'
import { createInspectorHighlighter } from '../../../core/inspector/highlighter.js'
import Icon from '../../Icon.jsx'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { useIframeDevLogs } from './iframeDevLogs.js'
import { findAllConnectedSplitTargets, getSplitPaneLabel, buildPaneForWidget, buildSplitLayout, buildSecondaryIframeUrl } from './expandUtils.js'
import { useExpandOverride } from './useExpandOverride.js'
import ExpandedPane from './ExpandedPane.jsx'
import InlineStoryRenderer from './InlineStoryRenderer.jsx'
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function ComponentIcon({ size = 36 }) {
  return <Icon name="iconoir/keyframe" size={size} />
}

function isInlineStoriesEnabled() {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.has('_sb_inline_stories')) {
        const v = params.get('_sb_inline_stories')
        return v !== '0' && v !== 'false'
      }
    }
  } catch { /* */ }
  try {
    return Boolean(getConfig('canvas')?.inlineStories)
  } catch { return false }
}

function resolveStoryUrl(storyId, exportName) {
  const story = getStoryData(storyId)
  if (!story?._storyModule) return ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('module', story._storyModule)
  if (exportName) params.set('export', exportName)
  return `${base}/_storyboard/canvas/isolate?${params}`
}

const _storySourcesCache = {}

async function fetchStorySource(modulePath) {
  if (modulePath in _storySourcesCache) return _storySourcesCache[modulePath]
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const path = modulePath.startsWith('/') ? modulePath : `/${modulePath}`
  const res = await fetch(`${base}${path}?raw`)
  if (!res.ok) throw new Error(`Failed to fetch ${base}${path}`)
  const code = await res.text()
  _storySourcesCache[modulePath] = code
  return code
}

export default forwardRef(function StoryWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const [expandMode, setExpandMode] = useExpandOverride('story', widgetId)
  const expanded = expandMode !== null
  const iframeRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showCode, setShowCode] = useState(!!props?.showCode)
  const [sourceCode, setSourceCode] = useState(null)
  const [highlightedHtml, setHighlightedHtml] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [storyIndexKey, setStoryIndexKey] = useState(0)

  // Re-resolve story URL when the story index is live-patched
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  const toggleShowCode = useCallback(() => {
    setShowCode((v) => {
      const next = !v
      if (onUpdate) onUpdate({ showCode: next })
      return next
    })
  }, [onUpdate])

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

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  // Load source code when show-code is toggled on
  useEffect(() => {
    if (!showCode || sourceCode !== null) return
    const story = getStoryData(storyId)
    if (!story?._storyModule) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSourceCode('// Source not available')
      return
    }
    let cancelled = false
    setSourceLoading(true)
    fetchStorySource(story._storyModule)
      .then((code) => { if (!cancelled) { setSourceCode(code || '// Empty file'); setSourceLoading(false) } })
      .catch(() => { if (!cancelled) { setSourceCode('// Failed to load source'); setSourceLoading(false) } })
    return () => { cancelled = true; setSourceLoading(false) }
  }, [showCode, sourceCode, storyId])

  // Re-highlight when theme changes
  const [codeThemeKey, setCodeThemeKey] = useState(0)
  useEffect(() => {
    function onThemeChanged() { setCodeThemeKey((k) => k + 1) }
    document.addEventListener('storyboard:theme:changed', onThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', onThemeChanged)
  }, [])

  // Syntax-highlight source code
  useEffect(() => {
    if (!sourceCode) return
    let cancelled = false
    createInspectorHighlighter().then((hl) => {
      if (cancelled) return
      const lang = storyId.endsWith('.tsx') ? 'tsx' : 'jsx'
      setHighlightedHtml(hl.codeToHtml(sourceCode, { lang }))
    })
    return () => { cancelled = true }
  }, [sourceCode, storyId, codeThemeKey])

  const copyCode = useCallback(async () => {
    if (sourceCode) { await navigator.clipboard?.writeText(sourceCode); return }
    const story = getStoryData(storyId)
    if (!story?._storyModule) return
    try {
      const code = await fetchStorySource(story._storyModule)
      setSourceCode(code)
      await navigator.clipboard?.writeText(code)
    } catch { /* */ }
  }, [sourceCode, storyId])

  useImperativeHandle(ref, () => ({
    getState(key) {
      if (key === 'showCode') return showCode
      return undefined
    },
    handleAction(actionId, opts) {
      if (actionId === 'show-code') toggleShowCode()
      else if (actionId === 'copy-code') copyCode()
      else if (actionId === 'refresh-frame') {
        const iframe = iframeRef.current
        if (iframe) {
          // eslint-disable-next-line no-self-assign
          iframe.src = iframe.src
        }
      }
      else if (actionId === 'expand' || actionId === 'expand-single') {
        setExpandMode(opts?.altKey ? 'immersive' : 'single')
      }
      else if (actionId === 'split-screen') setExpandMode('split')
      else if (actionId === 'open-external') {
        const story = getStoryData(storyId)
        if (story?._route) {
          const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
          window.open(`${base}${story._route}`, '_blank', 'noopener')
        }
      }
    },
  }), [storyId, showCode, toggleShowCode, copyCode, setExpandMode])

  const iframeSrc = useMemo(
    () => resolveStoryUrl(storyId, exportName),
    [storyId, exportName, storyIndexKey],
  )

  const inlineEnabled = isInlineStoriesEnabled()

  // When paused and not interactive, freeze the iframe src to prevent reloads
  const effectiveSrc = iframeSrc

  useIframeDevLogs({
    widget: 'StoryWidget',
    loaded: !inlineEnabled && interactive && !showCode && Boolean(effectiveSrc),
    src: effectiveSrc,
  })

  const displayName = exportName ? `${storyId} / ${exportName}` : storyId

  if (!storyId) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}><ComponentIcon size={20} /></span>
            <span className={styles.errorText}>Missing story ID</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!inlineEnabled && !effectiveSrc) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}><ComponentIcon size={20} /></span>
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
    <>
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.header}>
          <span className={styles.headerIcon}><ComponentIcon size={16} /></span>
          <span className={styles.headerTitle}>{displayName}</span>
        </div>
        {showCode ? (
          <div
            className={styles.codeView}
            data-canvas-allow-text-selection
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.codeHeader}>
              <span className={styles.codeLabel}>{storyId}.story.jsx</span>
              <button className={styles.codeCloseBtn} onClick={() => setShowCode(false)} aria-label="Close code view">×</button>
            </div>
            {sourceLoading ? (
              <div className={styles.codeLoading}>Loading…</div>
            ) : highlightedHtml ? (
              <div className={styles.codeBlock} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            ) : (
              <pre className={styles.codeBlock}><code>{sourceCode || ''}</code></pre>
            )}
          </div>
        ) : (
          <>
            <div className={styles.content}>
              {inlineEnabled ? (
                <InlineStoryRenderer storyId={storyId} exportName={exportName} />
              ) : (
                <iframe
                  ref={iframeRef}
                  src={effectiveSrc}
                  className={styles.iframe}
                  title={displayName}
                  onLoad={(e) => e.target.blur()}
                />
              )}
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
          </>
        )}
      </div>
      {resizable && <ResizeHandle targetRef={containerRef} width={width} height={height} onResize={handleResize} />}
    </WidgetWrapper>
    {expanded && (
      <StoryExpandPane
        widgetId={widgetId}
        storyId={storyId}
        exportName={exportName}
        splitMode={expandMode === 'split'}
        immersive={expandMode === 'immersive'}
        onClose={() => setExpandMode(null)}
      />
    )}
    </>
  )
})

function StoryExpandPane({ widgetId, storyId, exportName, splitMode, immersive, onClose }) {
  const connectedWidgets = useMemo(
    () => splitMode ? findAllConnectedSplitTargets(widgetId) : [],
    [widgetId, splitMode],
  )

  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || { id: widgetId, type: 'story', position: { x: 0, y: 0 }, props: { storyId, exportName } }
  }, [widgetId, storyId, exportName])

  const buildPaneFn = useCallback((widget) => {
    if (widget.id === widgetId) {
      const url = buildSecondaryIframeUrl({ type: 'story', props: { storyId, exportName } })
      return {
        id: widgetId,
        label: getSplitPaneLabel({ type: 'story', props: { storyId, exportName } }),
        widgetType: 'story',
        kind: 'react',
        render: () => url
          ? <iframe src={url} style={{ border: 'none', width: '100%', height: '100%', display: 'block' }} title={storyId} onLoad={(e) => e.target.blur()} />
          : <div style={{ padding: 32, color: 'var(--fgColor-muted)' }}>Story &quot;{storyId}&quot; not found</div>,
      }
    }
    return buildPaneForWidget(widget)
  }, [widgetId, storyId, exportName])

  const layout = useMemo(
    () => buildSplitLayout(primaryWidget, connectedWidgets, buildPaneFn),
    [primaryWidget, connectedWidgets, buildPaneFn],
  )

  const isSinglePane = layout.flat().length <= 1
  const variant = isSinglePane ? (immersive ? 'immersive' : 'modal') : 'full'

  return (
    <ExpandedPane
      initialLayout={layout}
      variant={variant}
      onClose={onClose}
    />
  )
}
