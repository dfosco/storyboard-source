# `packages/storyboard/src/core/stores/paletteProviders.js`

<!--

source: packages/storyboard/src/core/stores/paletteProviders.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`paletteProviders.js` adapts several Storyboard subsystems into a single search model for the command palette. It materializes command, prototype, canvas, story, and recent-item datasets once per palette open, then delegates ranking to fuzzy search for low-latency queries.

## Composition

```js
import { buildPrototypeIndex } from '../data/viewfinder.js'
import { listStories, getStoryData } from '../data/loader.js'
import { getActionsForMode, executeAction, getActionChildren } from './commandActions.js'
import { getToolbarToolState } from './toolStateStore.js'
import { getRecent, trackRecent } from './recentArtifacts.js'
import { fuzzySearch } from '../utils/fuzzySearch.js'

// ---------------------------------------------------------------------------
// Palette item factory helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PaletteItem
 * @property {string}   id        — unique within provider
 * @property {string}   label     — display text (also used for fuzzy matching)
 * @property {string}   category  — group header in results
 * @property {string}   [icon]    — optional icon name
 * @property {boolean}  [localOnly]
 * @property {string}   [hint]    — secondary text (e.g. folder name)
 * @property {Function} action    — called when the item is selected
 */

// ---------------------------------------------------------------------------
// Provider: Commands
// ---------------------------------------------------------------------------

/**
 * Build command items from the resolved action registry.
 * Flattens submenus so their children appear as individual items.
 *
 * @param {string} mode — current mode name
 * @param {string} basePath
 * @returns {PaletteItem[]}
 */
export function buildCommandItems(mode, basePath) {
  const actions = getActionsForMode(mode)
  const items = []

  for (const action of actions) {
    // Skip structural items
    if (action.type === 'header' || action.type === 'separator' || action.type === 'footer') continue

    // Skip hidden/disabled tools
    if (action.toolKey) {
      const state = getToolbarToolState(action.toolKey)
      if (state === 'disabled' || state === 'hidden') continue
    }

    // Skip items hidden from search
    if (action.hideFromCommandPaletteSearch) continue

    if (action.type === 'submenu') {
      // Flatten submenu children into individual items
      const children = getActionChildren(action.id)
      for (const child of children) {
        items.push({
          id: `cmd:${action.id}/${child.id || child.label}`,
          label: child.label,
          category: 'Commands',
          hint: action.label,
          localOnly: action.localOnly,
          action: () => { if (child.execute) child.execute() },
        })
      }
    } else if (action.type === 'toggle') {
      items.push({
        id: `cmd:${action.id}`,
        label: `${action.label}${action.active ? ' ✓' : ''}`,
        category: 'Commands',
        localOnly: action.localOnly,
        action: () => executeAction(action.id),
      })
    } else if (action.type === 'link' && action.url) {
      items.push({
        id: `cmd:${action.id}`,
        label: action.label,
        category: 'Commands',
        localOnly: action.localOnly,
        action: () => {
          if (action.url.startsWith('/') && !action.url.startsWith('//')) {
            const base = (basePath || '/').replace(/\/+$/, '')
            window.location.href = (base === '/' ? '' : base) + action.url
          } else {
            window.location.href = action.url
          }
        },
      })
    } else {
      items.push({
        id: `cmd:${action.id}`,
        label: action.label,
        category: 'Commands',
        localOnly: action.localOnly,
        action: () => executeAction(action.id),
      })
    }
  }

  return items
```

Each provider turns live data indexes into a normalized `{ id, label, category, action }` record. Providers also track recents on navigation so the palette can reconstruct a useful shortlist on the next open.

```js
export function buildPrototypeItems(basePath) {
  const index = buildPrototypeIndex()
  const items = []
  const base = (basePath || '/').replace(/\/+$/, '')

  function addProto(proto) {
    if (proto.isExternal) {
      items.push({
        id: `proto:${proto.dirName}`,
        label: proto.name,
        category: 'Prototypes',
        hint: proto.folder || undefined,
        action: () => {
          trackRecent('prototype', proto.dirName, proto.name)
          window.open(proto.externalUrl, '_blank')
        },
      })
    } else {
      const route = (base === '/' ? '' : base) + '/' + proto.dirName
      items.push({
        id: `proto:${proto.dirName}`,
        label: proto.name,
        category: 'Prototypes',
        hint: proto.folder || undefined,
        action: () => {
          trackRecent('prototype', proto.dirName, proto.name)
          window.location.href = route
        },
      })
    }
  }

  // Ungrouped prototypes
  for (const proto of index.prototypes) addProto(proto)

  // Folder prototypes
  for (const folder of index.folders) {
    for (const proto of folder.prototypes) addProto(proto)
  }

  return items
}

// ---------------------------------------------------------------------------
// Provider: Canvases
// ---------------------------------------------------------------------------

/**
 * Build canvas items from the viewfinder index.
 *
 * @param {string} basePath
 * @returns {PaletteItem[]}
 */
export function buildCanvasItems(basePath) {
  const index = buildPrototypeIndex()
  const items = []
  const base = (basePath || '/').replace(/\/+$/, '')

  function addCanvas(canvas) {
    const route = (base === '/' ? '' : base) + canvas.route
    items.push({
      id: `canvas:${canvas.dirName}`,
      label: canvas.name,
      category: 'Canvases',
      hint: canvas.folder || undefined,
      action: () => {
        trackRecent('canvas', canvas.dirName, canvas.name)
        window.location.href = route
      },
    })
  }

  // Ungrouped canvases
  for (const canvas of index.canvases) addCanvas(canvas)

  // Folder canvases
  for (const folder of index.folders) {
    if (folder.canvases) {
      for (const canvas of folder.canvases) addCanvas(canvas)
    }
  }

  return items
}

// ---------------------------------------------------------------------------
// Provider: Stories
// ---------------------------------------------------------------------------

/**
 * Build story items from the data index.
 *
 * @param {string} basePath
 * @returns {PaletteItem[]}
 */
export function buildStoryItems(basePath) {
  const names = listStories()
  const items = []
  const base = (basePath || '/').replace(/\/+$/, '')

  for (const name of names) {
    const data = getStoryData(name)
    if (!data) continue
    const route = data._route || `/components/${name}`
    items.push({
      id: `story:${name}`,
      label: name,
      category: 'Stories',
      action: () => {
        trackRecent('story', name, name)
        window.location.href = (base === '/' ? '' : base) + route
      },
    })
  }

  return items
}

// ---------------------------------------------------------------------------
// Provider: Recent
// ---------------------------------------------------------------------------

/**
 * Build recent items from localStorage.
 * Derives routes at read time for correctness across branches.
 *
 * @param {string} basePath
 * @returns {PaletteItem[]}
 */
export function buildRecentItems(basePath) {
  const recent = getRecent()
  const base = (basePath || '/').replace(/\/+$/, '')

  return recent.map(entry => ({
    id: `recent:${entry.type}:${entry.key}`,
    label: entry.label,
    category: 'Recent',
    hint: entry.type,
    action: () => {
      // Re-track to bump to top
      trackRecent(entry.type, entry.key, entry.label)
      const route = resolveRecentRoute(entry, base)
      if (route) window.location.href = route
    },
  }))
}
```

`buildAllItems()` snapshots all providers together, and `searchPalette()` searches per category so commands, prototypes, canvases, and stories can keep different result caps.

```js
export function buildAllItems(mode, basePath) {
  return {
    commands: buildCommandItems(mode, basePath),
    prototypes: buildPrototypeItems(basePath),
    canvases: buildCanvasItems(basePath),
    stories: buildStoryItems(basePath),
    recent: buildRecentItems(basePath),
  }
}

/**
 * Search across all cached datasets.
 *
 * @param {PaletteDataset} dataset — cached from buildAllItems
 * @param {string} query
 * @returns {{ category: string, items: PaletteItem[] }[]}
 */
export function searchPalette(dataset, query) {
  const q = query.trim()

  if (!q) {
    // Empty query: show recent (if any), then commands
    const groups = []
    if (dataset.recent.length > 0) {
      groups.push({ category: 'Recent', items: dataset.recent.slice(0, 5) })
    }
    if (dataset.commands.length > 0) {
      groups.push({ category: 'Commands', items: dataset.commands })
    }
    return groups
  }

  // Search each category independently
  const categories = [
    { key: 'commands', label: 'Commands', max: 5 },
    { key: 'prototypes', label: 'Prototypes', max: 8 },
    { key: 'canvases', label: 'Canvases', max: 8 },
    { key: 'stories', label: 'Stories', max: 5 },
  ]

  const groups = []
  for (const cat of categories) {
    const results = fuzzySearch(dataset[cat.key], q, { maxResults: cat.max })
    if (results.length > 0) {
      groups.push({
        category: cat.label,
        items: results.map(r => r.item),
      })
    }
  }

  return groups
}
```

## Dependencies

- [`packages/storyboard/src/core/data/viewfinder.js`](../data/viewfinder.js.md) — imported via `../data/viewfinder.js`.

- [`packages/storyboard/src/core/data/loader.js`](../data/loader.js.md) — imported via `../data/loader.js`.

- [`packages/storyboard/src/core/stores/commandActions.js`](commandActions.js.md) — imported via `./commandActions.js`.

- [`packages/storyboard/src/core/stores/toolStateStore.js`](toolStateStore.js.md) — imported via `./toolStateStore.js`.

- [`packages/storyboard/src/core/stores/recentArtifacts.js`](recentArtifacts.js.md) — imported via `./recentArtifacts.js`.

- [`packages/storyboard/src/core/utils/fuzzySearch.js`](../utils/fuzzySearch.js.md) — imported via `../utils/fuzzySearch.js`.

## Dependents

- [`packages/storyboard/src/core/stores/paletteProviders.test.js`](paletteProviders.test.js.md)

## Notes

- Routes for recent items are derived at read time instead of being persisted, which keeps branch/base-path navigation correct after worktree or deploy-path changes.

- Hidden and disabled tools are filtered before command items become searchable, using [`packages/storyboard/src/core/stores/toolStateStore.js`](toolStateStore.js.md) state.
