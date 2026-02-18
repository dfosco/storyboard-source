/**
 * Comments configuration — load and validate storyboard.config.json
 *
 * The config is passed in at app startup via initCommentsConfig().
 * This mirrors the core init() pattern.
 */

let _config = null

/**
 * Initialize comments config from storyboard.config.json contents.
 * @param {object} rawConfig - The parsed storyboard.config.json object
 */
export function initCommentsConfig(rawConfig) {
  if (!rawConfig || !rawConfig.comments) {
    _config = null
    return
  }
  const c = rawConfig.comments
  _config = {
    repo: {
      owner: c.repo?.owner ?? '',
      name: c.repo?.name ?? '',
    },
    discussions: {
      category: c.discussions?.category ?? 'Storyboard Comments',
    },
  }
}

/**
 * Get the current comments config. Returns null if not configured.
 */
export function getCommentsConfig() {
  return _config
}

/**
 * Check whether the comments system is enabled (config was provided and valid).
 */
export function isCommentsEnabled() {
  return _config !== null && _config.repo.owner !== '' && _config.repo.name !== ''
}
