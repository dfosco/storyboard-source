# `packages/storyboard/src/core/ui/InspectorPanel.jsx`

<!--
source: packages/storyboard/src/core/ui/InspectorPanel.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements the side-panel inspector for selecting DOM nodes and tracing them back to React component information and source files. It combines runtime inspection with source fetching and highlighting.

Architecturally it is the heavy developer-introspection tab mounted lazily by SidePanel, keeping the rest of the shell light until inspection is needed.

## Composition

```jsx
/**
 * InspectorPanel — Inspector tab for the side panel.
 * Select DOM elements and view their React component information.
 * Uses mouseMode for element selection and fiberWalker for component introspection.
 */

import './InspectorPanel.css'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import octicons from '@primer/octicons'
import { inspectElement, inspectElementChain } from '../inspector/fiberWalker.js'
import { createMouseMode } from '../inspector/mouseMode.js'
import { getColors, createInspectorHighlighter } from '../inspector/highlighter.js'

// ── Inline icon helpers ─────────────────────────────────────────

function OcticonSvg({ name, size = 16, className, style }) {
  const icon = octicons[name]
  if (!icon) return null
  const svg = icon.toSVG({ width: size, height: size }).replace('<svg ', '<svg fill="currentColor" ')
  return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
}

function IconoirSquareDashed({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2H5a3 3 0 00-3 3v2M17 2h2a3 3 0 013 3v2M17 22h2a3 3 0 003-3v-2M7 22H5a3 3 0 01-3-3v-2" />
    </svg>
  )
}

// ── Constants ───────────────────────────────────────────────────

const _isLocalDev = typeof window !== 'undefined' && window.__SB_LOCAL_DEV__ === true && !new URLSearchParams(window.location.search).has('prodMode')
const _basePath = (typeof window !== 'undefined' && window.__STORYBOARD_BASE_PATH__) || '/'

// ── URL state helpers ───────────────────────────────────────────

function generateSelector(el) {
  if (!(el instanceof Element)) return null
  if (el.id) return `#${CSS.escape(el.id)}`

  const testId = el.getAttribute('data-testid')
  if (testId) return `[data-testid="${CSS.escape(testId)}"]`

  const parts = []
  let cur = el
  while (cur && cur !== document.body && cur !== document.documentElement) {
    let seg = cur.tagName.toLowerCase()
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/InspectorPanel.css`](../../../../../../../packages/storyboard/src/core/ui/InspectorPanel.css) provides part of this component's behavior.
- `react` is imported directly by this component.
- `@primer/octicons` is imported directly by this component.
- [`packages/storyboard/src/core/inspector/fiberWalker.js`](../../../../../../../packages/storyboard/src/core/inspector/fiberWalker.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/inspector/mouseMode.js`](../../../../../../../packages/storyboard/src/core/inspector/mouseMode.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/inspector/highlighter.js`](../../../../../../../packages/storyboard/src/core/inspector/highlighter.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
