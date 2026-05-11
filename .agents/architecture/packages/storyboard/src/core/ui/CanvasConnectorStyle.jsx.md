# `packages/storyboard/src/core/ui/CanvasConnectorStyle.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasConnectorStyle.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Toggles canvas connector rendering between fluid and orthogonal modes. It is a focused toolbar control that reflects global connector-style state and flips to the alternate mode on click.

The actual connector routing logic lives in the canvas runtime; this file only synchronizes UI state and emits the requested next mode.

## Composition

```jsx
/**
 * CanvasConnectorStyle — toolbar toggle for connector rendering style.
 * Cycles between 'fluid' (cubic Bézier) and 'orthogonal' (right-angled).
 */
import { useState, useEffect } from 'react'
import './CanvasConnectorStyle.css'
import * as Tooltip from '../lib/components/ui/tooltip/index.js'
import Icon from './Icon.jsx'

const FLUID_ICON = 'iconoir/sea-waves'
const ORTHO_ICON = 'iconoir/rhombus'

export default function CanvasConnectorStyle({ config = {}, data, tabindex = -1 }) {
  const [style, setStyle] = useState('fluid')

  useEffect(() => {
    function handleState(e) {
      const next = e.detail?.style
      if (next === 'fluid' || next === 'orthogonal') setStyle(next)
    }
    document.addEventListener('storyboard:canvas:connector-style-state', handleState)
    document.dispatchEvent(new CustomEvent('storyboard:canvas:connector-style-state-request'))
    return () => {
      document.removeEventListener('storyboard:canvas:connector-style-state', handleState)
    }
  }, [])

  if (!data) return null

  const isOrtho = style === 'orthogonal'
  const next = isOrtho ? 'fluid' : 'orthogonal'
  const icon = isOrtho ? (config.iconOrthogonal || ORTHO_ICON) : (config.iconFluid || FLUID_ICON)
  const label = isOrtho
    ? (config.labelOrthogonal || 'Orthogonal connectors')
    : (config.labelFluid || 'Fluid connectors')

  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          className={`canvas-connector-style-btn${isOrtho ? ' canvas-connector-style-btn-active' : ''}`}
          onClick={() => data.setConnectorStyle?.(next)}
          aria-label={config.ariaLabel || 'Connector style'}
          aria-pressed={isOrtho}
          tabIndex={tabindex}
        >
          <Icon name={icon} size={16} {...(config.meta || {})} />
        </button>
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/ui/CanvasConnectorStyle.css`](../../../../../../../packages/storyboard/src/core/ui/CanvasConnectorStyle.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/tooltip/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/tooltip/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
