# Storyboard Implementation Plan

> Each phase is designed to be runnable start-to-finish and provide visual feedback in the browser.

---

## Phase 1: Scene Loading & Debug Display

### Goal
Fetch JSON scene data and display it visually to confirm the loader works.

### Technical Concepts

**Scene File Format**
A scene is a single JSON file containing all prototype data:
```
/public/data/scenes/default.json
```

The file can import shared data using `$import`:
```json
{
  "$import": ["shared/navigation.json"],
  "user": { "name": "Jane", "role": "admin" },
  "projects": [...]
}
```

**Loader Behavior**
1. Fetch the scene file (e.g., `/data/scenes/default.json`)
2. If `$import` array exists, fetch each referenced file from `/data/shared/`
3. Deep-merge imported data under the scene data (scene wins on conflicts)
4. Return the merged object

**Deep Merge Rules**
- Objects are recursively merged
- Arrays are replaced, not concatenated
- Primitives are overwritten
- Scene data takes priority over imported data

### Deliverables
- [x] Sample scene file: `/public/data/scenes/default.json`
- [x] Sample shared file: `/public/data/shared/navigation.json`
- [x] Loader module: `src/storyboard/core/loader.js`
- [x] Debug component that displays loaded JSON
- [x] Object references: `$ref` (inline replacement) and `$global` (root-level merge) with relative path resolution — replaces `$import` (see `object-references.plan.md`)
- [x] Reusable data objects directory: `src/data/objects/`

### Visual Feedback
A `<SceneDebug />` component renders the loaded scene data as formatted JSON on the page. Confirms loading and merging work correctly.

---

## Phase 2: React Context & useSceneData Hook

### Goal
Provide scene data to components via React context, with a clean hook API.

### Technical Concepts

**StoryboardProvider**
A React context provider that:
1. Loads scene data on mount (using loader from Phase 1)
2. Stores data in context state
3. Provides loading/error states
4. Makes data available to child components

**useSceneData Hook**
```jsx
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const firstProject = useSceneData('projects.0')
```

Supports dot-notation paths to access nested data:
- `'user'` → returns entire user object
- `'user.profile.name'` → returns nested string
- `'projects.0'` → returns first array item
- `'projects.0.owner.name'` → deep nested access

**Dot Path Resolution**
A utility function that takes an object and a dot-notation path, returning the value at that path. Handles:
- Object property access (`user.name`)
- Array index access (`projects.0`)
- Mixed access (`projects.0.owner.name`)
- Returns `undefined` for invalid paths (no errors thrown)

### Deliverables
- [ ] Context module: `src/storyboard/context.jsx`
- [ ] Dot path utility: `src/storyboard/core/dotPath.js`
- [ ] useSceneData hook: `src/storyboard/hooks/useSceneData.js`
- [ ] Wrap app in `<StoryboardProvider>`

### Visual Feedback
Replace the debug JSON dump with a real component that uses `useSceneData()` to display user info, project list, etc. Data flows through hooks instead of being hardcoded.

---

## Phase 3: Session State & useSession Hook

### Goal
Enable read/write of runtime state via URL parameters, merged with scene defaults.

### Technical Concepts

**Session State Storage**
URL search params store runtime state:
```
/settings?scene=default&settings.theme=dark&checkout.email=a@b.com
           └─ scene      └─ user override    └─ form data
```

**URL Param Utilities**
- `getParam(key)` → read single param
- `setParam(key, value)` → write single param (updates URL without navigation)
- `getAllParams()` → read all as object
- `removeParam(key)` → delete param

Uses `URLSearchParams` and `history.replaceState()` to modify URL without page reload.

**useSession Hook**
```jsx
const [theme, setTheme] = useSession('settings.theme')
```

**Read behavior (merged):**
```
URL param ?? Scene JSON value ?? undefined
```

The hook checks URL params first. If not found, falls back to scene data at the same path. This allows scene JSON to define defaults while URL params override them.

**Write behavior:**
`setTheme('dark')` writes to URL params only (scene JSON is read-only).

**Why merged reads matter:**
- User hasn't touched theme → reads `"light"` from scene JSON
- User toggles to dark → URL gets `?settings.theme=dark`, reads `"dark"`
- User shares URL → recipient sees `"dark"` (URL overrides their scene defaults)
- User clears param → falls back to scene JSON default

### Deliverables
- [ ] URL utilities: `src/storyboard/core/session.js`
- [ ] useSession hook: `src/storyboard/hooks/useSession.js`
- [ ] Update context to support merged reads

### Visual Feedback
Add a theme toggle or settings panel. Clicking it updates the URL in real-time. Refresh the page—state persists. Copy URL to new tab—state transfers.

---

## Phase 4: Scene Switching & useScene Hook

### Goal
Allow switching between different scene files (scenarios) via URL parameter.

### Technical Concepts

**Scene Parameter**
The `?scene=` URL param determines which JSON file to load:
```
?scene=default      → /data/scenes/default.json
?scene=empty-state  → /data/scenes/empty-state.json
?scene=error-state  → /data/scenes/error-state.json
```

If no `?scene=` param exists, defaults to `"default"`.

**Scene Resolver**
1. Read `?scene=` param from URL
2. Construct path: `/data/scenes/${sceneName}.json`
3. Pass to loader
4. Handle missing scenes gracefully (fall back to default, show error)

**useScene Hook**
```jsx
const { scene, switchScene, isLoading } = useScene()

// scene = "default" | "empty-state" | etc.
// switchScene('empty-state') → updates URL, triggers reload
// isLoading = true while fetching new scene
```

**Switch Behavior**
1. Update `?scene=` param in URL
2. Clear other session params (they were for old scene)
3. Trigger scene data reload
4. Provider re-renders with new data

### Deliverables
- [ ] Scene resolver logic in loader
- [ ] useScene hook: `src/storyboard/hooks/useScene.js`
- [ ] Update provider to handle scene changes
- [ ] Create additional scene file: `/public/data/scenes/empty-state.json`

### Visual Feedback
Add a scene switcher dropdown. Selecting a different scene reloads data and UI updates. URL reflects current scene. Empty state scene shows different (minimal) data.

---

## Phase 5: StoryboardForm Component

### Goal
Automatically persist form inputs to URL session state.

### Technical Concepts

**StoryboardForm Component**
```jsx
<StoryboardForm namespace="checkout">
  <input name="email" />
  <input name="quantity" type="number" />
</StoryboardForm>
```

Renders a `<form>` that:
1. Intercepts input changes
2. Writes values to URL params with namespace prefix
3. Pre-fills inputs from existing URL params

**Namespace Prefixing**
The `namespace` prop prefixes all field names:
```
<input name="email" />  →  ?checkout.email=value
<input name="quantity" />  →  ?checkout.quantity=5
```

Prevents collisions between different forms on the same page or across navigation.

**Input Binding**
For each input within the form:
1. On mount: read `?{namespace}.{name}` from URL, set as `defaultValue`
2. On change: write new value to URL param
3. Support common input types: text, number, checkbox, select, textarea

**Controlled vs Uncontrolled**
Inputs remain uncontrolled (use `defaultValue`) but sync to URL on change. This avoids re-render loops while keeping URL as source of truth.

**Form Submission**
```jsx
<StoryboardForm namespace="checkout" onSubmit={handleSubmit}>
```

On submit:
- Prevents default
- Collects all namespaced params into an object
- Passes to `onSubmit` callback
- Optionally navigates to next page (params persist in URL)

### Deliverables
- [ ] StoryboardForm component: `src/storyboard/components/StoryboardForm.jsx`
- [ ] Input change handlers with URL sync
- [ ] Support for text, number, checkbox, select, textarea

### Visual Feedback
Create a multi-field form. Type in fields—URL updates live. Refresh page—values persist. Navigate away and back—values still there. Submit form—see collected data.

---

## Phase 6: Persistence Layer (localStorage)

### Goal
Allow certain session values to survive browser close via localStorage.

### Technical Concepts

**Persist Option**
```jsx
// Ephemeral (default) - URL only, dies with tab
const [email, setEmail] = useSession('checkout.email')

// Persistent - survives browser close
const [theme, setTheme] = useSession('settings.theme', { persist: true })
```

**Write Behavior with Persistence**
When `persist: true`:
1. Write to URL param (always)
2. Also write to localStorage under `storyboard:{key}`

**Read Priority**
```
URL param > localStorage > Scene JSON
```

- URL wins (for shareable links that override local prefs)
- localStorage is fallback when URL param missing
- Scene JSON is final fallback (defaults)

**App Load Restoration**
On StoryboardProvider mount:
1. Read all `storyboard:*` keys from localStorage
2. For each, if no URL param exists, restore to URL
3. This makes localStorage values "sticky" across sessions

**Shared Link Behavior**
Someone sends `?theme=dark` but your localStorage has `light`:
- You see dark (URL wins)
- Navigate to page without param → you see light (your localStorage)
- Shared links are temporary overrides, not permanent changes to your prefs

**Storage Key Format**
```
localStorage key: "storyboard:settings.theme"
localStorage value: "dark"
```

### Deliverables
- [ ] localStorage utilities in `src/storyboard/core/session.js`
- [ ] Update useSession to accept `{ persist: true }` option
- [ ] Restoration logic in StoryboardProvider

### Visual Feedback
Add a "Remember my preference" toggle for theme. Enable it, change theme, close browser entirely. Reopen—theme persists. Disable persistence, change theme, close browser—reverts to default.

---

## File Structure (Final)

```
/public/data/
  ├── shared/
  │   └── navigation.json
  └── scenes/
      ├── default.json
      └── empty-state.json

/src/storyboard/
  ├── index.js                  # public exports
  ├── context.jsx               # StoryboardProvider
  ├── hooks/
  │   ├── useSceneData.js
  │   ├── useSession.js
  │   └── useScene.js
  ├── core/
  │   ├── loader.js             # fetch + merge scene files
  │   ├── session.js            # URL/localStorage helpers
  │   └── dotPath.js            # dot notation accessor
  └── components/
      └── StoryboardForm.jsx
```

---

## Phase Dependencies

```
Phase 1 (Loading) 
    ↓
Phase 2 (Context + useSceneData)
    ↓
Phase 3 (useSession) ←──────────┐
    ↓                           │
Phase 4 (Scene Switching)       │
    ↓                           │
Phase 5 (Forms) ────────────────┘
    ↓
Phase 6 (Persistence)
```

Each phase builds on previous ones but remains independently testable with visual output.
