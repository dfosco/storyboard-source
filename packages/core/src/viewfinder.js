import { loadScene } from './loader.js'

/**
 * Deterministic hash from a string — used for seeding generative placeholders.
 * @param {string} str
 * @returns {number}
 */
export function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Resolve the target route path for a scene.
 *
 * 1. If scene name matches a known route (case-insensitive), use that route
 * 2. If scene data has a `sceneMeta.route` or `route` key, use that
 * 3. Fall back to root "/"
 *
 * @param {string} sceneName
 * @param {string[]} knownRoutes - Array of route names (e.g. ["Dashboard", "Repositories"])
 * @returns {string} Full path with ?scene= param
 */
export function resolveSceneRoute(sceneName, knownRoutes = []) {
  // Case-insensitive match against known routes
  for (const route of knownRoutes) {
    if (route.toLowerCase() === sceneName.toLowerCase()) {
      return `/${route}?scene=${encodeURIComponent(sceneName)}`
    }
  }

  // Check for explicit route in sceneMeta or top-level route key
  try {
    const data = loadScene(sceneName)
    const route = data?.sceneMeta?.route || data?.route
    if (route) {
      const normalized = route.startsWith('/') ? route : `/${route}`
      return `${normalized}?scene=${encodeURIComponent(sceneName)}`
    }
  } catch {
    // ignore load errors
  }

  return `/?scene=${encodeURIComponent(sceneName)}`
}

/**
 * Get sceneMeta for a scene (route, author, etc).
 *
 * @param {string} sceneName
 * @returns {{ route?: string, author?: string } | null}
 */
export function getSceneMeta(sceneName) {
  try {
    const data = loadScene(sceneName)
    return data?.sceneMeta || null
  } catch {
    return null
  }
}
