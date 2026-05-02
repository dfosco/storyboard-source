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
    </Tooltip.Root>
  )
}
