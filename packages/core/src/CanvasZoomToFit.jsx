/**
 * CanvasZoomToFit — standalone zoom-to-objects button.
 */
import './CanvasZoomToFit.css'
import * as Tooltip from './lib/components/ui/tooltip/index.js'
import Icon from './Icon.jsx'

export default function CanvasZoomToFit({ config = {}, data, tabindex = -1 }) {
  if (!data) return null

  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <button
          className="canvas-standalone-btn"
          onClick={() => data.zoomToFit()}
          aria-label={config.label || 'Zoom to objects'}
          tabIndex={tabindex}
        >
          <Icon name={config.icon || 'iconoir/square-3d-three-points'} size={16} {...(config.meta || {})} />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top">{config.label || 'Zoom to objects'}</Tooltip.Content>
    </Tooltip.Root>
  )
}
