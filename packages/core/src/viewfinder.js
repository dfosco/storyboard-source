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
 * 2. If scene data has a `route` key, use that
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

  // Check for explicit `route` key in scene data
  try {
    const data = loadScene(sceneName)
    if (data?.route) {
      const route = data.route.startsWith('/') ? data.route : `/${data.route}`
      return `${route}?scene=${encodeURIComponent(sceneName)}`
    }
  } catch {
    // ignore load errors
  }

  return `/?scene=${encodeURIComponent(sceneName)}`
}
