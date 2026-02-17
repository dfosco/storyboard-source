/**
 * localStorage utilities for persistent storyboard overrides.
 *
 * Mirrors the session.js (URL hash) API but persists values in localStorage.
 * All keys are prefixed with "storyboard:" to avoid collisions.
 *
 * Reactivity:
 * - Cross-tab: native "storage" event (fires in other tabs automatically)
 * - Intra-tab: custom "storyboard-storage" event on window (the native
 *   "storage" event does NOT fire in the tab that made the change)
 */

const PREFIX = 'storyboard:'

/**
 * Read a single value from localStorage.
 * @param {string} key - Unprefixed key (e.g. "settings.theme")
 * @returns {string|null}
 */
export function getLocal(key) {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

/**
 * Write a single value to localStorage and notify listeners.
 * @param {string} key - Unprefixed key
 * @param {string} value
 */
export function setLocal(key, value) {
  try {
    localStorage.setItem(PREFIX + key, String(value))
    notifyChange()
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

/**
 * Remove a single key from localStorage and notify listeners.
 * @param {string} key - Unprefixed key
 */
export function removeLocal(key) {
  try {
    localStorage.removeItem(PREFIX + key)
    notifyChange()
  } catch {
    // silently degrade
  }
}

/**
 * Return all storyboard-prefixed localStorage entries as a plain object.
 * Keys are returned WITHOUT the prefix.
 * @returns {Record<string, string>}
 */
export function getAllLocal() {
  const result = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const raw = localStorage.key(i)
      if (raw && raw.startsWith(PREFIX)) {
        result[raw.slice(PREFIX.length)] = localStorage.getItem(raw)
      }
    }
  } catch {
    // silently degrade
  }
  return result
}

/**
 * Subscribe to localStorage changes (both cross-tab and intra-tab).
 * Compatible with useSyncExternalStore.
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export function subscribeToStorage(callback) {
  const wrappedCallback = () => {
    invalidateSnapshotCache()
    callback()
  }
  // Cross-tab: native storage event
  window.addEventListener('storage', wrappedCallback)
  // Intra-tab: custom event
  window.addEventListener('storyboard-storage', wrappedCallback)
  return () => {
    window.removeEventListener('storage', wrappedCallback)
    window.removeEventListener('storyboard-storage', wrappedCallback)
  }
}

// ── Snapshot cache ──

let _snapshotCache = null

/** Invalidate the snapshot cache so the next getStorageSnapshot() recomputes. */
function invalidateSnapshotCache() {
  _snapshotCache = null
}

/**
 * Snapshot of all storyboard localStorage entries as a serialized string.
 * Used by useSyncExternalStore to detect changes.
 * Cached — invalidated on writes and storage events.
 * @returns {string}
 */
export function getStorageSnapshot() {
  if (_snapshotCache !== null) return _snapshotCache
  try {
    const entries = []
    for (let i = 0; i < localStorage.length; i++) {
      const raw = localStorage.key(i)
      if (raw && raw.startsWith(PREFIX)) {
        entries.push(raw + '=' + localStorage.getItem(raw))
      }
    }
    _snapshotCache = entries.sort().join('&')
    return _snapshotCache
  } catch {
    return ''
  }
}

// ── Internal ──

/** Fire a custom event so intra-tab listeners re-render. */
export function notifyChange() {
  invalidateSnapshotCache()
  window.dispatchEvent(new Event('storyboard-storage'))
}
