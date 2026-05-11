# `packages/storyboard/src/internals/Viewfinder.jsx`
<!--
source: packages/storyboard/src/internals/Viewfinder.jsx
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`Viewfinder.jsx` is the workspace homescreen — the SaaS-style landing page at `/workspace` that displays all prototypes, canvases, and story components in a card grid with a sidebar. It's the primary navigation hub for a storyboard project: users browse, star, search, and launch artifacts from here.

The component is data-driven: it calls `buildPrototypeIndex()` and `listStories()` from the core data layer to build its item list. It supports folder grouping, starring (localStorage), recent items, sorting (A-Z or by last updated), search filtering via fuzzy matching, inline metadata editing (title, description, author), and artifact deletion via the `/_storyboard/artifact/` server API. GitHub user authentication state is reactively read from localStorage and the `storyboard:auth-changed` custom event. The toolbar theme is observed via `MutationObserver` on `data-sb-toolbar-theme` and synced to `document.body` so BaseUI portals inherit Primer's color scheme correctly.

## Composition

Key internal building blocks:

```jsx
// Theme bridge: observes data-sb-toolbar-theme → syncs data-color-mode etc. to body
function useToolbarTheme() { ... }

// GitHub user: reads from localStorage (PAT cache), listens to storyboard:auth-changed
function useGitHubUser() { ... }

// localStorage-backed starred + recents using useSyncExternalStore
function useStarred() { return { starred: Set, toggle: fn } }
function useRecent() { return recentIds[] }

// Card grid rendering with star, actions menu, edit modal, delete confirm
function PrototypeCard({ item, basePath, ... }) { ... }

// Delete confirmation dialog
function DeleteConfirmDialog({ item, dirName, basePath, onClose }) { ... }

// Edit artifact metadata modal (PATCH /_storyboard/artifact/)
function EditArtifactModal({ item, dirName, basePath, onClose }) { ... }

// Folder accordion / group display
function FolderGroup({ folder, ... }) { ... }

// Main export
export default function Viewfinder({ basePath }) {
  const index = buildPrototypeIndex()       // flows/prototypes/canvases/folders
  const stories = listStories()             // story names from data index
  const [filter, setFilter] = useState('')  // search query
  const [sort, setSort] = useState('updated')  // 'updated' | 'title'
  // ... renders sidebar + main grid
}
```

The component uses `useBranches` from [`BranchBar/useBranches.js`](./BranchBar/BranchBar.jsx.md) to populate the branch selector in the sidebar for switching between worktree devservers.

## Dependencies

- [`../core/index.js`](../core/index.js.md) — `buildPrototypeIndex`, `listStories`, `getStoryData`, `BranchSelect`
- [`./Icon.jsx`](./Icon.jsx.md) — icon renderer
- `./BranchBar/useBranches.js` — branch list hook
- `@primer/octicons-react` — icons (`MarkGithubIcon`, `GitBranchIcon`, etc.)
- `@base-ui/react/menu`, `@base-ui/react/dialog` — dropdown menus and modals
- CSS Modules — `Viewfinder.module.css`

## Dependents

- [`Workspace.jsx`](./Workspace.jsx.md) — thin re-export wrapper (`export { default } from './Viewfinder.jsx'`)
- [`index.js`](./index.js.md) — re-exports `Workspace` and deprecated `Viewfinder` aliases

## Notes

- The file is named `Viewfinder.jsx` for historical reasons; the public export is `Workspace`. The `Workspace.jsx` shim provides the canonical name.
- Artifact editing and deletion call `/_storyboard/artifact/` (PATCH/DELETE) which is handled by the server plugin. After a mutation, `window.location.reload()` is called since the data index is static per dev-server startup.
- The `useToolbarTheme` hook syncs the toolbar's `data-sb-toolbar-theme` attribute to `document.body` color-mode attributes so BaseUI portal components (menus, dialogs) respect the active Primer theme.
- `useSyncExternalStore` is used for starred/recents so updates from other tabs (via the `storage` event) are reflected immediately.
