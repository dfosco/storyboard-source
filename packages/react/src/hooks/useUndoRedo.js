import { useCallback, useSyncExternalStore } from 'react'
import { undo, redo, canUndo, canRedo } from '@storyboard/core'
import { subscribeToStorage, getStorageSnapshot } from '@storyboard/core'
import { subscribeToHash, getHashSnapshot } from '@storyboard/core'

/**
 * Undo/redo controls for override history.
 *
 * Every override write (via useOverride) pushes a snapshot to the history
 * stack. This hook exposes navigation through that stack.
 *
 * @returns {{ undo: function, redo: function, canUndo: boolean, canRedo: boolean }}
 */
export function useUndoRedo() {
  // Re-render on storage or hash changes
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  useSyncExternalStore(subscribeToHash, getHashSnapshot)

  const handleUndo = useCallback(() => undo(), [])
  const handleRedo = useCallback(() => redo(), [])

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
