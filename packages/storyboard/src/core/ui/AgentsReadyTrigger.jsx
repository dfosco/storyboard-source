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
  const cycleIndexRef = useRef(0)

  useEffect(() => {
    function handleChange(e) {
      const next = Array.isArray(e.detail?.doneAgents) ? e.detail.doneAgents : []
      setDoneAgents(next)
    }
    document.addEventListener('storyboard:done-agents-changed', handleChange)
    document.dispatchEvent(new CustomEvent('storyboard:done-agents-request'))
    return () => document.removeEventListener('storyboard:done-agents-changed', handleChange)
  }, [])

  const count = doneAgents.length
  const ready = count > 0
  const label = config.label || 'Agents ready'

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

  return (
    <button
      type="button"
      data-collab-bar-item="agents-ready"
      data-count={count}
      data-ready={ready || undefined}
      className="agents-ready-btn"
      aria-label={ready ? `${label} (${count})` : (config.ariaLabel || label)}
      tabIndex={tabIndex}
      onClick={handleClick}
      disabled={!ready}
    >
      <Icon name={config.icon || 'primer/sparkle-fill'} size={14} {...(config.meta || {})} />
      <span className="agents-ready-btn-label">{label}</span>
      <span className="agents-ready-btn-count" aria-hidden="true">{count}</span>
    </button>
  )
}

