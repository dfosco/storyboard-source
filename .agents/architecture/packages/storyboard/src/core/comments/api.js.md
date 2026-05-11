# `packages/storyboard/src/core/comments/api.js`

<!--
source: packages/storyboard/src/core/comments/api.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module is the high-level comments service for the Storyboard core comments feature. It turns route names, coordinates, and raw GitHub Discussion payloads into comment operations that the UI layer can call without knowing GraphQL details.

## Composition

It exports fetch helpers for route discussions and comment detail, plus write operations for create, reply, resolve, edit, move, delete, and reactions. A private helper resolves repository and discussion category IDs before creating or listing discussions.

```js
export async function createComment(route, x, y, text) {
  let discussion = await fetchRouteDiscussion(route)
  if (!discussion) {
    const { repositoryId, categoryId } = await getRepoAndCategoryIds()
    const body = serializeMetadata({ route, createdAt: new Date().toISOString() }, '')
    const result = await graphql(CREATE_DISCUSSION, { repositoryId, categoryId, title: `Comments: ${route}`, body })
    discussion = result.createDiscussion.discussion
  }
  const body = serializeMetadata({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }, text)
  const result = await graphql(ADD_COMMENT, { discussionId: discussion.id, body })
  return result.addDiscussionComment.comment
}
```

## Dependencies

- [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md) — Wraps authenticated GitHub GraphQL calls.
- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Supplies repository owner/name and discussion category config.
- [`packages/storyboard/src/core/comments/metadata.js`](./metadata.js.md) — Parses and rewrites embedded coordinate metadata.
- [`packages/storyboard/src/core/comments/queries.js`](./queries.js.md) — Provides the query and mutation strings used for each operation.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports the public API surface.
- `packages/storyboard/src/core/comments/ui/mount.js` — Loads summaries, details, drag updates, and comment creation.
- `packages/storyboard/src/core/comments/ui/CommentWindow.jsx` — Uses reply, reaction, resolve, edit, and delete operations.
- `packages/storyboard/src/core/comments/ui/CommentsDrawer.jsx` — Lists and fetches route discussions for the drawer view.
- [`packages/storyboard/src/core/comments/api.test.js`](./api.test.js.md) — Exercises the module with mocked GraphQL responses.

## Notes

The module rounds comment coordinates to one decimal place before persistence and uses a lightweight summary query for pin rendering.
