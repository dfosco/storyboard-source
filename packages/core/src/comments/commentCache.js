/**
 * localStorage cache for comment pin data.
 *
 * Stores lightweight comment listings per route so pins render instantly
 * on repeat visits without hitting the GitHub API.
 */

const CACHE_PREFIX = 'sb-comments:'
const TTL_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Get cached comment listing for a route.
 * Returns null if cache is missing or expired.
 * @param {string} route
 * @returns {object|null} - Cached discussion object (with .comments array)
 */
export function getCachedComments(route) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + route)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + route)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

/**
 * Store comment listing in cache for a route.
 * @param {string} route
 * @param {object} data - Discussion object with .comments array
 */
export function setCachedComments(route, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + route, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/**
 * Clear cached comments for a specific route.
 * @param {string} route
 */
export function clearCachedComments(route) {
  try {
    localStorage.removeItem(CACHE_PREFIX + route)
  } catch {
    // ignore
  }
}
