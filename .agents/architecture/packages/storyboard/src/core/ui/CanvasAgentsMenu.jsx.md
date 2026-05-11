# `packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasAgentsMenu.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Adds configured agent widgets to the active canvas. The component translates `canvas.agents` config into dropdown items and emits a single canvas add-widget event.

It is intentionally thin: configuration lookup happens through the core config API, and canvas mutation is delegated to the canvas event bridge.

## Composition

```jsx
/**
 * CanvasAgentsMenu — CoreUIBar dropdown for adding agent widgets to the active canvas.
 * Reads agent definitions from canvas.agents config and dispatches add-widget events.
 * Only visible when a canvas page is active and agents are configured.
 */
import { useState, useMemo } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import Icon from './Icon.jsx'
import { getConfig } from '../index.js'

export default function CanvasAgentsMenu({ config = {}, data: _data, canvasName = '', zoom: _zoom, tabindex }) {
  void _data
  void _zoom
  const [menuOpen, setMenuOpen] = useState(false)

  const agents = useMemo(() => {
    const canvasConfig = getConfig('canvas')
    const agentsConfig = canvasConfig?.agents
    if (!agentsConfig || typeof agentsConfig !== 'object') return []
    return Object.entries(agentsConfig).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      icon: cfg.icon,
      startupCommand: cfg.startupCommand || id,
      defaultWidth: cfg.defaultWidth,
      defaultHeight: cfg.defaultHeight,
    }))
  }, [])

  function addAgent(agent) {
    document.dispatchEvent(new CustomEvent('storyboard:canvas:add-widget', {
      detail: {
        type: 'agent',
        canvasName,
        props: {
          agentId: agent.id,
          startupCommand: agent.startupCommand,
          ...(agent.defaultWidth ? { width: agent.defaultWidth } : {}),
          ...(agent.defaultHeight ? { height: agent.defaultHeight } : {}),
        },
      }
    }))
    setMenuOpen(false)
  }

  if (agents.length === 0) return null
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/index.js`](../../../../../../../packages/storyboard/src/core/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
