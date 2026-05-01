import { useState, useEffect } from 'react'
import styles from './FrozenTerminalOverlay.module.css'

/**
 * Renders a frozen terminal preview from the latest server snapshot.
 * Shown when a terminal widget loses its live WebGL slot but the
 * server-side tmux session is still running.
 *
 * Layout: faded snapshot background + centered status badge + action text.
 * The entire overlay is the click target.
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

export default function FrozenTerminalOverlay({ widgetId, onActivate }) {
  const [html, setHtml] = useState(null)
  const [plainText, setPlainText] = useState(null)

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
          return
        } catch {
          continue
        }
      }
    }

    fetchSnapshot()
    return () => { cancelled = true }
  }, [widgetId])

  const hasSnapshot = !!(html || plainText)

  return (
    <div
      className={styles.overlay}
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onActivate?.() }}
      aria-label="Click to resume terminal"
    >
      {/* Faded snapshot background */}
      {hasSnapshot && (
        <div className={styles.snapshotContent}>
          {html && (
            <pre
              className={styles.snapshotPre}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
          {!html && plainText && (
            <pre className={styles.snapshotPre}>{plainText}</pre>
          )}
        </div>
      )}

      {/* Status + action */}
      <div className={styles.statusLayer}>
        <span className={styles.statusBadge}>
          Running in background
          <span className={styles.orbitSpinner} />
        </span>
        <span className={styles.actionText}>Click to resume</span>
      </div>
    </div>
  )
}
