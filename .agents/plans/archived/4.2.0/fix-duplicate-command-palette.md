# Fix: Remove duplicate CommandPalette mount

The `StoryboardCommandPalette` is now auto-mounted by `StoryboardProvider` (from `@dfosco/storyboard-react`). If your client repo also mounts it explicitly, you'll get **two instances fighting over focus** — the search input won't focus and keyboard nav won't work.

## Fix

In your root render file (e.g. `src/index.jsx` or `src/main.jsx`):

1. **Remove** the `<StoryboardCommandPalette>` component
2. **Remove** the import: `import { StoryboardCommandPalette } from '@dfosco/storyboard-react'`

The provider handles it automatically — no manual mount needed.
