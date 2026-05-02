import { useState, useRef, useEffect, useCallback } from 'react'
import { readProp, stickyNoteSchema } from './widgetProps.js'
import ResizeHandle from './ResizeHandle.jsx'
import styles from './StickyNote.module.css'

const COLORS = {
  yellow: { bg: '#fff8c5', border: '#d4a72c', dot: '#e8c846' },
  blue: { bg: '#ddf4ff', border: '#54aeff', dot: '#74b9ff' },
  green: { bg: '#dafbe1', border: '#4ac26b', dot: '#6dd58c' },
  pink: { bg: '#ffebe9', border: '#ff8182', dot: '#ff9a9e' },
  purple: { bg: '#fbefff', border: '#c297ff', dot: '#d4a8ff' },
  orange: { bg: '#fff1e5', border: '#d18616', dot: '#e8a844' },
}

export default function StickyNote({ props, onUpdate, resizable }) {
  const text = readProp(props, 'text', stickyNoteSchema)
  const color = readProp(props, 'color', stickyNoteSchema)
  const width = readProp(props, 'width', stickyNoteSchema)
  const height = readProp(props, 'height', stickyNoteSchema)
  const canEdit = typeof onUpdate === 'function'
  const palette = COLORS[color] ?? COLORS.yellow
  const textareaRef = useRef(null)
  const stickyRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const editingActive = canEdit && editing

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

  useEffect(() => {
    if (editingActive && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [editingActive])

  const handleTextChange = useCallback((e) => {
    onUpdate?.({ text: e.target.value })
  }, [onUpdate])

  return (
    <div className={styles.container}>
      <article
        ref={stickyRef}
        className={styles.sticky}
        style={{
          '--sticky-bg': palette.bg,
          '--sticky-border': palette.border,
          ...(typeof width === 'number' ? { width: `${width}px` } : undefined),
          ...(typeof height === 'number' ? { height: `${height}px` } : undefined),
        }}
      >
        <p
          className={styles.text}
          style={editingActive ? { visibility: 'hidden' } : undefined}
          data-canvas-allow-text-selection={!canEdit ? '' : undefined}
          onDoubleClick={canEdit ? () => setEditing(true) : undefined}
          role={canEdit ? 'button' : undefined}
          tabIndex={canEdit ? 0 : undefined}
          onKeyDown={canEdit ? (e) => { if (e.key === 'Enter') setEditing(true) } : undefined}
        >
          {text || (canEdit ? 'Double-click to edit…' : 'No content')}
        </p>
        {editingActive && (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            data-canvas-allow-text-selection
            value={text}
            onChange={handleTextChange}
            onBlur={() => setEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="Type here…"
          />
        )}
        {resizable && (
          <ResizeHandle
            targetRef={stickyRef}
            minWidth={180}
            minHeight={60}
            onResize={handleResize}
          />
        )}
      </article>
    </div>
  )
}
