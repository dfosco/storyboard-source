/**
 * Canvas Component-Set Isolate — lightweight iframe entry point.
 *
 * Renders ALL named exports from a .story.jsx module in a grid layout,
 * bypassing the full SPA bootstrap (router, StoryboardProvider, data index).
 *
 * This is the component-set equivalent of componentIsolate.jsx, which renders
 * a single export. By avoiding the full app bootstrap, component-set widgets
 * load significantly faster — especially important since each widget is an
 * iframe that would otherwise need to initialize the entire app.
 *
 * Query params:
 *   module   — absolute or base-relative path to the .story.jsx file
 *   layout   — "horizontal" (default) | "vertical"
 *   selected — export name of the currently selected cell
 *   theme    — canvas theme (light / dark / dark_dimmed)
 */
import { createElement, Component as ReactComponent, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, BaseStyles } from '@primer/react'

// ── Primer Primitives CSS (required for CSS variables) ──────────────
import '@primer/primitives/dist/css/base/size/size.css'
import '@primer/primitives/dist/css/base/typography/typography.css'
import '@primer/primitives/dist/css/base/motion/motion.css'
import '@primer/primitives/dist/css/functional/size/border.css'
import '@primer/primitives/dist/css/functional/size/breakpoints.css'
import '@primer/primitives/dist/css/functional/size/size-coarse.css'
import '@primer/primitives/dist/css/functional/size/size-fine.css'
import '@primer/primitives/dist/css/functional/size/size.css'
import '@primer/primitives/dist/css/functional/size/viewport.css'
import '@primer/primitives/dist/css/functional/typography/typography.css'
import '@primer/primitives/dist/css/functional/themes/light.css'
import '@primer/primitives/dist/css/functional/themes/light-colorblind.css'
import '@primer/primitives/dist/css/functional/themes/dark.css'
import '@primer/primitives/dist/css/functional/themes/dark-colorblind.css'
import '@primer/primitives/dist/css/functional/themes/dark-high-contrast.css'
import '@primer/primitives/dist/css/functional/themes/dark-dimmed.css'

import styles from '../story/ComponentSetPage.module.css'

// ── Error Boundary ──────────────────────────────────────────────────
class IsolateErrorBoundary extends ReactComponent {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return createElement('div', { style: errorStyle },
        createElement('strong', null, this.props.name || 'Component'),
        createElement('br'),
        String(this.state.error.message || this.state.error),
      )
    }
    return this.props.children
  }
}

const errorStyle = {
  padding: '16px',
  color: '#cf222e',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

// ── Resolve module path ─────────────────────────────────────────────
function resolveModulePath(raw) {
  if (!raw) return raw
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return raw
  if (!raw.startsWith('/')) return raw
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  if (!base) return raw
  if (raw.startsWith(base)) return raw
  return `${base}${raw}`
}

// ── Component-Set Grid (mirrors ComponentSetPage UI) ────────────────
function ComponentSetGrid({ exports, layout, density, initialSelected }) {
  const [selected, setSelected] = useState(initialSelected)
  const gridRef = useRef(null)

  const handleSelect = useCallback((exportName) => {
    const next = exportName === selected ? '' : exportName
    setSelected(next)

    // Update URL without navigation
    const params = new URLSearchParams(window.location.search)
    if (next) params.set('selected', next)
    else params.delete('selected')
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)

    // Notify parent widget
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'storyboard:component-set:select',
        exportName: next || null,
      }, '*')
    }
  }, [selected])

  // Post a sensible initial widget size to the parent. Each cell sizes to
  // its own content via CSS; here we measure individual cells (which have
  // intrinsic widths thanks to `minmax` + the iframe being narrow at first)
  // and arrange them in a near-square grid to compute an initial widget size.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || !exports) return

    let posted = false
    function measureAndPost() {
      if (posted || window.parent === window) return
      const cells = grid.querySelectorAll(`.${styles.cell}`)
      if (cells.length === 0) return
      let maxW = 0
      let maxH = 0
      cells.forEach((cell) => {
        const r = cell.getBoundingClientRect()
        if (r.width > maxW) maxW = r.width
        if (r.height > maxH) maxH = r.height
      })
      if (maxW < 10 || maxH < 10) return
      const count = cells.length
      const cols = Math.max(1, Math.min(count, Math.ceil(Math.sqrt(count))))
      const rows = Math.ceil(count / cols)
      const gap = 16
      const pad = 32 // 16px padding on both sides
      const width = Math.ceil(maxW * cols + gap * (cols - 1) + pad)
      const height = Math.ceil(maxH * rows + gap * (rows - 1) + pad)
      posted = true
      window.parent.postMessage({
        type: 'storyboard:component-set:initial-size',
        width,
        height,
      }, '*')
    }

    // Measure after layout + fonts settle
    requestAnimationFrame(() => requestAnimationFrame(measureAndPost))
    document.fonts.ready.then(() => requestAnimationFrame(measureAndPost))
  }, [exports, layout, density])

  // Signal snapshot-ready
  useEffect(() => {
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__sbSnapshotReady?.()
      }))
    })
  }, [exports])

  const exportNames = Object.keys(exports)

  // eslint-disable-next-line react-hooks/refs -- ref assigned to DOM element, not read during render
  return createElement('div', {
    ref: gridRef,
    className: styles.grid,
    'data-layout': layout,
    'data-density': density,
  },
    exportNames.map((exportName) => {
      const Component = exports[exportName]
      const isSelected = exportName === selected
      const cellStyle = typeof Component.minHeight === 'number'
        ? { '--cell-min-h': `${Component.minHeight}px` }
        : undefined
      return createElement('div', {
        key: exportName,
        className: styles.cell,
        'data-selected': isSelected || undefined,
        style: cellStyle,
      },
        createElement('button', {
          className: styles.cellLabel,
          onClick: () => handleSelect(exportName),
          'data-selected': isSelected || undefined,
          'aria-pressed': isSelected,
        },
          createElement('span', { className: styles.cellRadio, 'data-selected': isSelected || undefined }),
          createElement('span', { className: styles.cellName }, exportName),
        ),
        createElement('div', { className: styles.cellContent, 'data-cell-content': '' },
          createElement(IsolateErrorBoundary, { name: exportName },
            createElement(Component),
          ),
        ),
      )
    }),
  )
}

// ── Main ────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search)
const modulePath = params.get('module')
const layoutParam = params.get('layout') || 'auto'
const layout = layoutParam === 'horizontal' ? 'wide' : layoutParam === 'vertical' ? 'tall' : layoutParam
const density = params.get('density') || 'comfy'
const selected = params.get('selected') || ''
const theme = params.get('theme') || 'light'

const colorMode = theme.startsWith('dark') ? 'night' : 'day'

document.documentElement.setAttribute('data-color-mode', theme.startsWith('dark') ? 'dark' : 'light')
document.documentElement.setAttribute('data-dark-theme', theme.startsWith('dark') ? theme : '')
document.documentElement.setAttribute('data-light-theme', theme.startsWith('dark') ? '' : theme || 'light')

// Suppress HMR full-reloads — this iframe is embedded inside a canvas page
// that manages its own reload lifecycle. Without this guard, every file change
// causes the iframe to flash/reload.
if (import.meta.hot) {
  const msg = { active: true }
  import.meta.hot.send('storyboard:canvas-hmr-guard', msg)
  setInterval(() => import.meta.hot.send('storyboard:canvas-hmr-guard', msg), 3000)
}

const root = createRoot(document.getElementById('root'))

async function mount() {
  if (!modulePath) {
    root.render(createElement('div', { style: errorStyle }, 'Missing module param'))
    return
  }

  if (!modulePath.match(/\.story\.(jsx|tsx)$/)) {
    root.render(createElement('div', { style: errorStyle }, 'Invalid module path — only .story.jsx/.tsx files are allowed'))
    return
  }

  try {
    const resolved = resolveModulePath(modulePath)
    const mod = await import(/* @vite-ignore */ resolved)

    const namedExports = {}
    for (const [key, value] of Object.entries(mod)) {
      if (key !== 'default' && typeof value === 'function') {
        // Opt-out: showcase exports that already render every variant.
        if (value.componentSet === false) continue
        namedExports[key] = value
      }
    }

    if (Object.keys(namedExports).length === 0) {
      throw new Error('No named exports found in story module')
    }

    root.render(
      createElement(ThemeProvider, { colorMode },
        createElement(BaseStyles, null,
          createElement(ComponentSetGrid, { exports: namedExports, layout, density, initialSelected: selected }),
        ),
      ),
    )
  } catch (err) {
    root.render(
      createElement('div', { style: errorStyle },
        createElement('strong', null, 'Component Set'),
        createElement('br'),
        String(err.message || err),
      ),
    )
  }
}

mount()
