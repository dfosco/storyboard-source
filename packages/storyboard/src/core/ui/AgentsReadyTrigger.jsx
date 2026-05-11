/**
 * AgentsReadyTrigger — collab-bar button that shows count of `done` agents
 * on the active canvas and cycles through them on click. Always visible
 * (shows `0` when no agents are ready).
 *
 * Listens to `storyboard:done-agents-changed` (dispatched by CanvasPage) and
 * dispatches `storyboard:canvas:center-on-widget` to pan to the next agent.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'

export default function AgentsReadyTrigger({ config = {}, tabIndex }) {
  const [doneAgents, setDoneAgents] = useState([])
  const cycleIndexRef = useRef(0)

  useEffect(() => {
    function handleChange(e) {
      const next = Array.isArray(e.detail?.doneAgents) ? e.detail.doneAgents : []
      setDoneAgents(next)
    }
    document.addEventListener('storyboard:done-agents-changed', handleChange)
    // Allow CanvasPage to publish a snapshot on mount
    document.dispatchEvent(new CustomEvent('storyboard:done-agents-request'))
    return () => document.removeEventListener('storyboard:done-agents-changed', handleChange)
  }, [])

  const count = doneAgents.length

  const handleClick = useCallback(() => {
    if (count === 0) return
    const idx = cycleIndexRef.current % count
    cycleIndexRef.current = (idx + 1) % count
    const next = doneAgents[idx]
    if (!next?.id) return
    document.dispatchEvent(new CustomEvent('storyboard:canvas:center-on-widget', {
      detail: { widgetId: next.id },
    }))
  }, [count, doneAgents])

  const ariaLabel = count > 0
    ? `${config.ariaLabel || 'Jump to next ready agent'} (${count})`
    : (config.ariaLabel || 'No agents ready')

  return (
    <span data-collab-bar-item="agents-ready" data-count={count}>
      <TriggerButton
        aria-label={ariaLabel}
        size={config.size || 'icon-xl'}
        tabIndex={tabIndex}
        inactive={count === 0}
        onClick={handleClick}
      >
        <span className="agents-ready-trigger-content">
          <Icon name={config.icon || 'primer/sparkle-fill'} size={16} {...(config.meta || {})} />
          <span className="agents-ready-trigger-count" aria-hidden="true">{count}</span>
        </span>
      </TriggerButton>
    </span>
  )
}
