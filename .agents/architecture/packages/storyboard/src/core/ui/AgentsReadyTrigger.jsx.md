# `packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx`

<!--
source: packages/storyboard/src/core/ui/AgentsReadyTrigger.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Shows ready and working agent counts in the collab bar and cycles focus across completed agents. The button is always present so collaboration state stays visible even when no agents are done.

Its integration point is pure event wiring: it requests agent status through `storyboard:done-agents-*` events and centers the canvas with `storyboard:canvas:center-on-widget`.

## Composition

```jsx
/**
 * AgentsReadyTrigger — collab-bar button that shows count of `done` agents
 * on the active canvas and cycles through them on click. Always rendered
 * (shows `0` when no agents are ready) and styled to match the per-widget
 * toolbar `featureBtn`.
 *
 * Listens to `storyboard:done-agents-changed` (dispatched by CanvasPage) and
 * dispatches `storyboard:canvas:center-on-widget` to pan to the next agent.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from './Icon.jsx'

export default function AgentsReadyTrigger({ config = {}, tabIndex }) {
  const [doneAgents, setDoneAgents] = useState([])
  const [workingAgents, setWorkingAgents] = useState([])
  const cycleIndexRef = useRef(0)

  useEffect(() => {
    function handleChange(e) {
      const done = Array.isArray(e.detail?.doneAgents) ? e.detail.doneAgents : []
      const working = Array.isArray(e.detail?.workingAgents) ? e.detail.workingAgents : []
      setDoneAgents(done)
      setWorkingAgents(working)
    }
    document.addEventListener('storyboard:done-agents-changed', handleChange)
    document.dispatchEvent(new CustomEvent('storyboard:done-agents-request'))
    return () => document.removeEventListener('storyboard:done-agents-changed', handleChange)
  }, [])

  const doneCount = doneAgents.length
  const workingCount = workingAgents.length
  const ready = doneCount > 0
  const idle = doneCount === 0 && workingCount === 0
  const label = config.label || 'Agents ready'

  const handleClick = useCallback(() => {
    if (doneCount === 0) return
    const idx = cycleIndexRef.current % doneCount
    cycleIndexRef.current = (idx + 1) % doneCount
    const next = doneAgents[idx]
    if (!next?.id) return
    document.dispatchEvent(new CustomEvent('storyboard:canvas:center-on-widget', {
      detail: { widgetId: next.id },
    }))
  }, [doneCount, doneAgents])

  let aria = config.ariaLabel || label
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
