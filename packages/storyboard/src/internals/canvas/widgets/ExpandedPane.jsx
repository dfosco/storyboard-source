/**
 * ExpandedPane — unified full-screen expand/split-screen portal for canvas widgets.
 *
 * Supports two display variants for single-pane mode:
 *   - "modal" — 90vw × 90vh centered card (prototype, figma, markdown, link-preview)
 *   - "full"  — fixed inset 0, no border-radius (terminal, agent)
 *
 * Multi-pane (split-screen) always uses "full" layout with CSS grid columns.
 * Each column can contain 1 or 2 panes stacked vertically (row split).
 *
 * Layout is a 2D array: PaneConfig[][] where outer = columns, inner = rows.
 * Supports up to 2 columns × 2 rows (4 panes max).
 *
 * Each pane provides either:
 *   - kind: 'react' + render prop (for normal React content)
 *   - kind: 'external' + attach/detach (for imperative DOM like terminals/iframes)
 *
 * ExpandedPane owns container measurement and ResizeObserver. It notifies external
 * panes via onResize(rect) when their container dimensions change, so they don't
 * have to guess layout timing.
 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import ExpandedPaneTopBar from './ExpandedPaneTopBar.jsx'
import styles from './ExpandedPane.module.css'

const MIN_PANE_WIDTH_PX = 120
const MIN_PANE_HEIGHT_PX = 80

/**
 * @typedef {Object} ReactPane
 * @property {string} id — stable identifier (widgetId)
 * @property {string} label — display label for top bar
 * @property {'react'} kind
 * @property {() => React.ReactNode} render — returns React content for the pane
 */

/**
 * @typedef {Object} ExternalPane
 * @property {string} id — stable identifier (widgetId)
 * @property {string} label — display label for top bar
 * @property {'external'} kind
 * @property {(container: HTMLElement) => (() => void)} attach — mount into container, return detach
 * @property {(rect: DOMRect) => void} [onResize] — called when container resizes
 */

/**
 * @typedef {ReactPane | ExternalPane} PaneConfig
 */

/**
 * @param {Object} props
 * @param {PaneConfig[]} [props.initialPanes] — flat pane list (backward compat, each becomes a single-row column)
 * @param {PaneConfig[][]} [props.initialLayout] — 2D layout: outer = columns, inner = rows within column
 * @param {'modal' | 'full'} [props.variant='modal'] — single-pane display variant
 * @param {() => void} props.onClose — close callback
 * @param {((panes: PaneConfig[]) => void)} [props.onPanesChange] — notify parent of pane changes
 */
export default function ExpandedPane({ initialPanes, initialLayout, variant = 'modal', onClose }) {
  // Normalize to 2D layout: outer = columns, inner = rows
  const [layout, setLayout] = useState(() => {
    if (initialLayout) return initialLayout
    if (initialPanes) return initialPanes.map((p) => [p])
    return []
  })

  // Sync layout when initialLayout changes (preserves column/row sizes)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialLayout) setLayout(initialLayout)
  }, [initialLayout])

  // Force re-render when pane actions change (e.g. markdown edit toggle)
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1)
    document.addEventListener('storyboard:expanded-pane:refresh', handler)
    return () => document.removeEventListener('storyboard:expanded-pane:refresh', handler)
  }, [])

  const allPanes = useMemo(() => layout.flat(), [layout])

  const [columnSizes, setColumnSizes] = useState(() => layout.map(() => '1fr'))
  // Row ratios per column: rowRatios[colIdx] = [ratio, ratio, ...] (flex values)
  const [rowRatios, setRowRatios] = useState(() =>
    layout.map((col) => col.map(() => 1)),
  )
  const [, setActivePaneId] = useState(null)

  // Ref map: paneId → container DOM element (callback refs)
  const containerRefs = useRef(new Map())
  // Ref map: paneId → detach cleanup function
  const detachRefs = useRef(new Map())
  // Ref map: paneId → ResizeObserver
  const observerRefs = useRef(new Map())

  const totalPanes = allPanes.length
  const isSplit = totalPanes >= 2

  // ── External pane attach/detach via useLayoutEffect ──
  useLayoutEffect(() => {
    for (const pane of allPanes) {
      if (pane.kind !== 'external') continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      if (detachRefs.current.has(pane.id)) continue
      const detach = pane.attach(container)
      detachRefs.current.set(pane.id, detach)
    }
    return () => {
      for (const [, detach] of detachRefs.current) {
        detach?.()
      }
      detachRefs.current.clear()
    }
    // intentional mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle pane list changes: attach new external panes, detach removed ones
  useLayoutEffect(() => {
    const currentIds = new Set(allPanes.map((p) => p.id))

    for (const [id, detach] of detachRefs.current) {
      if (!currentIds.has(id)) {
        detach?.()
        detachRefs.current.delete(id)
        observerRefs.current.get(id)?.disconnect()
        observerRefs.current.delete(id)
      }
    }

    for (const pane of allPanes) {
      if (pane.kind !== 'external') continue
      if (detachRefs.current.has(pane.id)) continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      const detach = pane.attach(container)
      detachRefs.current.set(pane.id, detach)
    }
  }) // runs every render to catch pane changes

  // ── ResizeObserver per external pane ──
  useEffect(() => {
    for (const pane of allPanes) {
      if (pane.kind !== 'external' || !pane.onResize) continue
      if (observerRefs.current.has(pane.id)) continue
      const container = containerRefs.current.get(pane.id)
      if (!container) continue
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          pane.onResize(entry.contentRect)
        }
      })
      ro.observe(container)
      observerRefs.current.set(pane.id, ro)
    }
    return () => {
      for (const ro of observerRefs.current.values()) {
        ro.disconnect()
      }
      observerRefs.current.clear()
    }
  }, [allPanes])

  // ── Callback ref factory: stable per pane id ──
  const getContainerRef = useCallback((paneId) => (el) => {
    if (el) {
      containerRefs.current.set(paneId, el)
    } else {
      containerRefs.current.delete(paneId)
    }
  }, [])

  // ── Escape to close ──
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose])

  // ── Column drag-to-resize dividers ──
  const dragState = useRef(null)

  const handleColumnDividerPointerDown = useCallback((e, dividerIndex) => {
    e.preventDefault()
    const gridEl = e.target.closest(`.${styles.grid}`)
    if (!gridEl) return

    const currentCols = Array.from(gridEl.children)
      .filter((el) => !el.classList.contains(styles.divider))
      .map((el) => el.getBoundingClientRect().width)

    dragState.current = {
      kind: 'column',
      dividerIndex,
      startX: e.clientX,
      startWidths: currentCols,
    }

    function handleMove(ev) {
      if (!dragState.current || dragState.current.kind !== 'column') return
      const { dividerIndex: di, startX, startWidths } = dragState.current
      const dx = ev.clientX - startX
      const leftW = Math.max(MIN_PANE_WIDTH_PX, startWidths[di] + dx)
      const rightW = Math.max(MIN_PANE_WIDTH_PX, startWidths[di + 1] - dx)
      const newWidths = [...startWidths]
      newWidths[di] = leftW
      newWidths[di + 1] = rightW
      const total = newWidths.reduce((a, b) => a + b, 0)
      setColumnSizes(newWidths.map((w) => `${((w / total) * layout.length).toFixed(3)}fr`))
    }

    function handleUp() {
      dragState.current = null
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [layout.length])

  // ── Row drag-to-resize dividers (vertical splits within a column) ──
  const handleRowDividerPointerDown = useCallback((e, colIndex) => {
    e.preventDefault()
    const columnEl = e.target.closest(`.${styles.column}`)
    if (!columnEl) return

    const paneEls = Array.from(columnEl.children).filter(
      (el) => !el.classList.contains(styles.rowDivider),
    )
    const startHeights = paneEls.map((el) => el.getBoundingClientRect().height)

    dragState.current = {
      kind: 'row',
      colIndex,
      startY: e.clientY,
      startHeights,
    }

    function handleMove(ev) {
      if (!dragState.current || dragState.current.kind !== 'row') return
      const { colIndex: ci, startY, startHeights: sh } = dragState.current
      const dy = ev.clientY - startY
      const topH = Math.max(MIN_PANE_HEIGHT_PX, sh[0] + dy)
      const bottomH = Math.max(MIN_PANE_HEIGHT_PX, sh[1] - dy)
      const total = topH + bottomH
      setRowRatios((prev) => {
        const next = [...prev]
        next[ci] = [topH / total, bottomH / total]
        return next
      })
    }

    function handleUp() {
      dragState.current = null
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [])

  // ── Build grid-template-columns ──
  const gridTemplateColumns = useMemo(() => {
    if (layout.length < 2) return undefined
    const parts = []
    for (let i = 0; i < columnSizes.length; i++) {
      if (i > 0) parts.push('0px')
      parts.push(columnSizes[i])
    }
    return parts.join(' ')
  }, [layout.length, columnSizes])

  // ── Render pane content ──
  function renderPaneContent(pane) {
    if (pane.kind === 'react') {
      return (
        <div
          ref={getContainerRef(pane.id)}
          className={styles.paneContent}
          onPointerDown={() => setActivePaneId(pane.id)}
        >
          {pane.render()}
        </div>
      )
    }
    return (
      <div
        ref={getContainerRef(pane.id)}
        className={styles.paneContent}
        onPointerDown={() => setActivePaneId(pane.id)}
      />
    )
  }

  // ── Render a single column (1 or 2 panes stacked) ──
  function renderColumn(column, colIndex, isLastCol) {
    if (column.length === 1) {
      const pane = column[0]
      return (
        <div className={styles.pane} key={pane.id}>
          <ExpandedPaneTopBar
            label={pane.label}
            widgetType={pane.widgetType}
            actions={pane.actions}
            features={pane.features}
            getState={pane.getState}
            onAction={pane.onAction}
            showClose={isLastCol}
            onClose={onClose}
          />
          {renderPaneContent(pane)}
        </div>
      )
    }

    // Multi-row column
    const ratios = rowRatios[colIndex] || column.map(() => 1)
    return (
      <div className={styles.column} key={`col-${colIndex}`}>
        {column.map((pane, rowIdx) => (
          <PaneWithRowDivider
            key={pane.id}
            pane={pane}
            flex={ratios[rowIdx] ?? 1}
            isLast={rowIdx === column.length - 1}
            colIndex={colIndex}
            onRowDividerPointerDown={handleRowDividerPointerDown}
          >
            <ExpandedPaneTopBar
              label={pane.label}
              widgetType={pane.widgetType}
              actions={pane.actions}
              features={pane.features}
              getState={pane.getState}
              onAction={pane.onAction}
              showClose={isLastCol && rowIdx === 0}
              onClose={onClose}
            />
            {renderPaneContent(pane)}
          </PaneWithRowDivider>
        ))}
      </div>
    )
  }

  // ── Single-pane modal variant ──
  if (!isSplit && variant === 'modal') {
    const pane = allPanes[0]
    if (!pane) return null
    return createPortal(
      <div
        className={styles.backdrop}
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          <ExpandedPaneTopBar
            label={pane.label}
            widgetType={pane.widgetType}
            actions={pane.actions}
            features={pane.features}
            getState={pane.getState}
            onAction={pane.onAction}
            showClose
            onClose={onClose}
          />
          <div className={styles.modalBody}>
            {renderPaneContent(pane)}
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ── Full layout (single-pane full or multi-pane split) ──
  return createPortal(
    <div
      className={styles.fullContainer}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {isSplit ? (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns }}
        >
          {layout.map((column, colIdx) => {
            const isLastCol = colIdx === layout.length - 1
            return (
              <ColumnWithDivider
                key={`col-${colIdx}`}
                colIndex={colIdx}
                isLast={isLastCol}
                onDividerPointerDown={handleColumnDividerPointerDown}
              >
                {renderColumn(column, colIdx, isLastCol)}
              </ColumnWithDivider>
            )
          })}
        </div>
      ) : (
        <>
          <ExpandedPaneTopBar
            label={allPanes[0]?.label}
            widgetType={allPanes[0]?.widgetType}
            actions={allPanes[0]?.actions}
            features={allPanes[0]?.features}
            getState={allPanes[0]?.getState}
            onAction={allPanes[0]?.onAction}
            showClose
            onClose={onClose}
          />
          <div className={styles.singleFull}>
            {renderPaneContent(allPanes[0])}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

/**
 * Wraps a column cell in the grid, optionally followed by a vertical divider.
 */
function ColumnWithDivider({ colIndex, isLast, onDividerPointerDown, children }) {
  return (
    <>
      {children}
      {!isLast && (
        <div
          className={styles.divider}
          onPointerDown={(e) => onDividerPointerDown(e, colIndex)}
          role="separator"
          aria-orientation="vertical"
        />
      )}
    </>
  )
}

/**
 * Renders a pane within a row-split column, optionally followed by a horizontal row divider.
 */
function PaneWithRowDivider({ flex, isLast, colIndex, onRowDividerPointerDown, children }) {
  return (
    <>
      <div className={styles.pane} style={{ flex }}>
        {children}
      </div>
      {!isLast && (
        <div
          className={styles.rowDivider}
          onPointerDown={(e) => onRowDividerPointerDown(e, colIndex)}
          role="separator"
          aria-orientation="horizontal"
        />
      )}
    </>
  )
}
