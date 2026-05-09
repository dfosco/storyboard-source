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
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, BaseStyles } from '@primer/react'
import { StoryErrorBoundary as IsolateErrorBoundary } from './StoryErrorBoundary.jsx'

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
