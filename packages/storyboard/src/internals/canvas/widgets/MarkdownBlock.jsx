import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { readProp } from './widgetProps.js'
import { schemas, getFeaturesForSurface } from './widgetConfig.js'
import ExpandedPane from './ExpandedPane.jsx'
import { findAllConnectedSplitTargets, getSplitPaneLabel, buildPaneForWidget, buildSplitLayout } from './expandUtils.js'
import { useExpandOverride } from './useExpandOverride.js'
import styles from './MarkdownBlock.module.css'

const markdownSchema = schemas['markdown']

/**
 * Renders markdown to HTML using remark with GitHub Flavored Markdown support.
 */
function renderMarkdown(text) {
  if (!text) return ''
  const result = remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .processSync(text)
  // Open all links in new tabs
  return String(result).replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
}

/**
 * Post-process rendered HTML to syntax-highlight fenced code blocks.
 * remark-html outputs <pre><code class="language-xxx">...</code></pre>.
 * We replace the code content with highlight.js output.
 */
let hljsPromise = null
function getHljs() {
  if (!hljsPromise) {
    hljsPromise = import('../../../core/inspector/highlighter.js').then((mod) => mod)
  }
  return hljsPromise
}

async function highlightCodeBlocks(html) {
  if (!html.includes('<code class="language-')) return html
  const { createInspectorHighlighter } = await getHljs()
  const hl = await createInspectorHighlighter()
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, lang, code) => {
      try {
        // Decode all HTML entities that remark-html may produce
        const decoded = code
          .replace(/&#x3C;/gi, '<')
          .replace(/&#x3E;/gi, '>')
          .replace(/&#x26;/gi, '&')
          .replace(/&#x22;/gi, '"')
          .replace(/&#x27;/gi, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
        // codeToHtml returns a full <pre style="bg;fg"><code>...</code></pre>
        return hl.codeToHtml(decoded, { lang })
      } catch {
        return match
      }
    }
  )
}

export default forwardRef(function MarkdownBlock({ id, props, onUpdate, resizable }, ref) {
  const content = readProp(props, 'content', markdownSchema)
  const width = readProp(props, 'width', markdownSchema)
  const height = props?.height
  const collapsed = !!props?.collapsed
  const canEdit = typeof onUpdate === 'function'
  const [editing, setEditing] = useState(false)
  const [expandMode, setExpandMode] = useExpandOverride('markdown', id)
  const expanded = expandMode !== null
  const editingActive = canEdit && editing
  const textareaRef = useRef(null)
  const blockRef = useRef(null)
  const [editHeight, setEditHeight] = useState(null)

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'expand' || actionId === 'expand-single') { setExpandMode('single'); return true }
      if (actionId === 'split-screen') { setExpandMode('split'); return true }
      return false
    },
  }), [])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  const rawHtml = useMemo(() => renderMarkdown(content), [content])
  const [renderedHtml, setRenderedHtml] = useState(rawHtml)

  // Re-highlight when theme changes
  const [themeKey, setThemeKey] = useState(0)
  useEffect(() => {
    function onThemeChanged() { setThemeKey((k) => k + 1) }
    document.addEventListener('storyboard:theme:changed', onThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', onThemeChanged)
  }, [])

  // Async-highlight code blocks after initial render or theme change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderedHtml(rawHtml)
    if (!rawHtml.includes('<code class="language-')) return
    let cancelled = false
    highlightCodeBlocks(rawHtml).then((highlighted) => {
      if (!cancelled) setRenderedHtml(highlighted)
    })
    return () => { cancelled = true }
  }, [rawHtml, themeKey])

  const handleContentChange = useCallback((e) => {
    onUpdate?.({ content: e.target.value })
  }, [onUpdate])

  const handleReadOnlyCopy = useCallback((e) => {
    if (canEdit) return
    e.preventDefault()
    e.stopPropagation()
    if (e.clipboardData?.setData) {
      e.clipboardData.setData('text/plain', content || '')
    }
  }, [canEdit, content])

  const startEditing = useCallback(() => {
    // Capture the preview height BEFORE React swaps to the textarea
    if (blockRef.current) {
      setEditHeight(blockRef.current.offsetHeight)
      blockRef.current.dataset.scrollTop = blockRef.current.scrollTop
    }
    setEditing(true)
  }, [])

  useEffect(() => {
    if (editingActive) {
      if (textareaRef.current) {
        // Place cursor at end and prevent scroll jump to top
        const len = textareaRef.current.value.length
        textareaRef.current.setSelectionRange(len, len)
        textareaRef.current.focus({ preventScroll: true })
        // Restore the block's scroll position (captured before React swapped the DOM)
        if (blockRef.current) {
          blockRef.current.scrollTop = blockRef.current.dataset.scrollTop || 0
        }
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditHeight(null)
    }
  }, [editingActive])

  return (
    <>
    <WidgetWrapper>
      <div
        ref={blockRef}
        className={`${styles.block}${collapsed && !editingActive ? ` ${styles.blockCollapsed}` : ''}`}
        style={{
          width,
          ...(height ? { height, overflow: 'auto' } : {}),
          ...(editHeight ? { height: editHeight, display: 'flex', flexDirection: 'column' } : {}),
        }}
      >
        {editingActive ? (
          <textarea
            ref={textareaRef}
            className={styles.editor}
            data-canvas-allow-text-selection
            style={{ flex: 1 }}
            value={content}
            onChange={handleContentChange}
            onBlur={() => setEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Write markdown…"
          />
        ) : (
          <div
            className={styles.preview}
            style={!canEdit ? { cursor: 'default' } : undefined}
            data-canvas-allow-text-selection={!canEdit ? '' : undefined}
            onClick={!canEdit ? (e) => e.stopPropagation() : undefined}
            onCopy={!canEdit ? handleReadOnlyCopy : undefined}
            onDoubleClick={canEdit ? startEditing : undefined}
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onKeyDown={canEdit ? (e) => {
              if (e.key === 'Enter') startEditing()
            } : undefined}
            dangerouslySetInnerHTML={{
              __html: renderedHtml || (canEdit
                ? '<p class="placeholder">Double-click to edit…</p>'
                : '<p class="placeholder">No content</p>'),
            }}
          />
        )}
        {resizable && (
          <ResizeHandle
            targetRef={blockRef}
            minWidth={200}
            minHeight={60}
            onResize={handleResize}
          />
        )}
      </div>
    </WidgetWrapper>
    {expanded && (
      <MarkdownExpandPane
        widgetId={id}
        content={content}
        splitMode={expandMode === 'split'}
        onClose={() => setExpandMode(null)}
        onUpdate={onUpdate}
      />
    )}
    </>
  )
})

/**
 * Builds pane configs and renders ExpandedPane for an expanded markdown widget.
 */
function MarkdownExpandPane({ widgetId, content, splitMode, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const canEdit = typeof onUpdate === 'function'

  const connectedWidgets = useMemo(
    () => splitMode ? findAllConnectedSplitTargets(widgetId) : [],
    [widgetId, splitMode],
  )
  const primaryWidget = useMemo(() => {
    const bridge = window.__storyboardCanvasBridgeState
    return bridge?.widgets?.find((w) => w.id === widgetId) || { id: widgetId, type: 'markdown', position: { x: 0, y: 0 }, props: {} }
  }, [widgetId])

  // Surface: fullbar for single expand, splitbar for split
  const surface = splitMode ? 'splitbar' : 'fullbar'
  const surfaceFeatures = useMemo(
    () => canEdit ? getFeaturesForSurface('markdown', surface) : [],
    [canEdit, surface],
  )

  const getState = useCallback((key) => {
    if (key === 'editing') return editing
    return undefined
  }, [editing])

  const handleAction = useCallback((actionId) => {
    if (actionId === 'toggle-edit') {
      setEditing((v) => !v)
    }
  }, [])

  const buildPaneFn = useCallback((widget) => {
    if (widget.id === widgetId) {
      return {
        id: widgetId,
        label: getSplitPaneLabel(primaryWidget) || 'Markdown',
        widgetType: 'markdown',
        kind: 'react',
        features: surfaceFeatures,
        getState,
        onAction: handleAction,
        render: () => (
          <ExpandedMarkdownEditor
            content={content}
            onUpdate={onUpdate}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
          />
        ),
      }
    }
    return buildPaneForWidget(widget, surface)
  }, [widgetId, primaryWidget, content, onUpdate, editing, surfaceFeatures, getState, handleAction, surface])

  const layout = useMemo(
    () => buildSplitLayout(primaryWidget, connectedWidgets, buildPaneFn),
    [primaryWidget, connectedWidgets, buildPaneFn],
  )

  return (
    <ExpandedPane
      initialLayout={layout}
      variant={layout.flat().length <= 1 ? 'modal' : 'full'}
      onClose={onClose}
    />
  )
}

/**
 * Editable markdown view for expanded/split-screen panes.
 * Self-contained: renders markdown from raw content with syntax highlighting.
 * Editing state is controlled externally via props (toggle button lives in the title bar).
 */
export function ExpandedMarkdownEditor({ content, onUpdate, editing, onToggleEdit }) {
  const textareaRef = useRef(null)
  const canEdit = typeof onUpdate === 'function'

  const rawHtml = useMemo(() => renderMarkdown(content), [content])
  const [renderedHtml, setRenderedHtml] = useState(rawHtml)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderedHtml(rawHtml)
    if (!rawHtml.includes('<code class="language-')) return
    let cancelled = false
    highlightCodeBlocks(rawHtml).then((highlighted) => {
      if (!cancelled) setRenderedHtml(highlighted)
    })
    return () => { cancelled = true }
  }, [rawHtml])

  useEffect(() => {
    if (editing && textareaRef.current) {
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
      textareaRef.current.focus({ preventScroll: true })
    }
  }, [editing])

  if (editing && canEdit) {
    return (
      <div className={styles.expandedEditorWrap}>
        <textarea
          ref={textareaRef}
          className={styles.expandedEditor}
          value={content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Escape') onToggleEdit?.() }}
          placeholder="Write markdown…"
        />
      </div>
    )
  }

  return (
    <div
      className={styles.expandedPreview}
      style={{ flex: 1, overflow: 'auto' }}
      onDoubleClick={canEdit ? onToggleEdit : undefined}
      dangerouslySetInnerHTML={{
        __html: renderedHtml || '<p>No content</p>',
      }}
    />
  )
}
