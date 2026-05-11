# `packages/storyboard/src/core/ui/CanvasSnap.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasSnap.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Exposes snap-to-grid as a standalone toggle on canvas pages. The control mirrors current snap state from the canvas bridge and can broadcast an initial grid size from config.

The actual snap logic lives in the canvas runtime; this file only synchronizes button state and emits toggle/setup events.

## Composition

```jsx
/**
 * CanvasSnap — standalone snap-to-grid toggle button.
 */
import { useState, useEffect } from 'react'
import './CanvasSnap.css'
import * as Tooltip from '../lib/components/ui/tooltip/index.js'
import Icon from './Icon.jsx'

export default function CanvasSnap({ config = {}, data, tabindex = -1 }) {
  const [snapEnabled, setSnapEnabled] = useState(false)

  useEffect(() => {
    function handleSnapState(e) {
      setSnapEnabled(!!e.detail?.snapEnabled)
    }
    document.addEventListener('storyboard:canvas:snap-state', handleSnapState)

    // Broadcast configured gridSize on mount
    const gridSize = config.gridSize
    if (gridSize) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:grid-size', {
        detail: { gridSize }
      }))
    }
    // Request current snap state (may have dispatched before we mounted)
    document.dispatchEvent(new CustomEvent('storyboard:canvas:snap-state-request'))

    return () => {
      document.removeEventListener('storyboard:canvas:snap-state', handleSnapState)
    }
  }, [config.gridSize])

  if (!data) return null

  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          className={`canvas-snap-btn${snapEnabled ? ' canvas-snap-btn-active' : ''}`}
          onClick={() => data.toggleSnap()}
          aria-label={config.label || 'Snap to grid'}
          aria-pressed={snapEnabled}
          tabIndex={tabindex}
        >
          <Icon name={config.icon || 'iconoir/view-grid'} size={16} {...(config.meta || {})} />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">{snapEnabled ? (config.labelOn || 'Snap to grid (on)') : (config.labelOff || 'Snap to grid (off)')}</Tooltip.Content>
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/ui/CanvasSnap.css`](../../../../../../../packages/storyboard/src/core/ui/CanvasSnap.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/tooltip/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/tooltip/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
