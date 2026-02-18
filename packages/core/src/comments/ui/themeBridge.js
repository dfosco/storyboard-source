/**
 * Theme bridge — copies Primer theme attributes to elements outside the React tree.
 *
 * Primer's ThemeProvider sets data-color-mode, data-light-theme, data-dark-theme
 * on a wrapper div inside #root. Comments UI elements are appended to document.body
 * (outside the React tree), so they don't inherit these attributes.
 *
 * This utility copies the theme attributes onto injected elements and watches for
 * changes via MutationObserver.
 */

const THEME_ATTRS = ['data-color-mode', 'data-light-theme', 'data-dark-theme']

function findThemeSource() {
  return document.querySelector('[data-color-mode]')
}

/**
 * Copy Primer theme attributes onto a target element.
 * Also starts a MutationObserver to keep them in sync.
 * @param {HTMLElement} target - The element to apply theme attributes to
 * @returns {() => void} Cleanup function to disconnect the observer
 */
export function applyTheme(target) {
  const source = findThemeSource()

  function sync() {
    const src = findThemeSource()
    if (!src) return
    for (const attr of THEME_ATTRS) {
      const val = src.getAttribute(attr)
      if (val != null) {
        target.setAttribute(attr, val)
      } else {
        target.removeAttribute(attr)
      }
    }
  }

  sync()

  // Watch for theme changes on the source element
  if (source) {
    const observer = new MutationObserver(sync)
    observer.observe(source, { attributes: true, attributeFilter: THEME_ATTRS })
    return () => observer.disconnect()
  }

  return () => {}
}
