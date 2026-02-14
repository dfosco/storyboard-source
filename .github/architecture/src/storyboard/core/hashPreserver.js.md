# `src/storyboard/core/hashPreserver.js`

<!--
source: src/storyboard/core/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Preserve URL hash params (session state) across **all** navigations — both `<a>` link clicks and programmatic `router.navigate()` calls — and convert browser-default `<a>` click navigation into client-side React Router transitions to avoid full page reloads.

Without this module, clicking any Primer component that renders an `<a href>` tag (e.g., `UnderlineNav.Item`, `NavList.Item`) would trigger a full browser navigation, causing a white flash and losing any hash params. Similarly, programmatic `navigate('/Page')` calls from React Router's `useNavigate` would drop the hash entirely since React Router doesn't know about it.

## Composition

```js
export function installHashPreserver(router, basename = '') {
  const base = basename.replace(/\/+$/, '')

  // --- 1. Intercept <a> clicks ---
  document.addEventListener('click', (e) => {
    // Skip modifier keys, external links, target="_blank"
    // Carry current hash to target URL (unless target has its own)
    // Strip basename, then e.preventDefault() + router.navigate(path + search + hash)
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
```

**Key behaviors:**
- **Client-side navigation** — Prevents default browser navigation for `<a>` clicks, uses `router.navigate()` instead (no full page reload)
- **Programmatic navigate patching** — Wraps `router.navigate()` to automatically append the current hash when the target path has no hash of its own
- **Hash forwarding** — Appends current `window.location.hash` to the target URL if the link/path doesn't define its own hash
- **Basename stripping** — Removes the router basename (e.g., `/storyboard`) from the target pathname before navigating
- **Modifier key passthrough** — Skips interception for meta/ctrl/shift/alt clicks (allows "open in new tab")
- **External link passthrough** — Only intercepts same-origin links

## Dependencies

None — pure vanilla DOM API. Receives the React Router instance and basename as arguments.

## Dependents

- [`src/index.jsx`](../../index.jsx.md) — Called once at app startup with the router instance and `import.meta.env.BASE_URL`
- [`src/storyboard/index.js`](../index.js.md) — Re-exported as `installHashPreserver`

## Notes

- **Why document-level** — A single listener on `document` catches all link clicks regardless of which component rendered the `<a>` tag. This is essential because Primer React components (`UnderlineNav.Item`, `NavList.Item`, etc.) render plain `<a>` tags that don't use React Router's `<Link>`.
- **Why monkey-patch `router.navigate()`** — React Router's `useNavigate()` hook returns a function that ultimately calls `router.navigate()`. By wrapping this once at the router level, all programmatic navigations (from any page, any component) automatically preserve hash params without any per-page code.
- **Interaction with `switchScene()`** — The `useScene().switchScene()` function intentionally clears the hash when switching scenes (since hash params belong to the previous scene's data context). It uses `window.location.href =` which bypasses this interceptor because it's not an `<a>` click or `router.navigate()` call.
