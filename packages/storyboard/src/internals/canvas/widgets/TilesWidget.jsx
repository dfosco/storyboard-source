import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { readProp } from './widgetProps.js'
import { schemas } from './widgetConfig.js'
import { TILE_POOL } from './tilePool.js'
import styles from './TilesWidget.module.css'

const tilesSchema = schemas['tiles']
const LS_PREFIX = 'storyboard-tiles-'

/** Read persisted state from localStorage for a given widget ID. */
function loadFromStorage(widgetId) {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${widgetId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/** Save state to localStorage for a given widget ID. */
function saveToStorage(widgetId, state) {
  try {
    localStorage.setItem(`${LS_PREFIX}${widgetId}`, JSON.stringify(state))
  } catch { /* quota exceeded — silently ignore */ }
}

/**
 * Canvas widget that arranges square images in an interactive tile grid.
 *
 * Uses a static pool of tile images bundled with the widget (see tilePool.js).
 * In production, state is persisted to localStorage since canvas editing is read-only.
 *
 * Features:
 * - Configurable columns × rows (toolbar actions in dev, inline buttons in prod)
 * - Drag & drop reorder
 * - Click-select + Cmd+C / Cmd+V to copy-paste tiles
 * - Randomize action
 * - Tile composition persisted as indexes into TILE_POOL
 */
const TilesWidget = forwardRef(function TilesWidget({ id, props, onUpdate, resizable }, ref) {
  const containerRef = useRef(null)
  const isProd = !onUpdate

  // In prod, load initial state from localStorage
  const [localState, setLocalState] = useState(() => loadFromStorage(id))

  const columns = (isProd ? localState?.columns : null) ?? (readProp(props, 'columns', tilesSchema) || 3)
  const rows = (isProd ? localState?.rows : null) ?? (readProp(props, 'rows', tilesSchema) || 3)
  const tileSize = readProp(props, 'tileSize', tilesSchema) || 80
  const savedTiles = (isProd ? localState?.tiles : null) ?? readProp(props, 'tiles', tilesSchema)

  // Local state for interactions
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [copiedSrc, setCopiedSrc] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  // Clear selection when exiting interact mode (dev only — prod has no gate)
  useEffect(() => {
    if (isProd) return
    const el = containerRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      const slot = el.closest('[data-widget-interacting]')
      if (!slot) {
        setSelectedIdx(null)
        setCopiedSrc(null)
      }
    })
    const slot = el.closest('[data-widget-selected]')?.parentElement
    if (slot) observer.observe(slot, { attributes: true, attributeFilter: ['data-widget-interacting'] })
    return () => observer.disconnect()
  }, [isProd])

  // Build effective tile list from saved indexes or default pool
  const tiles = useMemo(() => {
    if (savedTiles && savedTiles.length > 0) {
      return savedTiles.map((idx) =>
        typeof idx === 'number' ? (TILE_POOL[idx] ?? TILE_POOL[0]) : TILE_POOL[0]
      )
    }
    return [...TILE_POOL]
  }, [savedTiles])

  // Total visible slots
  const slotCount = columns * rows
  const visibleTiles = tiles.slice(0, slotCount)

  // Pad with nulls if we have fewer images than slots
  const grid = useMemo(() => {
    const g = [...visibleTiles]
    while (g.length < slotCount) g.push(null)
    return g
  }, [visibleTiles, slotCount])

  // Persist — writes to onUpdate (dev) or localStorage (prod)
  const persist = useCallback((patch) => {
    if (isProd) {
      setLocalState((prev) => {
        const next = { ...prev, ...patch }
        saveToStorage(id, next)
        return next
      })
    } else {
      onUpdate?.(patch)
    }
  }, [isProd, id, onUpdate])

  const persistTiles = useCallback((srcs) => {
    const indexes = srcs.map((src) => {
      const idx = TILE_POOL.indexOf(src)
      return idx >= 0 ? idx : 0
    })
    persist({ tiles: indexes })
  }, [persist])

  // ── Actions (shared by toolbar handleAction and inline buttons) ──
  const addColumn = useCallback(() => persist({ columns: columns + 1 }), [columns, persist])
  const removeColumn = useCallback(() => { if (columns > 1) persist({ columns: columns - 1 }) }, [columns, persist])
  const addRow = useCallback(() => persist({ rows: rows + 1 }), [rows, persist])
  const removeRow = useCallback(() => { if (rows > 1) persist({ rows: rows - 1 }) }, [rows, persist])
  const randomize = useCallback(() => {
    const total = columns * rows
    const filled = Array.from({ length: total }, () =>
      TILE_POOL[Math.floor(Math.random() * TILE_POOL.length)]
    )
    persistTiles(filled)
  }, [columns, rows, persistTiles])

  // ── Keyboard: Cmd+C / Cmd+V ──
  useEffect(() => {
    function handleKeyDown(e) {
      const el = containerRef.current
      if (!el) return
      // In dev, only respond when interacting; in prod, always respond when focused
      if (!isProd) {
        const slot = el.closest('[data-widget-interacting]')
        if (!slot) return
      }

      if (!e.metaKey && !e.ctrlKey) return
      if (e.key === 'c' && selectedIdx !== null && grid[selectedIdx]) {
        e.stopPropagation()
        e.preventDefault()
        setCopiedSrc(grid[selectedIdx])
      }
      if (e.key === 'v' && selectedIdx !== null && copiedSrc) {
        e.stopPropagation()
        e.preventDefault()
        const newGrid = [...grid]
        newGrid[selectedIdx] = copiedSrc
        persistTiles(newGrid.filter(Boolean))
        setCopiedSrc(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [selectedIdx, copiedSrc, grid, persistTiles, isProd])

  // ── Drag & drop handlers ──
  const handleDragStart = useCallback((e, idx) => {
    e.stopPropagation()
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }, [])

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIdx(null)
  }, [])

  const handleDrop = useCallback((e, toIdx) => {
    e.preventDefault()
    e.stopPropagation()
    const fromIdx = dragIdx
    setDragIdx(null)
    setDragOverIdx(null)
    if (fromIdx === null || fromIdx === toIdx) return
    const newGrid = [...grid]
    ;[newGrid[fromIdx], newGrid[toIdx]] = [newGrid[toIdx], newGrid[fromIdx]]
    persistTiles(newGrid.filter(Boolean))
  }, [dragIdx, grid, persistTiles])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  // ── Tile click ──
  const handleTileClick = useCallback((e, idx) => {
    e.stopPropagation()
    setSelectedIdx((prev) => (prev === idx ? null : idx))
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedIdx(null)
  }, [])

  // ── Widget actions (dev toolbar) ──
  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'add-column') { addColumn(); return true }
      if (actionId === 'remove-column') { removeColumn(); return true }
      if (actionId === 'add-row') { addRow(); return true }
      if (actionId === 'remove-row') { removeRow(); return true }
      if (actionId === 'randomize') { randomize(); return true }
    },
  }), [addColumn, removeColumn, addRow, removeRow, randomize])

  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, ${tileSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
    gap: '2px',
  }

  return (
    <WidgetWrapper>
      <div
        ref={containerRef}
        className={styles.container}
        onClick={handleBackgroundClick}
        data-tiles-widget
      >
        {isProd && (
          <div className={styles.toolbar}>
            <button className={styles.toolbarBtn} onClick={(e) => { e.stopPropagation(); randomize() }} title="Randomize">🔀</button>
            <span className={styles.toolbarSep} />
            <button className={styles.toolbarBtn} onClick={(e) => { e.stopPropagation(); removeColumn() }} title="Remove column" disabled={columns <= 1}>−</button>
            <span className={styles.toolbarLabel}>{columns}×{rows}</span>
            <button className={styles.toolbarBtn} onClick={(e) => { e.stopPropagation(); addColumn() }} title="Add column">+</button>
            <span className={styles.toolbarSep} />
            <button className={styles.toolbarBtn} onClick={(e) => { e.stopPropagation(); removeRow() }} title="Remove row" disabled={rows <= 1}>↑</button>
            <button className={styles.toolbarBtn} onClick={(e) => { e.stopPropagation(); addRow() }} title="Add row">↓</button>
          </div>
        )}
        <div className={styles.grid} style={gridStyle}>
          {grid.map((src, idx) => (
            <div
              key={`${idx}-${src || 'empty'}`}
              className={[
                styles.tile,
                selectedIdx === idx ? styles.selected : '',
                copiedSrc && selectedIdx === idx ? styles.pasteTarget : '',
                dragOverIdx === idx ? styles.dragOver : '',
                dragIdx === idx ? styles.dragging : '',
              ].filter(Boolean).join(' ')}
              draggable={!!src}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={(e) => handleTileClick(e, idx)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ width: tileSize, height: tileSize }}
            >
              {src ? (
                <img
                  src={src}
                  alt=""
                  className={styles.tileImage}
                  draggable={false}
                />
              ) : (
                <span className={styles.emptyTile} />
              )}
              {copiedSrc && selectedIdx === idx && (
                <span className={styles.pasteHint}>⌘V</span>
              )}
            </div>
          ))}
        </div>
        {selectedIdx !== null && grid[selectedIdx] && !copiedSrc && (
          <div className={styles.hint}>⌘C to copy · click another tile · ⌘V to paste</div>
        )}
        {copiedSrc && selectedIdx !== null && (
          <div className={styles.hint}>⌘V to replace this tile</div>
        )}
        {resizable && (
          <ResizeHandle
            targetRef={containerRef}
            minWidth={200}
            minHeight={100}
            onResize={(w, h) => onUpdate?.({ width: w, height: h })}
          />
        )}
      </div>
    </WidgetWrapper>
  )
})

export default TilesWidget
