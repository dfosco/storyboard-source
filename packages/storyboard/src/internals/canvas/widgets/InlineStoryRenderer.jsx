/**
 * InlineStoryRenderer — renders a story's named export directly inside the
 * canvas React tree (no iframe).
 *
 * Wrapped in:
 *   - <ThemeProvider colorMode> + <BaseStyles> so the story's Primer theme can
 *     differ from the canvas chrome theme.
 *   - <StoryErrorBoundary> so a thrown render error stays scoped to this widget.
 *
 * Re-imports the module on `storyboard:story-index-changed` events so HMR-driven
 * story updates show without remounting the iframe shell.
 *
 * Note: stories using `useOverride` / `useFlowData` will share the canvas URL
 * hash. This is a known limitation of the inline path; iframe path remains
 * available via `canvas.inlineStories: false`.
 */
import { useState, useEffect, useMemo } from 'react'
import { ThemeProvider, BaseStyles } from '@primer/react'
import { getStoryData } from '../../../core/index.js'
import { StoryErrorBoundary } from '../StoryErrorBoundary.jsx'

function resolveColorMode() {
  if (typeof document === 'undefined') return 'day'
  const attr = document.documentElement.getAttribute('data-color-mode')
  if (attr === 'dark') return 'night'
  if (attr === 'light') return 'day'
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
  }
  return 'day'
}

export default function InlineStoryRenderer({ storyId, exportName }) {
  const [mod, setMod] = useState(null)
  const [error, setError] = useState(null)
  const [storyIndexKey, setStoryIndexKey] = useState(0)
  const [colorMode, setColorMode] = useState(() => resolveColorMode())

  // Track parent theme changes
  useEffect(() => {
    const onTheme = () => setColorMode(resolveColorMode())
    document.addEventListener('storyboard:theme:changed', onTheme)
    return () => document.removeEventListener('storyboard:theme:changed', onTheme)
  }, [])

  // Re-import on story index change (HMR / new exports added)
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  // storyIndexKey forces re-lookup on HMR
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const story = useMemo(() => getStoryData(storyId), [storyId, storyIndexKey])
  const lookupError = useMemo(() => {
    if (!story) return new Error(`Story "${storyId}" not found`)
    if (typeof story._storyImport !== 'function') return new Error(`Story "${storyId}" has no import function`)
    return null
  }, [story, storyId])

  useEffect(() => {
    if (lookupError) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    story._storyImport()
      .then((m) => { if (!cancelled) setMod(m) })
      .catch((err) => { if (!cancelled) { setError(err); setMod(null) } })
    return () => { cancelled = true }
  }, [story, lookupError, storyIndexKey])

  const displayedError = lookupError || error

  const Component = useMemo(() => {
    if (!mod) return null
    if (exportName) {
      const C = mod[exportName]
      return typeof C === 'function' ? C : null
    }
    // No exportName — render the first named function export
    for (const [k, v] of Object.entries(mod)) {
      if (k !== 'default' && typeof v === 'function') return v
    }
    return null
  }, [mod, exportName])

  const errorStyle = {
    padding: '16px',
    color: '#cf222e',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  if (displayedError) {
    return (
      <div style={errorStyle}>
        <strong>{exportName || storyId}</strong>
        <br />
        {String(displayedError.message || displayedError)}
      </div>
    )
  }
  if (!mod) return null
  if (!Component) {
    return (
      <div style={errorStyle}>
        <strong>{exportName || storyId}</strong>
        <br />
        {exportName ? `Export "${exportName}" not found or is not a component` : 'No named exports found in story module'}
      </div>
    )
  }

  return (
    <div style={{ contain: 'layout paint style', width: '100%', height: '100%', overflow: 'auto' }}>
      <ThemeProvider colorMode={colorMode}>
        <BaseStyles>
          <StoryErrorBoundary name={exportName || storyId} resetKey={`${storyId}:${exportName}:${storyIndexKey}`}>
            <Component />
          </StoryErrorBoundary>
        </BaseStyles>
      </ThemeProvider>
    </div>
  )
}
