# `packages/storyboard/src/core/ui/CanvasZoomToFit.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasZoomToFit.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides a single-purpose “zoom to objects” canvas button. It is the simplest bridge from toolbar config to the canvas `zoomToFit()` action.

Because it only depends on injected `data`, it can be reused anywhere the canvas toolbar surface expects a standalone button component.

## Composition

```jsx
/**
 * CanvasZoomToFit — standalone zoom-to-objects button.
 */
import './CanvasZoomToFit.css'
import * as Tooltip from '../lib/components/ui/tooltip/index.js'
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
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/CanvasZoomToFit.css`](../../../../../../../packages/storyboard/src/core/ui/CanvasZoomToFit.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/tooltip/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/tooltip/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
