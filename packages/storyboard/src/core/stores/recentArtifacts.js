/**
 * Recent Artifacts — localStorage-backed recents for the command palette.
 *
 * Stores artifact identity (type + key + label), not routes.
 * Routes are derived at read time from the live data index so they
 * stay correct across branch/basePath changes.
 */

const STORAGE_KEY = 'storyboard:recent-artifacts'
const MAX_ITEMS = 10

/**
 * @typedef {{ type: string, key: string, label: string }} RecentEntry
 */

/**
 * Track a recently visited artifact.
 * Pushes to the top, deduplicates by type+key, trims to MAX_ITEMS.
 *
 * @param {string} type  — 'prototype' | 'canvas' | 'story' | 'flow'
 * @param {string} key   — unique identifier (e.g. dirName, canvas id, story name)
 * @param {string} label — display label
 */
export function trackRecent(type, key, label) {
  if (!type || !key) return
  const entries = _read()
  const deduped = entries.filter(e => !(e.type === type && e.key === key))
  deduped.unshift({ type, key, label: label || key })
  _write(deduped.slice(0, MAX_ITEMS))
}

/**
 * Get the list of recently visited artifacts, newest first.
 * @returns {RecentEntry[]}
 */
export function getRecent() {
  return _read()
}

/**
 * Clear all recent artifacts. Useful for testing.
 */
export function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function _read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function _write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* quota exceeded or unavailable */ }
}
