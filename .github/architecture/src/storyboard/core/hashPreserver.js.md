# `src/storyboard/core/hashPreserver.js`

<!--
source: src/storyboard/core/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Preserve URL hash params (session state) across all internal page navigations and convert browser-default `<a>` click navigation into client-side React Router transitions to avoid full page reloads.

Without this module, clicking any Primer component that renders an `<a href>` tag (e.g., `UnderlineNav.Item`, `NavList.Item`) would trigger a full browser navigation, causing a white flash and losing any hash params not explicitly included in the link's `href`.

## Composition

```js
export function installHashPreserver(router, basename = '') {
  document.addEventListener('click', (e) => {
    // 1. Skip modifier keys (cmd+click → new tab)
    // 2. Find closest <a href>
    // 3. Skip external links, target="_blank"
    // 4. Carry current hash to target URL (unless target has its own)
    // 5. Strip basename to get route path
    // 6. e.preventDefault() + router.navigate(path + search + hash)
  })
}
```

**Key behaviors:**
- **Client-side navigation** — Prevents default browser navigation, uses `router.navigate()` instead (no full page reload)
- **Hash forwarding** — Appends current `window.location.hash` to the target URL if the link doesn't define its own hash
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
- **Interaction with `switchScene()`** — The `useScene().switchScene()` function intentionally clears the hash when switching scenes (since hash params belong to the previous scene's data context). It uses `window.location.href =` which bypasses this interceptor because it's not an `<a>` click.
