---
"@dfosco/storyboard-core": minor
"@dfosco/storyboard-react": minor
"@dfosco/storyboard-react-primer": minor
"@dfosco/storyboard-react-reshaped": minor
---

feat: add comments system with GitHub Discussions backend

Storyboard now includes an optional comments system backed by GitHub Discussions. Collaborators can place contextual comments pinned to specific positions on any page.

Features:
- Press C to enter comment mode — click anywhere to place a comment
- Comments stored as GitHub Discussions (one discussion per route)
- Position-aware pins that appear where comments were placed
- Threaded replies, reactions, resolve/unresolve, drag-to-move
- Comments drawer listing all comments for the current page
- GitHub personal access token authentication
- DevTools integration with comment menu items

Configure via `storyboard.config.json` with a `comments` key pointing to your GitHub repo and discussions category.

New exports from `@dfosco/storyboard-core/comments`:
- `initCommentsConfig()`, `mountComments()`, `isCommentsEnabled()`
- `toggleCommentMode()`, `fetchRouteDiscussion()`, `createComment()`
- `replyToComment()`, `resolveComment()`, `moveComment()`, `deleteComment()`
- `addReaction()`, `removeReaction()`
- `openCommentsDrawer()`, `closeCommentsDrawer()`
