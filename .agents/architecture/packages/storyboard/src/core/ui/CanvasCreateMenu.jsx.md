# `packages/storyboard/src/core/ui/CanvasCreateMenu.jsx`

<!--
source: packages/storyboard/src/core/ui/CanvasCreateMenu.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements the “add to canvas” dropdown for widgets, prototypes, components, and optional agent entries. This is the richest canvas-toolbar menu because it federates several creation paths behind one trigger.

It mixes static widget types with dynamic story discovery, prototype indexing, and event dispatches that hand actual mutation work to the canvas system or artifact-creation flow.

## Composition

```jsx
/**
 * CanvasCreateMenu — CoreUIBar dropdown for adding widgets to the active canvas.
 * Dispatches custom events to bridge to React canvas system.
 * Only visible when a canvas page is active.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import { SearchableList } from '../lib/components/ui/searchable-list.jsx'
import Icon from './Icon.jsx'
import { getConfig } from '../index.js'
import { buildPrototypeIndex } from '../index.js'

const widgetTypes = [
  { type: 'sticky-note', label: 'Sticky Note' },
  { type: 'markdown', label: 'Markdown' },
  { type: 'prompt', label: 'Prompt' },
  { type: 'terminal', label: 'Terminal' },
]

function formatName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function ChevronRight({ className, style }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} style={style}>
      <path d="M4.5 2.5L7.5 6L4.5 9.5" />
    </svg>
  )
}

function getApiUrl() {
  const basePath = window.__STORYBOARD_BASE_PATH__ || '/'
  return basePath.replace(/\/$/, '') + '/_storyboard/canvas'
}

export default function CanvasCreateMenu({ config = {}, data: _data, canvasName = '', zoom: _zoom, tabindex }) {
  void _data
  void _zoom
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('menu')
  const [stories, setStories] = useState([])
  const [storiesLoaded, setStoriesLoaded] = useState(false)
  const componentSearchRef = useRef(null)
  const prototypeSearchRef = useRef(null)
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/searchable-list.jsx`](../../../../../../../packages/storyboard/src/core/lib/components/ui/searchable-list.jsx) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/index.js`](../../../../../../../packages/storyboard/src/core/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/index.js`](../../../../../../../packages/storyboard/src/core/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
