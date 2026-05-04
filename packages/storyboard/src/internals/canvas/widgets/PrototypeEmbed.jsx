import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { buildPrototypeIndex } from '../../../core/index.js'
import { useOverride } from '../../hooks/useOverride.js'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { readProp, prototypeEmbedSchema } from './widgetProps.js'
import { getEmbedChromeVars } from './embedTheme.js'
import { useIframeDevLogs } from './iframeDevLogs.js'
import { findAllConnectedSplitTargets, getSplitPaneLabel, buildPaneForWidget, buildSplitLayout } from './expandUtils.js'
import ExpandedPane from './ExpandedPane.jsx'
import styles from './PrototypeEmbed.module.css'
import overlayStyles from './embedOverlay.module.css'

function CollageFrameIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z" />
      <path d="M11 12V4" />
      <path d="M4 12H20" />
    </svg>
  )
}

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveCanvasThemeFromStorage() {
  if (typeof localStorage === 'undefined') return 'light'
  let sync = { prototype: true, toolbar: false, codeBoxes: true, canvas: false }
  try {
    const rawSync = localStorage.getItem('sb-theme-sync')
    if (rawSync) sync = { ...sync, ...JSON.parse(rawSync) }
  } catch { /* */ }
  if (!sync.canvas) return 'light'
  const attrTheme = document.documentElement.getAttribute('data-sb-canvas-theme')
  if (attrTheme) return attrTheme
  const stored = localStorage.getItem('sb-color-scheme') || 'system'
  if (stored !== 'system') return stored
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default forwardRef(function PrototypeEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const width = readProp(props, 'width', prototypeEmbedSchema)
  const height = readProp(props, 'height', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema)
  const label = readProp(props, 'label', prototypeEmbedSchema) || src

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const baseSegment = basePath.replace(/^\//, '')
  const rawSrc = useMemo(() => {
    if (!src) return ''
    if (/^https?:\/\//.test(src)) return src
    const cleaned = src.replace(/^\/branch--[^/]+/, '')
    if (baseSegment && cleaned.startsWith(basePath)) return cleaned
    if (baseSegment && cleaned.startsWith(baseSegment)) return `/${cleaned}`
    return `${basePath}${cleaned}`
  }, [src, basePath, baseSegment])

  const scale = zoom / 100

  const [editing, setEditing] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [expandOverride, setExpandOverride, clearExpandOverride] = useOverride(`_prototype_expanded_${widgetId}`)
  const expandMode = expandOverride === 'immersive' ? 'immersive' : expandOverride === 'split' ? 'split' : expandOverride === 'single' ? 'single' : null
  const setExpandMode = useCallback((mode) => {
    if (mode) setExpandOverride(mode)
    else clearExpandOverride()
  }, [setExpandOverride, clearExpandOverride])
  const [immersiveClosing, setImmersiveClosing] = useState(false)
  const expanded = expandMode !== null
  const [filter, setFilter] = useState('')
  const [canvasTheme, setCanvasTheme] = useState(() => resolveCanvasThemeFromStorage())
  const inputRef = useRef(null)
  const filterRef = useRef(null)
  const embedRef = useRef(null)
  const iframeRef = useRef(null)
  const inlineContainerRef = useRef(null)
  const modalContainerRef = useRef(null)

  const iframeSrc = useMemo(() => {
    if (!rawSrc) return ''
    if (/^https?:\/\//.test(rawSrc)) return rawSrc
    const hashIdx = rawSrc.indexOf('#')
    const base = hashIdx >= 0 ? rawSrc.slice(0, hashIdx) : rawSrc
    const hash = hashIdx >= 0 ? rawSrc.slice(hashIdx) : ''
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}_sb_embed&_sb_hide_branch_bar&_sb_theme_target=prototype&_sb_canvas_theme=${canvasTheme}${hash}`
  }, [rawSrc, canvasTheme])

  const effectiveSrc = iframeSrc

  const prototypeIndex = useMemo(() => {
    try { return buildPrototypeIndex() }
    catch { return { folders: [], prototypes: [], globalFlows: [], sorted: { title: { prototypes: [], folders: [] } } } }
  }, [])

  const pickerGroups = useMemo(() => {
    const groups = []
    const idx = prototypeIndex
    const allProtos = []
    for (const folder of (idx.sorted?.title?.folders || idx.folders || [])) {
      for (const proto of folder.prototypes || []) {
        if (!proto.isExternal) allProtos.push(proto)
      }
    }
    for (const proto of (idx.sorted?.title?.prototypes || idx.prototypes || [])) {
      if (!proto.isExternal) allProtos.push(proto)
    }
    for (const proto of allProtos) {
      if (proto.hideFlows && proto.flows.length === 1) {
        groups.push({ label: proto.name, items: [{ name: proto.name, route: proto.flows[0].route }] })
      } else if (proto.flows.length > 0) {
        groups.push({ label: proto.name, items: proto.flows.map((f) => ({ name: f.meta?.title || formatName(f.name), route: f.route })) })
      } else {
        groups.push({ label: proto.name, items: [{ name: proto.name, route: `/${proto.dirName}` }] })
      }
    }
    const gf = idx.globalFlows || []
    if (gf.length > 0) {
      groups.push({ label: 'Other flows', items: gf.map((f) => ({ name: f.meta?.title || formatName(f.name), route: f.route })) })
    }
    return groups
  }, [prototypeIndex])

  const filteredGroups = useMemo(() => {
    if (!filter) return pickerGroups
    const q = filter.toLowerCase()
    return pickerGroups
      .map((group) => {
        const labelMatch = group.label.toLowerCase().includes(q)
        if (labelMatch) return group
        const matchedItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(q) || item.route.toLowerCase().includes(q)
        )
        if (matchedItems.length === 0) return null
        return { ...group, items: matchedItems }
      })
      .filter(Boolean)
  }, [pickerGroups, filter])

  const prototypeTitle = useMemo(() => {
    if (!src) return label || 'Prototype'
    const cleanSrc = src.replace(/^\/branch--[^/]+/, '')
    for (const group of pickerGroups) {
      for (const item of group.items) {
        const cleanRoute = item.route.replace(/^\/branch--[^/]+/, '')
        if (cleanRoute === cleanSrc) {
          // If the flow name matches the group name, just show the name
          if (item.name === group.label) return group.label
          return `${group.label} · ${item.name}`
        }
      }
    }
    return label || 'Prototype'
  }, [src, label, pickerGroups])

  const hasPicker = pickerGroups.length > 0

  useIframeDevLogs({
    widget: 'PrototypeEmbed',
    loaded: Boolean(effectiveSrc && interactive),
    src: effectiveSrc,
  })

  useEffect(() => {
    if (editing && hasPicker && filterRef.current) {
      filterRef.current.focus()
    } else if (editing && !hasPicker && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing, hasPicker])

  // Exit interactive mode when clicking outside the embed
  useEffect(() => {
    if (!interactive || expanded) return
    function handlePointerDown(e) {
      if (embedRef.current && !embedRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${widgetId}"]`)
        if (chromeEl) return
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, expanded, widgetId])

  useEffect(() => {
    function readToolbarTheme() {
      setCanvasTheme(resolveCanvasThemeFromStorage())
    }
    readToolbarTheme()
    document.addEventListener('storyboard:theme:changed', readToolbarTheme)
    return () => document.removeEventListener('storyboard:theme:changed', readToolbarTheme)
  }, [])

  // ── Fullscreen (immersive) mode — triggers expand with 'immersive' variant
  const expandModeRef = useRef(expandMode)
  expandModeRef.current = expandMode

  useEffect(() => {
    function handleEnter(e) {
      if (e.detail?.widgetId === widgetId) {
        setImmersiveClosing(false)
        setExpandMode('immersive')
      }
    }
    function handleExit(e) {
      if (e.detail?.widgetId === widgetId) {
        if (expandModeRef.current === 'immersive') {
          // Trigger animated close instead of immediate unmount
          setImmersiveClosing(true)
        } else {
          setExpandMode(null)
        }
      }
    }
    document.addEventListener('storyboard:canvas:widget-fullscreen', handleEnter)
    document.addEventListener('storyboard:canvas:widget-fullscreen-exit', handleExit)
    return () => {
      document.removeEventListener('storyboard:canvas:widget-fullscreen', handleEnter)
      document.removeEventListener('storyboard:canvas:widget-fullscreen-exit', handleExit)
    }
  }, [widgetId, setExpandMode])

  // Reparent iframe between inline and modal
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    if (expanded && modalContainerRef.current) {
      iframe._savedClassName = iframe.className
      iframe._savedStyle = iframe.getAttribute('style') || ''
      iframe.className = styles.expandIframe
      iframe.removeAttribute('style')
      const target = modalContainerRef.current
      try {
        if (target.moveBefore) target.moveBefore(iframe, target.firstChild)
        else target.prepend(iframe)
      } catch {
        target.prepend(iframe)
      }
    } else if (!expanded && inlineContainerRef.current) {
      if (iframe._savedClassName !== undefined) {
        iframe.className = iframe._savedClassName
        iframe.setAttribute('style', iframe._savedStyle)
        delete iframe._savedClassName
        delete iframe._savedStyle
      }
      const target = inlineContainerRef.current
      try {
        if (target.moveBefore) target.moveBefore(iframe, null)
        else target.appendChild(iframe)
      } catch {
        target.appendChild(iframe)
      }
    }
  }, [expanded])

  // Listen for navigation events from the embedded prototype iframe
  useEffect(() => {
    function handleMessage(e) {
      if (e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type !== 'storyboard:embed:navigate') return
      const newSrc = e.data.src
      if (newSrc && newSrc !== src) {
        const originalSrc = readProp(props, 'originalSrc', prototypeEmbedSchema)
        onUpdate?.({ src: newSrc, originalSrc: originalSrc || src })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [src, props, onUpdate])

  const chromeVars = useMemo(() => getEmbedChromeVars(canvasTheme), [canvasTheme])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  useImperativeHandle(ref, () => ({
    handleAction(actionId, opts) {
      if (actionId === 'edit') {
        setEditing(true)
      } else if (actionId === 'expand' || actionId === 'expand-single') {
        if (opts?.altKey) {
          setExpandMode('immersive')
        } else {
          setExpandMode('single')
        }
      } else if (actionId === 'split-screen') {
        setExpandMode('split')
      } else if (actionId === 'open-external') {
        if (rawSrc) window.open(rawSrc, '_blank', 'noopener')
      } else if (actionId === 'zoom-in') {
        const step = zoom < 75 ? 5 : 25
        onUpdate?.({ zoom: Math.min(200, zoom + step) })
      } else if (actionId === 'zoom-out') {
        const step = zoom <= 75 ? 5 : 25
        onUpdate?.({ zoom: Math.max(25, zoom - step) })
      }
    },
  }), [rawSrc, zoom, onUpdate])

  function handlePickRoute(route) {
    onUpdate?.({ src: route })
    setEditing(false)
    setFilter('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim() || ''
    onUpdate?.({ src: value })
    setEditing(false)
    setFilter('')
  }

  function handleCancelEdit() {
    setEditing(false)
    setFilter('')
  }

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  return (
    <>
    <WidgetWrapper>
      <div
        ref={embedRef}
        className={styles.embed}
        style={{ width, height, ...chromeVars }}
      >
        <div className={styles.header}>
          <span className={styles.headerIcon}><CollageFrameIcon size={16} /></span>
          <span className={styles.headerTitle}>{prototypeTitle}</span>
        </div>
        {editing ? (
          <div
            className={styles.pickerPanel}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {hasPicker && (
              <>
                <div className={styles.pickerHeader}>
                  <span className={styles.urlLabel}>Pick a prototype</span>
                  <button type="button" className={styles.urlCancel} onClick={handleCancelEdit} aria-label="Cancel">✕</button>
                </div>
                <input
                  ref={filterRef}
                  className={styles.filterInput}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter…"
                  onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }}
                />
                <div className={styles.pickerList} role="listbox">
                  {filteredGroups.map((group) => (
                    <div key={group.label} className={styles.pickerGroup}>
                      {group.items.length === 1 && group.items[0].name === group.label ? (
                        <button className={styles.pickerItem} role="option" onClick={() => handlePickRoute(group.items[0].route)}>
                          {group.label}
                        </button>
                      ) : (
                        <>
                          <div className={styles.pickerGroupLabel}>{group.label}</div>
                          {group.items.map((item) => (
                            <button key={item.route} className={styles.pickerItem} role="option" onClick={() => handlePickRoute(item.route)}>
                              {item.name}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                  {filteredGroups.length === 0 && <div className={styles.pickerEmpty}>No matches</div>}
                </div>
                <div className={styles.pickerDivider} />
              </>
            )}
            <form className={styles.customUrlSection} onSubmit={handleSubmit}>
              <label className={styles.urlLabel}>{hasPicker ? 'Or enter a custom URL' : 'Prototype URL path'}</label>
              <input ref={inputRef} className={styles.urlInput} type="text" defaultValue={src} placeholder="/MyPrototype/page" onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }} />
              <div className={styles.urlActions}>
                <button type="submit" className={styles.urlSave}>Save</button>
                {!hasPicker && <button type="button" className={styles.urlCancel} onClick={handleCancelEdit}>Cancel</button>}
              </div>
            </form>
          </div>
        ) : iframeSrc ? (
          <>
            <div
              ref={inlineContainerRef}
              className={styles.iframeContainer}
              style={expanded ? { visibility: 'hidden' } : undefined}
            >
              <iframe
                ref={iframeRef}
                src={effectiveSrc}
                className={styles.iframe}
                style={{
                  width: width / scale,
                  height: height / scale,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                }}
                title={`${prototypeTitle} prototype`}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={(e) => e.target.blur()}
              />
            </div>
            {!interactive && !expanded && (
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
                aria-label="Click to interact with prototype"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty} onClick={() => onUpdate && setEditing(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true) }}>
            <CollageFrameIcon size={36} />
            <p>Click to set prototype URL</p>
          </div>
        )}
      </div>
      {resizable && <ResizeHandle targetRef={embedRef} width={width} height={height} onResize={handleResize} />}
    </WidgetWrapper>
    {expanded && (
      <PrototypeExpandPane
        widgetId={widgetId}
        modalContainerRef={modalContainerRef}
        splitMode={expandMode === 'split'}
        immersive={expandMode === 'immersive'}
        closing={immersiveClosing}
        onClose={() => {
          // Reparent iframe back to inline BEFORE unmounting the portal
          const iframe = iframeRef.current
          if (iframe && inlineContainerRef.current) {
            if (iframe._savedClassName !== undefined) {
              iframe.className = iframe._savedClassName
              iframe.setAttribute('style', iframe._savedStyle)
              delete iframe._savedClassName
              delete iframe._savedStyle
            }
            const target = inlineContainerRef.current
            try {
              if (target.moveBefore) target.moveBefore(iframe, null)
              else target.appendChild(iframe)
            } catch { target.appendChild(iframe) }
          }
          setImmersiveClosing(false)
          setExpandMode(null)
          // Notify CanvasPage to clear fullscreen ref and restore chrome state
          document.dispatchEvent(new CustomEvent('storyboard:canvas:immersive-closed', {
            detail: { widgetId }
          }))
        }}
      />
    )}
    </>
  )
})

/**
 * Builds pane configs and renders ExpandedPane for an expanded prototype widget.
 * The primary pane is an external pane that receives the iframe via reparenting.
 */
function PrototypeExpandPane({ widgetId, modalContainerRef, splitMode, immersive, closing, onClose }) {
  const connectedWidgets = useMemo(
    () => splitMode ? findAllConnectedSplitTargets(widgetId) : [],
    [widgetId, splitMode],
  )
  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || { id: widgetId, type: 'prototype', position: { x: 0, y: 0 }, props: {} }
  }, [widgetId])

  const buildPaneFn = useCallback((widget) => {
    if (widget.id === widgetId) {
      return {
        id: widgetId,
        label: getSplitPaneLabel(primaryWidget),
        widgetType: 'prototype',
        kind: 'external',
        attach: (container) => {
          modalContainerRef.current = container
          return () => { modalContainerRef.current = null }
        },
      }
    }
    return buildPaneForWidget(widget)
  }, [widgetId, primaryWidget, modalContainerRef])

  const layout = useMemo(
    () => buildSplitLayout(primaryWidget, connectedWidgets, buildPaneFn),
    [primaryWidget, connectedWidgets, buildPaneFn],
  )

  const variant = immersive ? 'immersive' : (layout.flat().length <= 1 ? 'modal' : 'full')

  return (
    <ExpandedPane
      initialLayout={layout}
      variant={variant}
      closing={immersive ? closing : false}
      onClose={onClose}
    />
  )
}
