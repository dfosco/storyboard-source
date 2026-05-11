# `packages/storyboard/src/core/ui/CanvasZoomControl.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasZoomControl.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Renders the three-button zoom cluster for canvas pages: zoom out, reset to 100%, and zoom in. It is a presentational wrapper around the injected canvas zoom API.

Tooltip labels and disabled bounds come from the shared canvas data object, so the control stays stateless apart from received props.

## Composition

```jsx
/**
 * CanvasZoomControl — zoom in/out/reset bar for canvas pages.
 */
import './CanvasZoomControl.css'
import * as Tooltip from '../lib/components/ui/tooltip/index.js'

export default function CanvasZoomControl({ config = {}, data, zoom = 100, tabindex = -1 }) {
  if (!data) return null

  return (
    <div className="canvas-zoom-bar" role="group" aria-label={config.ariaLabel || 'Zoom controls'}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            className="canvas-zoom-btn"
            onClick={() => data.zoomOut(zoom)}
            disabled={zoom <= data.ZOOM_MIN}
            aria-label="Decrease zoom"
            tabIndex={tabindex}
          >−</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Decrease zoom</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            className="canvas-zoom-label"
            onClick={() => data.zoomReset()}
            aria-label="Zoom to 100%"
            tabIndex={-1}
          >{zoom}%</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Zoom to 100%</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <button
            className="canvas-zoom-btn"
            onClick={() => data.zoomIn(zoom)}
            disabled={zoom >= data.ZOOM_MAX}
            aria-label="Increase zoom"
            tabIndex={-1}
          >+</button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top">Increase zoom</Tooltip.Content>
      </Tooltip.Root>
    </div>
  )
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/CanvasZoomControl.css`](../../../../../../../packages/storyboard/src/core/ui/CanvasZoomControl.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/tooltip/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/tooltip/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
