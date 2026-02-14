/**
 * Preserve URL hash params across all navigations — both <a> clicks
 * and programmatic router.navigate() calls.
 *
 * Hash is NOT preserved when:
 * - The target path already has its own hash fragment
 * - The link points to an external origin (click handler only)
 * - The current URL has no hash
 *
 * @param {import('react-router-dom').Router} router - React Router instance
 * @param {string} basename - Router basename (e.g. "/storyboard")
 */
export function installHashPreserver(router, basename = '') {
  // Normalize basename: ensure no trailing slash
  const base = basename.replace(/\/+$/, '')

  // --- 1. Intercept <a> clicks ---
  document.addEventListener('click', (e) => {
    // Skip if modifier keys are held (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    const anchor = e.target.closest('a[href]')
    if (!anchor) return
    if (anchor.target === '_blank') return

    const targetUrl = new URL(anchor.href, window.location.origin)

    // Skip external links
    if (targetUrl.origin !== window.location.origin) return

    // Determine the hash to carry forward
    const currentHash = window.location.hash
    const hasCurrentHash = currentHash && currentHash !== '#'
    const targetHasOwnHash = targetUrl.hash && targetUrl.hash !== '#'

    // Use the target's own hash if it has one, otherwise carry current hash
    const hash = targetHasOwnHash ? targetUrl.hash : (hasCurrentHash ? currentHash : '')

    // Strip basename to get the route path
    let pathname = targetUrl.pathname
    if (base && pathname.startsWith(base)) {
      pathname = pathname.slice(base.length) || '/'
    }

    // Prevent full page reload — navigate client-side
    e.preventDefault()
    router.navigate(pathname + targetUrl.search + hash)
  })

  // --- 2. Intercept programmatic router.navigate() ---
  const originalNavigate = router.navigate.bind(router)
  router.navigate = (to, opts) => {
    const currentHash = window.location.hash
    const hasCurrentHash = currentHash && currentHash !== '#'

    if (hasCurrentHash && typeof to === 'string' && !to.includes('#')) {
      to = to + currentHash
    }

    return originalNavigate(to, opts)
  }
}
