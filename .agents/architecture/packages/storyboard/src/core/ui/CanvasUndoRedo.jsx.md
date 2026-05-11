# `packages/storyboard/src/core/ui/CanvasUndoRedo.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasUndoRedo.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Groups undo and redo actions into one canvas toolbar control. It listens for undo/redo availability and forwards clicks into the injected canvas API.

This keeps keyboard labels, disabled state, and layout local while history ownership stays in the canvas page.

## Composition

```jsx
/**
 * CanvasUndoRedo — grouped undo/redo button bar.
 */
import { useState, useEffect } from 'react'
import './CanvasUndoRedo.css'
import * as Tooltip from '../lib/components/ui/tooltip/index.js'

export default function CanvasUndoRedo({ config = {}, data, tabindex = -1 }) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    function handleUndoRedoState(e) {
      setCanUndo(!!e.detail?.canUndo)
      setCanRedo(!!e.detail?.canRedo)
    }
    document.addEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState)
    return () => {
      document.removeEventListener('storyboard:canvas:undo-redo-state', handleUndoRedoState)
    }
  }, [])

  if (!data) return null

  return (
    <div className="canvas-undo-bar" role="group" aria-label={config.ariaLabel || 'Undo and redo'}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            className="canvas-undo-btn"
            onClick={() => data.undo()}
            disabled={!canUndo}
            aria-label="Undo"
            tabIndex={tabindex}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.75.75 0 1 1-1.06 1.06L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Undo (⌘Z)</Tooltip.Content>
      </Tooltip.Root>
      <span className="canvas-undo-separator"></span>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            className="canvas-undo-btn"
            onClick={() => data.redo()}
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/ui/CanvasUndoRedo.css`](../../../../../../../packages/storyboard/src/core/ui/CanvasUndoRedo.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/tooltip/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/tooltip/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
