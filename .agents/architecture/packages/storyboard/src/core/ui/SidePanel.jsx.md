# `packages/storyboard/src/core/ui/SidePanel.jsx`

<!--
source: packages/storyboard/src/core/ui/SidePanel.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Push-style side/bottom panel used for shell tabs such as the inspector. It subscribes to the side-panel store, manages dock position and resizing, and lazy-loads heavy panel content.

This component is the shell's expandable workspace: CoreUIBar mounts it only when needed, and the panel then owns focus return, persistence, and resize UX.

## Composition

```jsx
/**
 * SidePanel — push-style panel for Documentation and Inspector views.
 *
 * Can dock to the right edge (side) or bottom edge of the viewport.
 * When open, pushes #root content via CSS classes on <html>.
 * Background color follows the active mode's collar color.
 * Resizable by dragging the panel edge.
 * Position preference (side/bottom) is persisted in localStorage.
 *
 * Mounted lazily from CoreUIBar when a side panel trigger is clicked.
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import octicons from '@primer/octicons'
import { sidePanelState, closePanel } from '../stores/sidePanelStore.js'
import './sidepanel.css'

const MIN_WIDTH = 300
const MAX_WIDTH = 900
const MIN_HEIGHT = 200
const MAX_HEIGHT = 600

const LazyInspectorPanel = lazy(() => import('./InspectorPanel.jsx'))

function OcticonSvg({ name, size = 16 }) {
  const icon = octicons[name]
  if (!icon) return null
  const svg = icon.toSVG({ width: size, height: size }).replace('<svg ', '<svg fill="currentColor" ')
  return <span style={{ display: 'inline-flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: svg }} />
}

export default function SidePanel({ resizable = true, onClose }) {
  const [panelState, setPanelState] = useState({ open: false, activeTab: 'inspector' })
  const [panelWidth, setPanelWidth] = useState(420)
  const [panelHeight, setPanelHeight] = useState(300)
  const [panelPosition, setPanelPosition] = useState('side')
  const [dragging, setDragging] = useState(false)
  const closeBtnRef = useRef(null)

  const isBottom = panelPosition === 'bottom'

  // Subscribe to the framework-agnostic store
  useEffect(() => {
    return sidePanelState.subscribe(setPanelState)
  }, [])

  // Sync panel width to CSS custom property
  useEffect(() => {
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- `@primer/octicons` is imported directly by this component.
- `../stores/sidePanelStore.js` is imported directly by this component.
- [`packages/storyboard/src/core/ui/sidepanel.css`](../../../../../../../packages/storyboard/src/core/ui/sidepanel.css) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
