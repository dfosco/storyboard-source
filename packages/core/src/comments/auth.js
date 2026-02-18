/**
 * PAT authentication for comments.
 *
 * Stores and retrieves the GitHub PAT from localStorage.
 * Provides validation by fetching the authenticated user.
 */

const STORAGE_KEY = 'sb-comments-token'
const USER_KEY = 'sb-comments-user'

/**
 * Get the stored PAT token.
 * @returns {string|null}
 */
export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Store a PAT token.
 * @param {string} token
 */
export function setToken(token) {
  localStorage.setItem(STORAGE_KEY, token)
}

/**
 * Remove the stored PAT token and user.
 */
export function clearToken() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Get the cached authenticated user info.
 * @returns {{ login: string, avatarUrl: string }|null}
 */
export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Validate a PAT by fetching the authenticated user from GitHub.
 * Caches the result in localStorage on success.
 * @param {string} token - GitHub PAT to validate
 * @returns {Promise<{ login: string, avatarUrl: string }>}
 */
export async function validateToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Invalid token — GitHub returned ' + res.status)
  }

  const user = await res.json()
  const userInfo = { login: user.login, avatarUrl: user.avatar_url }
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
  return userInfo
}

/**
 * Check whether the user is currently authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getToken() !== null
}
