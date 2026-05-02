/**
 * Customer Mode Config — runtime store for customerMode config.
 * Framework-agnostic (zero npm dependencies).
 */

let _config = { enabled: false, hideChrome: false, hideHomepage: false, protoHomepage: '' }

/**
 * Initialize customer mode config.
 * @param {object} config - The customerMode object from storyboard.config.json
 */
export function initCustomerModeConfig(config) {
  _config = { enabled: false, hideChrome: false, hideHomepage: false, protoHomepage: '', ...config }
}

/**
 * Get the current customer mode config.
 * @returns {{ enabled: boolean, hideChrome: boolean, hideHomepage: boolean, protoHomepage: string }}
 */
export function getCustomerModeConfig() {
  return _config
}

/**
 * Check if customer mode is enabled.
 * @returns {boolean}
 */
export function isCustomerMode() {
  return _config.enabled
}
