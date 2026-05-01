/**
 * Canvas Component Isolate — iframe entry point.
 *
 * Renders a single named export from a .story.jsx module inside an
 * isolated document. The parent CanvasPage embeds this via an iframe
 * so a broken component cannot crash the entire canvas.
 *
 * Query params:
 *   module — absolute or base-relative path to the .story.jsx file
 *   export — the named export to render
 *   theme  — canvas theme (light / dark / dark_dimmed)
 */
import { createElement, Component as ReactComponent } from 'react'
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

// ── Styles ──────────────────────────────────────────────────────────
const errorStyle = {
  padding: '16px',
  color: '#cf222e',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '13px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

// ── Resolve module path (mirrors useCanvas.resolveCanvasModuleImport) ─
function resolveModulePath(raw) {
  if (!raw) return raw
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return raw
  if (!raw.startsWith('/')) return raw
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
  if (!base) return raw
  if (raw.startsWith(base)) return raw
  return `${base}${raw}`
}

// ── Main ────────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search)
const modulePath = params.get('module')
const exportName = params.get('export')
const theme = params.get('theme') || 'light'

// Map theme to Primer colorMode
const colorMode = theme.startsWith('dark') ? 'night' : 'day'

// Apply theme to document for Primer / CSS-var inheritance
document.documentElement.setAttribute('data-color-mode', theme.startsWith('dark') ? 'dark' : 'light')
document.documentElement.setAttribute('data-dark-theme', theme.startsWith('dark') ? theme : '')
document.documentElement.setAttribute('data-light-theme', theme.startsWith('dark') ? '' : theme || 'light')

const root = createRoot(document.getElementById('root'))

async function mount() {
  if (!modulePath) {
    root.render(createElement('div', { style: errorStyle }, 'Missing module param'))
    return
  }

  // Validate: only allow .story.{jsx,tsx} modules
  if (!modulePath.match(/\.story\.(jsx|tsx)$/)) {
    root.render(createElement('div', { style: errorStyle }, 'Invalid module path — only .story.jsx/.tsx files are allowed'))
    return
  }

  try {
    const resolved = resolveModulePath(modulePath)
    const mod = await import(/* @vite-ignore */ resolved)

    if (exportName) {
      // Single export mode
      const Component = mod[exportName]
      if (!Component || typeof Component !== 'function') {
        throw new Error(`Export "${exportName}" not found or is not a component`)
      }
      root.render(
        createElement(ThemeProvider, { colorMode },
          createElement(BaseStyles, null,
            createElement(IsolateErrorBoundary, { name: exportName },
              createElement(Component),
            ),
          ),
        ),
      )
    } else {
      // All exports mode — render every named function export stacked
      const entries = Object.entries(mod).filter(
        ([key, value]) => key !== 'default' && typeof value === 'function',
      )
      if (entries.length === 0) {
        throw new Error('No named exports found in story module')
      }
      root.render(
        createElement(ThemeProvider, { colorMode },
          createElement(BaseStyles, null,
            ...entries.map(([name, Component]) =>
              createElement(IsolateErrorBoundary, { key: name, name },
                createElement(Component),
              ),
            ),
          ),
        ),
      )
    }
  } catch (err) {
    root.render(
      createElement('div', { style: errorStyle },
        createElement('strong', null, exportName || 'Component'),
        createElement('br'),
        String(err.message || err),
      ),
    )
  }
}

mount()
