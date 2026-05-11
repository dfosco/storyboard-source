# `packages/storyboard/src/core/comments/index.js`

<!--
source: packages/storyboard/src/core/comments/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file is the public barrel for the core comments subsystem. It gathers config, auth, mode, metadata, API, cache, drafts, and low-level transport into one import surface for both React and non-React consumers.

## Composition

The file contains only re-exports, but the grouping is architectural: callers can import one module and still reach both the high-level comments API and supporting utilities.

```js
export { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './config.js'
export { getToken, setToken, clearToken, getCachedUser, validateToken, isAuthenticated } from './auth.js'
export { isCommentModeActive, toggleCommentMode, setCommentMode, subscribeToCommentMode } from './commentMode.js'
export { fetchRouteDiscussion, fetchRouteCommentsSummary, fetchCommentDetail, createComment, replyToComment, resolveComment, unresolveComment, editComment, editReply, moveComment, deleteComment, addReaction, removeReaction, listDiscussions } from './api.js'
```

## Dependencies

- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Re-exported configuration layer.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Re-exported auth helpers.
- [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md) — Re-exported global mode state.
- [`packages/storyboard/src/core/comments/metadata.js`](./metadata.js.md) — Re-exported metadata helpers.
- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Re-exported high-level comments operations.
- [`packages/storyboard/src/core/comments/commentCache.js`](./commentCache.js.md) — Re-exported caching helpers.
- [`packages/storyboard/src/core/comments/commentDrafts.js`](./commentDrafts.js.md) — Re-exported draft persistence.
- [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md) — Re-exported low-level transport.

## Dependents

- `packages/storyboard/src/internals/AuthModal/AuthModal.jsx` — Dynamically imports the barrel to validate and save tokens.

## Notes

Most runtime consumers import leaf modules directly from `core/comments/ui`, but this barrel remains the integration point for code that wants the full comments surface.
