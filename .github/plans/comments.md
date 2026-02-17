# Storyboard Comments — Implementation Plan

## Problem

Add a commenting system to storyboard prototypes backed by GitHub Discussions. Comments are positional (x,y on the page), threaded, and support reactions. The system mirrors the design-drops approach: PAT-based auth, direct GitHub GraphQL API calls, localStorage for token storage.

## Design Decisions

- **Config-driven:** A `storyboard.config.json` at repo root configures the target repo, discussion category, etc.
- **PAT auth:** Users paste a GitHub PAT in a browser UI (DevTools panel or modal). Token stored in localStorage. Same approach as drops.
- **Percentage-based coordinates:** Comment positions stored as `(x%, y%)` relative to the main content area — resolution-independent.
- **Discussion category:** Configurable in config file (default: `"Storyboard Comments"`).
- **One Discussion per route:** The first comment on a route creates a Discussion titled after the route path. All subsequent comments on that route become comment threads on that Discussion.
- **Metadata in comment body:** Each comment body contains a `<!-- sb-meta {...} -->` block with structured JSON (x, y, status, route) similar to drops' `dd-meta` pattern.

## Data Model (GitHub Discussions mapping)

```
Discussion (1 per route)
  ├── title: "Comments: /Overview"
  ├── body: <!-- sb-meta {"route":"/Overview","createdAt":"..."} -->
  │
  ├── Comment Thread (1 per positional comment)
  │   ├── body: <!-- sb-meta {"x":45.2,"y":30.1} --> Actual comment text
  │   ├── reactions: 👍 ❤️ 🎉 etc.
  │   │
  │   ├── Reply (sub-thread)
  │   │   ├── body: Reply text (no positional metadata)
  │   │   └── reactions: 👍 ❤️ etc.
  │   └── Reply ...
  │
  └── Comment Thread ...
```

### Comment metadata format

```json
<!-- sb-meta {"x": 45.2, "y": 30.1} -->
```

Embedded as an HTML comment at the start of the Discussion comment body. Parsed/serialized by a dedicated `metadata.js` utility (following drops' `metadata.ts` pattern).

### Closing = "Mark as done"

When an author marks their comment as done, the system **does not** close the Discussion (that would hide ALL comments on the route). Instead, the comment body metadata is updated to include `"resolved": true`, and it's rendered with a visual "resolved" state. 

**Alternative considered:** Using GitHub's "minimize comment" feature — but the GraphQL API doesn't support it well.

### Deleting replies

Reply authors can delete their own sub-comments via the `deleteDiscussionComment` mutation.

### Moving comments

Original authors can drag to reposition. This updates the `<!-- sb-meta -->` block in the comment body via `updateDiscussionComment` mutation with new x,y values.

## Architecture

### New files to create

```
storyboard/
  comments/                          # New comments module (framework-agnostic core)
    config.js                        # Load & validate storyboard.config.json
    graphql.js                       # GitHub GraphQL client (fetch wrapper, retry, auth errors)
    queries.js                       # GraphQL query/mutation strings
    api.js                           # Public API: fetchRouteDiscussion, createComment, reply, resolve, move, delete, reactions
    metadata.js                      # Parse/serialize <!-- sb-meta {...} --> blocks
    auth.js                          # PAT validation, token storage (localStorage)
    index.js                         # Barrel exports

  internals/
    hooks/
      useComments.js                 # Hook: load comments for current route, CRUD operations
      useCommentAuth.js              # Hook: auth state, login/logout
      useCommentMode.js              # Hook: comment mode toggle (C key), cursor state
    components/
      Comments/
        CommentOverlay.jsx           # Full-page overlay that renders comment pins
        CommentOverlay.module.css
        CommentPin.jsx               # Individual pin marker on the page
        CommentPin.module.css
        CommentThread.jsx            # Expanded thread popover (comment + replies)
        CommentThread.module.css
        CommentComposer.jsx          # New comment input (appears at click position)
        CommentComposer.module.css
        ReactionPicker.jsx           # Emoji reaction picker (reuse GitHub's reaction set)
        ReactionPicker.module.css
        AuthModal.jsx                # PAT entry modal
        AuthModal.module.css
        CommentList.jsx              # Debug panel: list all discussions/comments
        CommentList.module.css

storyboard.config.json               # Config file at repo root
```

### Config file format

```json
// storyboard.config.json
{
  "comments": {
    "repo": {
      "owner": "dfosco",
      "name": "storyboard"
    },
    "discussions": {
      "category": "Storyboard Comments"
    }
  }
}
```

### Integration points

1. **DevTools enhancement:** Add "Show all comments" button to existing DevTools menu → opens CommentList panel
2. **`_app.jsx` or `index.jsx`:** Mount `<CommentOverlay />` alongside `<DevTools />` — it renders at the app root level
3. **Keyboard shortcut:** `C` key (when not in input) toggles comment mode — handled by `useCommentMode` hook, registered globally
4. **Comment mode cursor:** Custom CSS cursor (`crosshair` or custom SVG) when comment mode is active

## Implementation Todos

### Phase 1: Core infrastructure
1. **config** — Create `storyboard.config.json` and config loader (`storyboard/comments/config.js`)
2. **graphql-client** — Port GraphQL client from drops (`storyboard/comments/graphql.js`) — adapted for React/Vite (no TypeScript)
3. **metadata** — Create `<!-- sb-meta -->` parser/serializer (`storyboard/comments/metadata.js`)
4. **auth** — Create PAT auth module with localStorage persistence (`storyboard/comments/auth.js`)
5. **queries** — Write all GraphQL queries and mutations (`storyboard/comments/queries.js`)
6. **api** — Create public API layer: fetch, create, reply, resolve, move, delete, reactions (`storyboard/comments/api.js`)
7. **barrel** — Create barrel export (`storyboard/comments/index.js`)

### Phase 2: React hooks
8. **useCommentAuth** — Auth state hook (token, user, login/logout)
9. **useComments** — Comments hook: load route discussion, comments list, CRUD
10. **useCommentMode** — Comment mode toggle hook (C key shortcut, cursor state)

### Phase 3: UI components
11. **AuthModal** — PAT entry modal with instructions and validation
12. **CommentPin** — Pin marker component (numbered, colored by status)
13. **CommentComposer** — New comment text input at click position
14. **CommentThread** — Expanded thread: comment body, replies, reactions, resolve button
15. **ReactionPicker** — Emoji reaction picker (GitHub's 8 reactions)
16. **CommentOverlay** — Full-page overlay: renders pins, handles click-to-place, drag-to-move
17. **CommentList** — Debug panel: all discussions for the configured category

### Phase 4: Integration
18. **devtools-integration** — Add "Show all comments" to DevTools menu, add "Sign in for comments" when not authenticated
19. **app-mount** — Mount CommentOverlay in `_app.jsx` or `index.jsx`
20. **keyboard-shortcut** — Register global `C` key handler for comment mode

## Key Technical Details

### GraphQL operations needed

| Operation | Mutation/Query | Notes |
|---|---|---|
| Find route discussion | `search` query | Search by title pattern "Comments: /route" |
| Create route discussion | `createDiscussion` | First comment on a route triggers this |
| Fetch comments | `node` query by discussion ID | With comments, replies, reactions |
| Add comment | `addDiscussionComment` | New thread on the route discussion |
| Reply to comment | `addDiscussionComment` with `replyToId` | Sub-thread reply |
| Resolve comment | `updateDiscussionComment` | Update body metadata to add `"resolved": true` |
| Move comment | `updateDiscussionComment` | Update body metadata with new x,y |
| Delete reply | `deleteDiscussionComment` | Only replies (sub-comments) |
| Add reaction | `addReaction` | On comments or replies |
| Remove reaction | `removeReaction` | On comments or replies |
| List all discussions | `discussions` query with categoryId | For debug panel |

### PAT scopes required

- `repo` — read/write Discussions
- `read:user` — fetch user profile for avatar/login

### Comment mode UX flow

1. User presses `C` (or clicks DevTools button) → comment mode activates
2. Cursor changes to crosshair, all existing comment pins become visible
3. User clicks on the page → CommentComposer appears at click position
4. User types comment and submits → pin appears, comment saved to GitHub
5. Press `C` or `Escape` → exit comment mode, pins hide

### Coordinate system

- Coordinates are `%`-based relative to the `<main>` content area (or the nearest positioned parent)
- Stored as `{ x: 45.2, y: 30.1 }` (percentage with 1 decimal)
- Calculated on click: `(event.offsetX / container.offsetWidth) * 100`

## Notes

- All code is plain JavaScript (no TypeScript) — matching the storyboard codebase
- Use `@primer/react` components for all UI (ActionMenu, Dialog, TextInput, Button, etc.)
- Use CSS Modules for styling (no `sx` prop, no `<Box>`)
- The comments system is entirely opt-in — if no `storyboard.config.json` exists or has no `comments` section, the feature is dormant
- No `useState` in pages — but hooks/components within the comments system can use local React state since they are self-contained system components (similar to DevTools which already uses useState)
