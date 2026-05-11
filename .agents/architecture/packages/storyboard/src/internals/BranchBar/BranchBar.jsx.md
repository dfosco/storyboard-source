# `packages/storyboard/src/internals/BranchBar/BranchBar.jsx`
<!--
source: packages/storyboard/src/internals/BranchBar/BranchBar.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

A blue accent bar rendered at the very top of the page (via React portal, first child of `<body>`) that shows the current branch name and local dev status. In production it only appears on non-`main` branches. In local development it's always visible and also shows the dev domain name (from `window.__SB_DEV_DOMAIN__`) and a colored accent (from `window.__SB_DEV_DOMAIN_COLOR__`).

The portal placement ensures the bar pushes the entire page layout down, including absolutely positioned items, without requiring page-level CSS changes.

## Composition

```jsx
export default function BranchBar({ basePath }) {
  // Parse branch name from basePath (e.g. /branch--feature-x/ → 'feature-x')
  const currentBranch = useMemo(() => basePath.match(/\/branch--([^/]+)\/?$/)?.[1] || 'main', [basePath])
  const isLocalDev = checkLocalDev()   // window.__SB_LOCAL_DEV__ === true (unless ?prodMode)
  const isOnBranch = currentBranch !== 'main'
  const domainColor = isLocalDev ? getDevDomainColor() : null

  // Observe storyboard-chrome-hidden class for hide/show
  useEffect(() => {
    const observer = new MutationObserver(() => setHidden(/* ... */))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }, [])

  if ((!isOnBranch && !isLocalDev) || hidden || isHiddenByParam) return null

  return createPortal(
    <div className={css.bar} data-branch-bar>
      {/* domain · branch-name · Local development */}
    </div>,
    getPortalContainer()  // #sb-branch-bar-root, prepended to body
  )
}
```

## Dependencies

- `react-dom` — `createPortal`
- `@primer/octicons-react` — `GitBranchIcon`
- CSS Modules — `BranchBar.module.css`

## Dependents

- [`CommandPalette/CommandPalette.jsx`](../CommandPalette/CommandPalette.jsx.md) — renders `<BranchBar />` internally
- [`index.js`](../index.js.md) — exports `BranchBar` for standalone mounting

## Notes

- `window.__SB_LOCAL_DEV__` and `window.__SB_DEV_DOMAIN__` are injected by the server plugin's `transformIndexHtml` hook.
- The "Hide" button dispatches a synthetic `keydown` event (`⌘.`) which is the global chrome-hide shortcut — consistent with keyboard behavior.
- `_sb_hide_branch_bar` and `_sb_embed` URL params suppress the bar entirely (for iframe embedding scenarios).
