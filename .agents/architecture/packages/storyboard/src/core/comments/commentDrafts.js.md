# `packages/storyboard/src/core/comments/commentDrafts.js`

<!--
source: packages/storyboard/src/core/comments/commentDrafts.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module persists in-progress comment and reply drafts so authoring survives refreshes and reopened windows. It gives the UI a single structured store rather than scattering draft state across many storage keys.

## Composition

Internal helpers read and write one JSON object under `sb-comment-drafts`. Public exports save, retrieve, and clear entries plus generate canonical keys for top-level composers and per-thread replies.

```js
export function composerDraftKey(route) {
  return `comment:${route}`
}

export function replyDraftKey(commentId) {
  return `reply:${commentId}`
}
```

## Dependencies

This file has no significant module imports beyond platform globals such as `fetch`, `localStorage`, or the test runner.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports draft helpers.
- `packages/storyboard/src/core/comments/ui/Composer.jsx` — Uses top-level draft persistence.
- `packages/storyboard/src/core/comments/ui/CommentWindow.jsx` — Stores reply drafts while threads are open.
- `packages/storyboard/src/core/comments/ui/composer.js` — Shares the same keying rules in the non-React path.

## Notes

Draft entries include a `type` discriminator so the same backing store can safely hold top-level comments and replies.
