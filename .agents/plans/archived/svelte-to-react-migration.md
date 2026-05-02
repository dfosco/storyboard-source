# Svelte → React Migration Plan

## Approach
Replace ALL Svelte components with React equivalents. Svelte shadcn primitives (bits-ui based) → Radix UI + tailwind (shadcn/ui React pattern). Custom components → React with hooks. CoreUIBar Svelte → React component mounted via createRoot.

## Key facts
- Single Svelte mount point: `devtools.js` → `mount(CoreUIBar, ...)`
- UI primitives use `bits-ui` (Svelte) → switch to `@radix-ui/*` (React)
- `cn()` utility already framework-agnostic (clsx + tailwind-merge)
- Tailwind classes stay identical
- Tool handlers return `component()` → will return React components instead

## Work Groups (parallelizable)

### Group 1: Foundation (no deps)
- Install @radix-ui/* packages
- Convert Icon.svelte → Icon.jsx (React)
- Convert cn/utils (already done — framework agnostic)

### Group 2: UI Primitives (depends on Group 1 for Radix)
Convert shadcn-svelte → shadcn-react for all lib/components/ui/:
- button, trigger-button, badge, label, input, textarea, separator, checkbox
- tooltip, popover, dropdown-menu, dialog, sheet, collapsible, select
- card, alert, avatar, toggle, toggle-group, panel

### Group 3: Small components (parallel with Group 2 if using Radix directly)
- HideChromeTrigger, CommandPaletteTrigger, CommandPalette trigger
- PwaInstallBanner

### Group 4: Tool buttons (depends on Group 2)
- ThemeMenuButton, CommentsMenuButton, AutosyncMenuButton
- CreateMenuButton, ActionMenuButton

### Group 5: Canvas tools (depends on Group 2)
- CanvasZoomControl, CanvasSnap, CanvasZoomToFit
- CanvasUndoRedo, CanvasCreateMenu

### Group 6: Panels (depends on Group 2)
- SidePanel, DocPanel, InspectorPanel

### Group 7: Comments UI (depends on Group 2)
- CommentWindow, Composer, CommentsDrawer, AuthModal

### Group 8: Workshop (depends on Group 2)
- WorkshopPanel, CreateFlowForm, CreatePageForm
- CreatePrototypeForm, CreateStoryForm, CreateCanvasForm

### Group 9: CoreUIBar (depends on Groups 2-8)
- Convert CoreUIBar.svelte → CoreUIBar.jsx
- Update tool registry to return React components

### Group 10: Integration (depends on Group 9)
- Update devtools.js: svelte mount → React createRoot
- Update vite.config.js: remove svelte plugin
- Remove svelte deps from package.json
- Delete all .svelte files
- Run build + tests
