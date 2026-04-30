import { useState, useEffect, useRef } from 'react'
import styles from './FrozenTerminalOverlay.module.css'

/**
 * Renders a frozen terminal preview from the latest server snapshot.
 * Shown when a terminal widget loses its live WebGL slot.
 *
 * Falls back to a styled placeholder if no snapshot is available.
 */

let Convert = null
let ansiLoadAttempted = false

async function getConverter() {
  if (Convert) return new Convert({ fg: '#e6edf3', bg: '#0d1117', newline: true })
  if (ansiLoadAttempted) return null
  ansiLoadAttempted = true
  try {
    const mod = await import(/* @vite-ignore */ 'ansi-to-html')
    Convert = mod.default || mod
    return new Convert({ fg: '#e6edf3', bg: '#0d1117', newline: true })
  } catch {
    return null
  }
}

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
}

function getBaseUrl() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  return base.endsWith('/') ? base : base + '/'
}

export default function FrozenTerminalOverlay({ widgetId, width, height, onActivate, prettyName }) {
  const [html, setHtml] = useState(null)
  const [plainText, setPlainText] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSnapshot() {
      const baseUrl = getBaseUrl()
      const urls = [
        `${baseUrl}_storyboard/canvas/terminal-snapshot/${widgetId}`,
        `${baseUrl}_storyboard/terminal-snapshots/${widgetId}.snapshot.json`,
      ]

      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          const data = await res.json()
          if (cancelled) return
          const text = data.paneContent || data.content || data.output || ''
          if (!text) continue

          const converter = await getConverter()
          if (cancelled) return
          if (converter) {
            setHtml(converter.toHtml(text))
          } else {
            setPlainText(stripAnsi(text))
          }
          setLoaded(true)
          return
        } catch {
          continue
        }
      }
      // No snapshot available — show placeholder
      if (!cancelled) setLoaded(true)
    }

    fetchSnapshot()
    return () => { cancelled = true }
  }, [widgetId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [html, plainText])

  return (
    <div
      className={styles.overlay}
      style={{
        width: typeof width === 'number' ? `${width}px` : undefined,
        height: typeof height === 'number' ? `${height}px` : undefined,
      }}
    >
      <div ref={contentRef} className={styles.snapshotContent}>
        {html && (
          <pre
            className={styles.snapshotPre}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {!html && plainText && (
          <pre className={styles.snapshotPre}>{plainText}</pre>
        )}
        {loaded && !html && !plainText && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderLabel}>
              {prettyName || 'Terminal'} · paused
            </span>
          </div>
        )}
      </div>
      <div
        className={styles.activateOverlay}
        onClick={onActivate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onActivate?.() }}
        aria-label="Click to activate terminal"
      >
        <span className={styles.frozenBadge}>⏸ Paused</span>
        <span className={styles.activateHint}>Click to resume</span>
      </div>
    </div>
  )
}
