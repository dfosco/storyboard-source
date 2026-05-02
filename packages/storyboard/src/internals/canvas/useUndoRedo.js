import { useRef, useState, useCallback } from 'react'

const MAX_HISTORY = 100
const COALESCE_MS = 2000

/**
 * Snapshot-based undo/redo history for canvas widgets.
 *
 * Tracks past/future stacks of widget array clones. The present state
 * is always the live `localWidgets` — this hook only manages history.
 *
 * Edit coalescing: continuous edits to the same widget within COALESCE_MS
 * are merged into one undo step (like Figma).
 */
export default function useUndoRedo() {
  const pastRef = useRef([])
  const futureRef = useRef([])
  const lastActionRef = useRef({ type: null, widgetId: null, time: 0 })
  // State counter drives canUndo/canRedo re-renders without cloning the stacks
  const [counts, setCounts] = useState({ past: 0, future: 0 })

  const snapshot = useCallback((currentWidgets, actionType, widgetId) => {
    const widgets = currentWidgets ?? []

    // Edit coalescing — skip snapshot if same edit target within timeout
    if (actionType === 'edit' && widgetId) {
      const last = lastActionRef.current
      const now = Date.now()
      if (
        last.type === 'edit' &&
        last.widgetId === widgetId &&
        now - last.time < COALESCE_MS
      ) {
        lastActionRef.current = { type: 'edit', widgetId, time: now }
        return
      }
    }

    pastRef.current.push(structuredClone(widgets))
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
    futureRef.current = []
    lastActionRef.current = {
      type: actionType,
      widgetId: widgetId || null,
      time: Date.now(),
    }
    setCounts({ past: pastRef.current.length, future: 0 })
  }, [])

  const undo = useCallback((currentWidgets) => {
    if (pastRef.current.length === 0) return null
    futureRef.current.push(structuredClone(currentWidgets))
    const previous = pastRef.current.pop()
    lastActionRef.current = { type: 'undo', widgetId: null, time: Date.now() }
    setCounts({ past: pastRef.current.length, future: futureRef.current.length })
    return previous
  }, [])

  const redo = useCallback((currentWidgets) => {
    if (futureRef.current.length === 0) return null
    pastRef.current.push(structuredClone(currentWidgets))
    const next = futureRef.current.pop()
    lastActionRef.current = { type: 'redo', widgetId: null, time: Date.now() }
    setCounts({ past: pastRef.current.length, future: futureRef.current.length })
    return next
  }, [])

  const reset = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    lastActionRef.current = { type: null, widgetId: null, time: 0 }
    setCounts((prev) => {
      if (prev.past === 0 && prev.future === 0) return prev
      return { past: 0, future: 0 }
    })
  }, [])

  return {
    snapshot,
    undo,
    redo,
    reset,
    canUndo: counts.past > 0,
    canRedo: counts.future > 0,
  }
}
