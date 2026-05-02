# Component Set Widget — Implementation Plan

## Problem
Loading 6+ story iframes bottlenecks the Vite dev server. Each `StoryWidget` on canvas creates its own iframe pointing to the same story route, multiplying Vite's transform/serve overhead.

## Solution
A **Component Set** widget that renders ALL exports from a single `.story.jsx` file in **one iframe**, laid out in a grid. Includes a cell selection mechanism (without conflicting with component interactivity) that can bubble selection events to connected agents via URL params.

## Approach
Reuse the existing story routing infrastructure (`/components/<storyName>`) with a `_sb_component_set` query param to switch StoryPage into grid mode. A new `component-set` widget type on canvas embeds this URL in a single iframe.

---

## Todos

### 1. ComponentSetPage (`packages/react/src/story/ComponentSetPage.jsx` + `.module.css`)
New page component that renders a story's exports in a grid:
- Reads URL params: `story` (storyId), `layout` (horizontal|vertical), `selected` (exportName)
- Loads the story module via `getStoryData(name)._storyImport()`
- Renders each named export in a **grid cell** with:
  - A small **label header** per cell (export name) — this is the selection target
  - The component rendered below it
  - A visual highlight (border/ring) on the selected cell
- **Selection mechanism**: Clicking the cell label updates `?selected=ExportName` in the URL and posts `storyboard:component-set:select` message to `window.parent`
- Grid direction controlled by `layout` param (default: `horizontal`)
- Wrapped in ThemeProvider + BaseStyles like StoryPage
- Includes `_sb_embed` HMR guard like StoryPage

### 2. StoryPage delegation (`packages/react/src/story/StoryPage.jsx`)
- When `?_sb_component_set` param is present, delegate to `ComponentSetPage` instead of normal rendering
- Pass through the `name` prop and relevant URL params

### 3. ComponentSetWidget (`packages/react/src/canvas/widgets/ComponentSetWidget.jsx` + `.module.css`)
New canvas widget:
- Props: `storyId`, `layout` (default: "horizontal"), `selected`, `width`, `height`
- Builds iframe URL: `<base>/components/<storyName>?_sb_embed&_sb_hide_branch_bar&_sb_component_set&layout=<layout>&selected=<selected>`
- Title bar showing story name
- Listens for `postMessage` from iframe for selection changes → updates `selected` prop via `onUpdate`
- Interact overlay (like StoryWidget) to prevent accidental interactions
- Resize support

### 4. Widget actions (via `handleAction` / `useImperativeHandle`)
- `flip-layout` — toggle between horizontal/vertical grid
- `expand` — expand to full screen (reuse ExpandedPane)
- `open-external` — open the story route in a new tab
- Standard: copy, copy-link, delete

### 5. Widget registration
- **`packages/core/widgets.config.json`**: Add `component-set` widget definition with props, features, connectors
- **`packages/react/src/canvas/widgets/index.js`**: Import and register `ComponentSetWidget`

### 6. Canvas visibility
- Create a component-set widget on the canvas showing the `titlebar-actions-mock` story
- Connect it back to the agent terminal

---

## Selection → Agent Communication Path
1. User clicks cell label in ComponentSetPage
2. ComponentSetPage updates `?selected=ExportName` and posts `storyboard:component-set:select` to parent
3. ComponentSetWidget receives message, calls `onUpdate({ selected: 'ExportName' })`
4. Widget props update in canvas state → visible in `connectedWidgets` for any connected agent
5. Agent can read `props.selected` to know which export the user is looking at

## Notes
- Single iframe = single Vite transform/serve cycle vs N iframes
- The cell label approach for selection avoids conflicting with component-level interactivity (buttons, dropdowns, etc.)
- Grid layout is CSS grid — no complex layout engine needed
- `postMessage` is same-origin so no security concerns
