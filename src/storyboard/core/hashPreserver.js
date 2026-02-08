/**
 * Preserve URL hash params across all internal link navigations,
 * and use client-side routing to avoid full page reloads.
 *
 * Intercepts click events on <a> elements at the document level.
 * For same-origin internal links, prevents the default browser navigation
 * and uses the React Router instance to navigate client-side — preserving
 * the current URL hash.
 *
 * This works regardless of the link component used (Primer, React Router,
 * plain <a>, etc.).
 *
 * Hash is NOT preserved when:
 * - The link already has its own hash fragment
 * - The link points to an external origin
 * - The current URL has no hash
 *
 * @param {import('react-router-dom').Router} router - React Router instance
 * @param {string} basename - Router basename (e.g. "/storyboard")
 */
export function installHashPreserver(router, basename = '') {
  // Normalize basename: ensure no trailing slash
  const base = basename.replace(/\/+$/, '')

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
}
