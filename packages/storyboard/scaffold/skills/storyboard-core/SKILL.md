---
name: storyboard-core
description: Guide for adding CoreUIBar menu buttons and wiring action handlers in the storyboard core package. Use when adding toolbar buttons, menu items, or action handlers to the CoreUIBar.
---

# Storyboard Core — CoreUIBar & Menu Buttons

Guide for adding new menu buttons to the storyboard CoreUIBar — the floating toolbar at the bottom-right of every prototype page.

## Golden Rule

**Everything added to storyboard must either be a new system or conform to an existing system.** Do not hardcode behavior — use config declarations + registered action handlers. The CoreUIBar is config-driven end-to-end.

## Overview

The CoreUIBar is a config-driven floating toolbar rendered by `packages/core/src/CoreUIBar.svelte`. All buttons are defined in `packages/core/toolbar.config.json` under the `menus` key. The toolbar reads this config at startup, filters menus by the current mode, and renders buttons in JSON key order (reversed, so top = rightmost after the command menu).

## Architecture

```
toolbar.config.json          ← Menu declarations (icon, modes, behavior)
    ↓
CoreUIBar.svelte              ← Reads config, renders buttons via {#each}
    ↓
├── TriggerButton + Icon      ← Sidepanel buttons (docs, inspector)
├── ActionMenuButton.svelte   ← Generic action-driven dropdown (config "action" key)
├── CreateMenuButton.svelte   ← Workshop feature launcher (config "actions" + registry)
├── CommentsMenuButton.svelte ← Auth-aware comments toggle
└── CommandMenu.svelte        ← Always rightmost, special handling
```

## Menu Button Types

There are three patterns, from simplest to most custom:

### 1. Sidepanel button (config-only, no component)

For buttons that toggle a side panel. Just add a config entry — no Svelte component needed.

```json
"docs": {
  "ariaLabel": "Documentation",
  "icon": "primer/book",
  "modes": ["*"],
  "sidepanel": "docs"
}
```

### 2. Action menu button (config + registered action handler)

**This is the preferred pattern for new dynamic menus.** The config declares an `"action"` key pointing to a command action ID. CoreUIBar registers the handler in `onMount`. The generic `ActionMenuButton.svelte` renders the items.

```json
"flows": {
  "label": "Flows",
  "ariaLabel": "Switch flow",
  "icon": "feather/fast-forward",
  "modes": ["*"],
  "action": "core/flows"
}
```

The handler is registered in CoreUIBar's `onMount`:

```ts
registerCommandAction('core/flows', {
  getChildren: () => {
    // return array of { id, label, type, active?, execute }
    return items.map(item => ({
      id: item.key,
      label: item.title,
      type: 'radio',       // or 'default', 'toggle'
      active: item.isActive,
      execute: () => { /* action */ },
    }))
  },
})
```

**Supported child types:** `default` (plain item), `toggle` (checkbox), `radio` (radio group with check indicator).

The button auto-hides when `getChildren()` returns an empty array.

### 3. Custom component (for complex UI that doesn't fit action items)

Only use when the menu needs UI beyond what action items support (e.g., auth flows, overlay panels, feature registries). Must still be declared in config and dynamically imported.

```json
"comments": {
  "ariaLabel": "Comments",
  "icon": "primer/comment",
  "modes": ["*"]
}
```

## Adding a New Menu Button

### Step 1: Add config entry

Add an entry to `packages/core/toolbar.config.json` under `menus`. The key order determines position (top = leftmost, bottom = rightmost before command menu).

### Config field reference

| Field | Required | Description |
|-------|----------|-------------|
| `ariaLabel` | yes | Accessible label, also shown in tooltip |
| `icon` | yes | Namespaced icon name (see Icon section) |
| `modes` | yes | Array of mode names or `["*"]` for all modes |
| `action` | no | Command action ID — renders via generic `ActionMenuButton.svelte` (preferred for dynamic menus) |
| `meta` | no | Passed as props to `<Icon>` (e.g. `{ "strokeWeight": 2, "scale": 1.1 }`) |
| `sidepanel` | no | If set, button toggles this side panel tab (no custom component needed) |
| `label` | no | Display label (used in dropdown headers) |
| `actions` | no | Array of static action items with `feature` references (used by create menu) |
| `excludeRoutes` | no | Array of route patterns where this menu is hidden |

### Step 2: Register the action handler (for action menus)

In `CoreUIBar.svelte`'s `onMount`, register a handler for your action ID:

```ts
registerCommandAction('core/my-feature', {
  getChildren: () => {
    // Compute items dynamically based on current state
    return items.map(item => ({
      id: item.key,
      label: item.title,
      type: 'radio',       // 'default', 'toggle', or 'radio'
      active: item.isActive, // for radio/toggle: marks the selected item
      execute: () => { /* what happens on click */ },
    }))
  },
})
```

**That's it.** The generic `ActionMenuButton.svelte` handles all rendering. It:
- Reads children from the action registry via `getActionChildren()`
- Renders `RadioGroup` for `radio` type, `CheckboxItem` for `toggle`, `Item` for `default`
- Auto-hides when `getChildren()` returns an empty array
- Refreshes items on each open via `onOpenChange`

### Step 3 (only for custom components): Wire into CoreUIBar.svelte

Only needed when the action system can't express the UI you need (auth flows, overlay panels, etc.).

**1. Add state variable:**

```ts
let MyFeatureButton: any = $state(null)
```

**2. Add visibility filter in `visibleMenus`:**

```ts
if (menu.key === 'my-feature') return !!MyFeatureButton
```

**3. Dynamic import in `onMount`:**

```ts
try {
  const mod = await import('./MyFeatureButton.svelte')
  MyFeatureButton = mod.default
} catch {}
```

**4. Rendering branch in template:**

```svelte
{:else if menu.key === 'my-feature'}
  <MyFeatureButton config={menu} {basePath} tabindex={getTabindex(i)} />
```

### Important: Data index timing

The storyboard data index (`virtual:storyboard-data-index`) is seeded by the React app, which initializes *after* the Svelte CoreUIBar mounts. If your handler reads from the data index (flows, objects, records), the action registry handles this naturally — `getChildren()` is called lazily when the menu opens, not at registration time.

## Icon namespaces

The `Icon.svelte` component supports multiple icon sources via namespaced names:

| Prefix | Source | Style | Example |
|--------|--------|-------|---------|
| `primer/` | Primer Octicons | fill | `primer/repo`, `primer/gear`, `primer/comment` |
| `feather/` | Feather Icons | stroke | `feather/fast-forward`, `feather/tablet` |
| `iconoir/` | Iconoir (registered) | stroke | `iconoir/plus-circle`, `iconoir/square-dashed` |
| *(none)* | Custom overrides | fill | `folder`, `folder-open` |

Icon meta props: `strokeWeight`, `scale`, `rotate`, `flipX`, `offsetX`, `offsetY`.

## Menu visibility

Menus can be hidden via:

- **Mode filtering**: `"modes": ["inspect"]` — only visible in inspect mode
- **Route exclusion**: `"excludeRoutes": ["/viewfinder"]` — hidden on specific routes
- **UI config**: `storyboard.config.json` → `ui.hide.menus: ["my-feature"]`
- **Action menus**: auto-hide when `getChildren()` returns empty array
- **Conditional logic**: custom visibility checks in the `visibleMenus` derived block

## Existing menu buttons for reference

| Key | Type | Config | Behavior |
|-----|------|--------|----------|
| `command` | custom | `trigger: "command"` | Always rightmost, command palette |
| `create` | custom | `actions` + `feature` refs | Workshop feature launcher, overlay panels |
| `flows` | action | `action: "core/flows"` | Lists prototype flows, radio-select to switch |
| `comments` | custom | *(none)* | Auth-aware comments toggle |
| `docs` | sidepanel | `sidepanel: "docs"` | Toggles docs side panel |
| `inspector` | sidepanel | `sidepanel: "inspector"` | Toggles inspector side panel |

## Optional & Heavy Dependencies in Published Packages

The `packages/react` and `packages/core` directories are published to npm as `@dfosco/storyboard-react` and `@dfosco/storyboard-core`. Consumers may not install every optional dependency (e.g. `ghostty-web` for terminal widgets, WASM modules).

**When adding an import for a package that isn't a hard dependency:**

1. **Use `@vite-ignore` on dynamic imports** — `import(/* @vite-ignore */ 'pkg')` prevents Vite's import analysis from throwing a pre-transform error when the package isn't installed.
2. **Always `.catch()` and return `null`** — the feature should degrade gracefully, not crash the entire app.
3. **Null-guard all usage** — after `await loadSomething()`, check for `null` before accessing any module exports.
4. **Declare as optional peerDependency** — add the package to `peerDependencies` and mark it optional in `peerDependenciesMeta`:

```json
{
  "peerDependencies": {
    "some-heavy-pkg": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "some-heavy-pkg": { "optional": true }
  }
}
```

**Example pattern (from TerminalWidget.jsx):**

```js
let promise = null
function loadOptionalDep() {
  if (!promise) {
    promise = import(/* @vite-ignore */ 'ghostty-web')
      .then(async (mod) => { if (mod.init) await mod.init(); return mod })
      .catch((err) => { promise = null; console.warn('[Widget] not available:', err.message); return null })
  }
  return promise
}

// Usage:
const mod = await loadOptionalDep()
if (!mod) return // graceful degradation
```
