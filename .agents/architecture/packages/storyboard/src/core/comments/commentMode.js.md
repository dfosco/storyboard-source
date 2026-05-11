# `packages/storyboard/src/core/comments/commentMode.js`

<!--
source: packages/storyboard/src/core/comments/commentMode.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file is the comments mode state machine for the core layer. It tracks whether the app is in normal navigation mode or comment placement mode and publishes changes to any interested UI surface.

## Composition

Module-level state stores the active flag and a listener set. The API exposes read, toggle, set, and subscribe functions, with toggle enforcing both config enablement and authentication.

```js
export function toggleCommentMode() {
  if (!isCommentsEnabled()) {
    console.warn('[storyboard] Comments not enabled — check storyboard.config.json')
    return false
  }
  if (!_active && !isAuthenticated()) {
    console.warn('[storyboard] Sign in first to use comments')
    return false
  }
  _active = !_active
  _notify()
  return _active
}
```

## Dependencies

- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Prevents activation when comments are not configured.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Requires a signed-in user before enabling placement mode.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports the mode helpers.
- `packages/storyboard/src/core/comments/ui/mount.js` — Subscribes to mode changes when mounting the overlay.
- `packages/storyboard/src/core/comments/ui/CommentOverlay.js` — Toggles mode from overlay interactions.
- `packages/storyboard/src/core/comments/ui/commentsDrawer.js` — Clears mode when navigating from the drawer.
- [`packages/storyboard/src/core/comments/commentMode.test.js`](./commentMode.test.js.md) — Verifies state transitions.

## Notes

The state lives at module scope, so the whole comments runtime shares one global mode instance.
