# `packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx`
<!--
source: packages/storyboard/src/internals/CommandPalette/CommandPalette.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

The global command palette — a `cmdk`-powered search overlay that aggregates all navigable and actionable items: prototypes, canvases, stories, toolbar tools, config-driven command actions, theme switcher, and navigation history (recents). Opened with `⌘K` or the toolbar's palette button. Also hosts `<BranchBar>` and `<AuthModal>` as permanent siblings so they're always mounted when the palette is loaded.

## Composition

Key structure:

```jsx
export default function CommandPalette({ basePath }) {
  const [open, setOpen] = useState(false)
  // Keyboard shortcut: Cmd+K opens palette
  useEffect(() => { document.addEventListener('keydown', handleKey) }, [])
  // Listen for storyboard:open-command-palette event (toolbar button)
  useEffect(() => { document.addEventListener('storyboard:open-command-palette', ...) }, [])

  return (
    <>
      <BranchBar basePath={basePath} />
      <AuthModal />
      <Command.Dialog open={open} onOpenChange={setOpen}>
        <Command.Input placeholder="Search prototypes, canvases, commands…" />
        <Command.List>
          {/* Recents section */}
          {/* Prototypes section (from buildPrototypeIndex) */}
          {/* Canvases section */}
          {/* Stories / Components section */}
          {/* Toolbar tools section */}
          {/* Config-driven actions (from getActionsForMode) */}
          {/* Theme switcher */}
        </Command.List>
      </Command.Dialog>
    </>
  )
}
```

Items are filtered using `scoreMatch` (fuzzy scoring from `core/utils/fuzzySearch.js`), called as a custom filter on the `<Command>` component. Item icons use the `<Icon>` component with names from `getIconMap()` (command palette icon config).

Widget artifact creation dialogs (`CreateDialog`, `WidgetArtifactDialog`) are rendered inline for canvas widget creation flow initiated from the palette.

## Dependencies

- `cmdk` — `Command` (palette UI primitives)
- [`../core/index.js`](../core/index.js.md) — `buildPrototypeIndex`, `listStories`, `getActionsForMode`, `executeAction`, `getCommandPaletteConfig`, `getConfig`, `setTheme`, `scoreMatch`, `trackRecent`, `getRecent`, etc.
- [`../Icon.jsx`](../Icon.jsx.md) — item icons
- [`../BranchBar/BranchBar.jsx`](../BranchBar/BranchBar.jsx.md) — always-rendered sibling
- [`../AuthModal/AuthModal.jsx`](../AuthModal/AuthModal.jsx.md) — always-rendered sibling
- `../canvas/widgets/widgetConfig.js` — widget type list for canvas creation commands

## Dependents

- [`context.jsx`](../context.jsx.md) — lazy-loads `CommandPaletteLazy` as a sibling to `StoryboardProvider`
- [`index.js`](../index.js.md) — exports `StoryboardCommandPalette` for standalone mounting

## Notes

- `BranchBar` and `AuthModal` are mounted here (not in `context.jsx`) so they're available even when the palette hasn't been opened yet — they respond to global events.
- The palette is lazy-loaded in `context.jsx` via `React.lazy()` so it doesn't add to the initial bundle.
- `openDeployedBranch()` constructs the equivalent prod URL from `prodDomain` config and opens it in a new tab — useful for reviewing deployed previews while on a feature branch.
