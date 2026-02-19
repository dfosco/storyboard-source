# @dfosco/storyboard-react

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.10.0

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.9.0

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.8.0

## 1.7.1

### Patch Changes

-   Fix Vite optimizeDeps error by auto-excluding @dfosco/storyboard-react from esbuild pre-bundling
    -   @dfosco/storyboard-core@1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.7.0

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.6.0

## 1.1.0

### Minor Changes

-   f7061c5: feat: add comments system with GitHub Discussions backend

    Storyboard now includes an optional comments system backed by GitHub Discussions. Collaborators can place contextual comments pinned to specific positions on any page.

    Features:

    -   Press C to enter comment mode — click anywhere to place a comment
    -   Comments stored as GitHub Discussions (one discussion per route)
    -   Position-aware pins that appear where comments were placed
    -   Threaded replies, reactions, resolve/unresolve, drag-to-move
    -   Comments drawer listing all comments for the current page
    -   GitHub personal access token authentication
    -   DevTools integration with comment menu items

    Configure via `storyboard.config.json` with a `comments` key pointing to your GitHub repo and discussions category.

    New exports from `@dfosco/storyboard-core/comments`:

    -   `initCommentsConfig()`, `mountComments()`, `isCommentsEnabled()`
    -   `toggleCommentMode()`, `fetchRouteDiscussion()`, `createComment()`
    -   `replyToComment()`, `resolveComment()`, `moveComment()`, `deleteComment()`
    -   `addReaction()`, `removeReaction()`
    -   `openCommentsDrawer()`, `closeCommentsDrawer()`

### Patch Changes

-   Updated dependencies [f7061c5]
    -   @dfosco/storyboard-core@1.1.0

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
-   Updated dependencies
    -   @dfosco/storyboard-core@1.0.1
