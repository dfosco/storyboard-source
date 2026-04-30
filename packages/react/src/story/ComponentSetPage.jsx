/**
 * ComponentSetPage — renders all exports from a .story.jsx in a grid.
 *
 * Mounted when StoryPage detects `?_sb_component_set` in the URL.
 * Each export gets its own grid cell with a selectable label header.
 *
 * URL params:
 *   layout   — "horizontal" (default) | "vertical"
 *   selected — export name of the currently selected cell
 *
 * Selection: clicking a cell label updates `?selected=` and posts
 * `storyboard:component-set:select` to the parent window so the
 * canvas widget can track which export the user picked.
 */
import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getStoryData } from '@dfosco/storyboard-core'
import { ThemeProvider, BaseStyles } from '@primer/react'
import styles from './ComponentSetPage.module.css'

export default function ComponentSetPage({ name }) {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const layout = searchParams.get('layout') || 'horizontal'
  const selected = searchParams.get('selected') || ''
  const isEmbed = searchParams.has('_sb_embed')

  // Suppress HMR full-reloads when embedded as a canvas iframe
  useEffect(() => {
    if (!isEmbed || !import.meta.hot) return
    const msg = { active: true }
    import.meta.hot.send('storyboard:canvas-hmr-guard', msg)
    const interval = setInterval(() => {
      import.meta.hot.send('storyboard:canvas-hmr-guard', msg)
    }, 3000)
    return () => {
      clearInterval(interval)
      import.meta.hot.send('storyboard:canvas-hmr-guard', { active: false })
    }
  }, [isEmbed])

  const story = useMemo(() => getStoryData(name), [name])
  const [exports, setExports] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!story?._storyImport) {
      Promise.resolve().then(() => setError(`Story "${name}" not found or missing import`))
      return
    }

    let cancelled = false
    story._storyImport()
      .then((mod) => {
        if (cancelled) return
        const namedExports = {}
        for (const [key, value] of Object.entries(mod)) {
          if (key !== 'default' && typeof value === 'function') {
            namedExports[key] = value
          }
        }
        setExports(namedExports)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(`Failed to load story "${name}": ${err.message || err}`)
      })

    return () => { cancelled = true }
  }, [name, story])

  // Signal snapshot-ready after grid renders in embed mode
  useEffect(() => {
    if (!isEmbed || !exports || window.parent === window) return
    document.fonts.ready.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__sbSnapshotReady?.()
      }))
    })
  }, [isEmbed, exports])

  const gridRef = useRef(null)

  // Measure all cell content elements and snap cells to the largest.
  // Posts the total grid size to the parent widget so it can auto-size.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || !exports) return

    const cells = grid.querySelectorAll('[data-cell-content]')
    if (cells.length === 0) return

    function measure() {
      let maxW = 0
      let maxH = 0
      for (const el of cells) {
        maxW = Math.max(maxW, el.scrollWidth)
        maxH = Math.max(maxH, el.scrollHeight)
      }
      grid.style.setProperty('--cell-snap-w', `${maxW}px`)
      grid.style.setProperty('--cell-snap-h', `${maxH}px`)

      // Post total grid size to parent widget
      if (isEmbed && window.parent !== window) {
        requestAnimationFrame(() => {
          window.parent.postMessage({
            type: 'storyboard:component-set:resize',
            width: grid.scrollWidth,
            height: grid.scrollHeight,
          }, '*')
        })
      }
    }

    // Measure after fonts load and initial paint
    measure()
    document.fonts.ready.then(() => requestAnimationFrame(measure))

    const ro = new ResizeObserver(measure)
    for (const el of cells) ro.observe(el)
    return () => ro.disconnect()
  }, [exports, layout, isEmbed])

  const handleSelect = useCallback((exportName) => {
    const params = new URLSearchParams(location.search)
    if (exportName === params.get('selected')) {
      params.delete('selected')
    } else {
      params.set('selected', exportName)
    }
    navigate(`${location.pathname}?${params}`, { replace: true })

    // Notify parent widget
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'storyboard:component-set:select',
        storyId: name,
        exportName: exportName === selected ? null : exportName,
      }, '*')
    }
  }, [location, navigate, name, selected])

  if (error) {
    return (
      <div className={styles.error}>
        <strong>Component Set Error</strong>
        <span>{error}</span>
      </div>
    )
  }

  if (!exports) {
    if (isEmbed) return null
    return <div className={styles.loading}>Loading component set…</div>
  }

  const exportNames = Object.keys(exports)

  return (
    <ThemeProvider colorMode="day">
      <BaseStyles>
        <div
          ref={gridRef}
          className={styles.grid}
          data-layout={layout}
        >
          {exportNames.map((exportName) => {
            const Component = exports[exportName]
            const isSelected = exportName === selected
            return (
              <div
                key={exportName}
                className={styles.cell}
                data-selected={isSelected || undefined}
              >
                <button
                  className={styles.cellLabel}
                  onClick={() => handleSelect(exportName)}
                  data-selected={isSelected || undefined}
                  aria-pressed={isSelected}
                >
                  <span className={styles.cellRadio} data-selected={isSelected || undefined} />
                  <span className={styles.cellName}>{exportName}</span>
                </button>
                <div className={styles.cellContent} data-cell-content>
                  <Component />
                </div>
              </div>
            )
          })}
        </div>
      </BaseStyles>
    </ThemeProvider>
  )
}
