# Add Component Menu on Canvas

## Problem

The canvas "Add widget" dropdown has sticky notes, markdown, and prototype embeds — but no way to add a **component** (story) widget. Users need to:

1. Browse existing `.story.jsx` files from `/canvas/**` and `/components/**`
2. Pick an export to embed as a story widget
3. Or create a brand-new `.story.jsx` file with a scaffolding form

## Approach

Extend `CanvasCreateMenu.svelte` with a new **"Add component"** submenu item that:

1. Opens a submenu listing all discovered `.story.jsx` files (from the virtual story index)
2. First item is **"Create new component"** → shifts to a creation form
3. Selecting an existing story dispatches `storyboard:canvas:add-story-widget`
4. The creation form scaffolds a `.story.jsx` file via a new server endpoint, then shows a notification toast

### Architecture

- **CanvasCreateMenu.svelte** — add "Component" item that opens a submenu
- **CanvasComponentPicker.svelte** (new) — submenu content listing stories + create form
- **canvas/server.js** — new `POST /_storyboard/canvas/create-story` endpoint to scaffold `.story.jsx`
- **mountStoryboardCore.js** — register `sb-story-created` notification key

## Files to change

| File | Action | Description |
|------|--------|-------------|
| `packages/core/src/CanvasCreateMenu.svelte` | Modify | Add "Component" submenu item |
| `packages/core/src/CanvasComponentPicker.svelte` | Create | Story list + create form |
| `packages/core/src/canvas/server.js` | Modify | Add `POST /create-story` endpoint |
| `packages/core/src/mountStoryboardCore.js` | Modify | Register `sb-story-created` toast key |

## Steps

### 1. Server: story creation endpoint

Add `POST /_storyboard/canvas/create-story` to `server.js`:

- Accepts: `{ name, location, format }` where location is `"canvas"` (relative to current canvas dir) or `"components"`, and format is `"jsx"` or `"tsx"`
- Validates name, generates kebab-case filename
- Scaffolds `<name>.story.<format>` with a starter named export
- Returns `{ success, path, name }`

### 2. Server: story listing endpoint

Add `GET /_storyboard/canvas/stories` to `server.js`:

- Scans `src/canvas/**/*.story.{jsx,tsx}` and `src/components/**/*.story.{jsx,tsx}`
- Returns array of `{ name, path, exports[] }` (exports parsed from `export function` lines)

### 3. CanvasComponentPicker.svelte

New component that renders:

- **Initial view**: list of stories fetched from `/stories` endpoint. Each story shows name + path. First item is "Create new component".
- **Create view**: form with fields:
  - **Component name** (text input, kebab-cased)
  - **Location** (radio: "This canvas directory" / "src/components")
  - **Format** (radio: jsx / tsx)
  - Submit button
- On create success: store notification in `sessionStorage` as `sb-story-created` and dispatch `storyboard:canvas:add-story-widget`

### 4. CanvasCreateMenu.svelte

- Add "Component" to `widgetTypes` that opens a sub-dropdown containing `CanvasComponentPicker`
- The submenu anchors to the right of the main menu

### 5. Notification registration

- Add `'sb-story-created'` to `KEYS` array in `showPendingNotification()` in `mountStoryboardCore.js`
- Toast message: "Created <name>.story.jsx" with subtitle "To edit your component, go to `<path>`"

## Edge cases & risks

- **Name collisions**: check if file already exists before creating
- **Hot reload**: Vite will detect the new `.story.jsx` and trigger HMR/full reload. Toast via sessionStorage survives this.
- **No stories yet**: empty state in the picker should still show "Create new component"
- **Canvas directory resolution**: need to resolve the current canvas's directory from `canvasName` prop
