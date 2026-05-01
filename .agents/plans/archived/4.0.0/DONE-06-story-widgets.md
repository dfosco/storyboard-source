# Story-Format Widgets Implementation Plan

## Problem

Canvas component widgets are currently tied 1:1 to a specific canvas via the `.canvas.jsx` companion file convention. There's no way to create reusable component stories that any canvas can reference. We need a `.story.jsx` discovery system and a `story` widget type that allows any canvas to render selected story exports.

## Approach

1. **Story discovery** — Add `.story.jsx` file discovery to the Vite data plugin, following the same pattern as canvas JSONL discovery.
2. **Story indexing** — Generate a `stories` collection in the virtual module with dynamic imports for each story file.
3. **Story widget** — Create a `story` JSON widget type (`{ storyId, exportName }`) that loads and renders story exports at runtime.
4. **Backward compatibility** — Leave the existing `.canvas.jsx` → `jsxExports` path completely untouched.

## Files to Change

### Modify
- `packages/react/src/vite/data-plugin.js` — Story file discovery, indexing, virtual module generation
- `packages/core/src/loader.js` — Add `stories` to data index, `getStoryData()`, `listStories()`
- `packages/react/src/canvas/widgets/index.js` — Register `story` widget type
- `packages/react/src/canvas/widgets/widgetProps.js` — Add `story` widget schema (storyId, exportName)
- `packages/react/src/canvas/widgets/widgetConfig.js` — Add `story` widget features/config

### Create
- `packages/react/src/canvas/widgets/StoryWidget.jsx` — Renders a story export inside the same isolation pattern as ComponentWidget
- `packages/react/src/canvas/widgets/StoryWidget.module.css` — Styles

## Implementation Steps

### Step 1: Story Discovery in Vite Plugin (`data-plugin.js`)
- Add `STORY_GLOB_PATTERN = '**/*.story.{jsx,tsx}'`
- In `parseDataFile()`: parse `.story.jsx` files → `{ name, suffix: 'story' }`
- In `buildIndex()`: glob story files, add to index under `story` key
- In `generateModule()`: for each story, emit `{ _storyModule, _storyImport: () => import(...) }` with the dynamic import
- Add `stories` to the virtual module exports and `init()` call
- HMR: story file changes trigger full-reload (they're code, not data)

### Step 2: Core Loader (`loader.js`)
- Add `stories: {}` to `dataIndex`
- Update `init()` to accept and store `stories`
- Add `getStoryData(name)` — returns story metadata + import function
- Add `listStories()` — returns all story names

### Step 3: StoryWidget Component
- Loads story module via `getStoryData(storyId)._storyImport()`
- Extracts the named export matching `exportName`
- Renders via ComponentWidget's same pattern (iframe in dev, ErrorBoundary in prod)
- Shows loading state while module loads
- Shows error state if story/export not found

### Step 4: Widget Registry + Props
- Register `'story': StoryWidget` in widget registry
- Add `story` schema to `widgetProps.js`: `{ storyId: '', exportName: '' }`
- Add `story` to `widgetConfig.js` with resizable + features

### Step 5: Backward Compatibility
- No changes to ComponentWidget, useCanvas, or the `.canvas.jsx` loading path
- The `story` widget is a new JSON widget type alongside sticky-note, markdown, etc.

## Edge Cases & Risks

- **Missing story**: StoryWidget must handle `storyId` not found in index gracefully (show error UI, don't crash canvas)
- **Missing export**: Story file exists but `exportName` doesn't — show "export not found" error
- **HMR**: Story files are code modules, so Vite's normal HMR handles them (no custom WS events needed)
- **Duplicate story names**: Follow existing pattern — throw build error on duplicate `name.story` keys
- **Private stories**: Follow `_` prefix convention (skip `_prefixed` files)
