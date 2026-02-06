# Storyboard Architecture Plan

## Vision
A meta-framework for prototyping that treats JSON as a database, enabling designers to create multiple "scenes" (scenarios) of the same application by swapping data files—without touching code.

---

## Core Concepts

### 1. JSON DB (Data Layer)
Static JSON files served from the same web server as the app. These define:
- **Initial state** — Default values for the entire prototype
- **Entities** — Users, projects, settings, etc.
- **Scenarios** — Pre-configured data sets (e.g., "empty state", "power user", "error state")

```
/public/data/
  └── scenes/
      ├── default/
      │   ├── user.json
      │   ├── projects.json
      │   └── settings.json
      ├── empty-state/
      │   └── ...
      └── error-state/
          └── ...
```

### 2. Session State (Runtime Layer)
Temporary state that lives in **URL params** and/or **localStorage**:
- Form submissions persist here, not to JSON files
- Enables multi-page flows (form step 1 → step 2 → confirmation)
- Shareable via URL (copy link = copy state)
- Inspectable in DevTools

### 3. Scene Switcher
A mechanism to load a different "scene" (JSON dataset):
- Could be a query param: `?story=empty-state`
- Or a dev UI overlay for designers
- Reloads the JSON DB from a different folder

---

## Core Utilities

### Reading Data
```jsx
// Read from JSON DB
const user = useSceneData('user')
const projects = useSceneData('projects')

// Read from session state (URL/localStorage)
const formData = useSession('checkout-form')
```

### Writing Session State
```jsx
// Persist to URL params or localStorage
const [value, setValue] = useSession('field-name')

// Form helper that auto-serializes on submit
<StoryboardForm persistTo="url" namespace="checkout">
  <input name="email" />
  <input name="quantity" />
</StoryboardForm>
// → URL becomes ?checkout.email=x&checkout.quantity=5
```

### Scene Management
```jsx
// Get current scene
const scene = useScene() // "default" | "empty-state" | etc.

// Switch scene (triggers reload of JSON DB)
switchScene('error-state')
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      JSON DB                            │
│   /public/data/scenes/{story-name}/*.json              │
│   (read-only, defines initial state)                    │
└─────────────────────────┬───────────────────────────────┘
                          │ fetch on app load
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Storyboard Context                    │
│   - Holds fetched JSON data in memory                   │
│   - Merges with session state for reads                 │
│   - Provides hooks to components                        │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   Session State  │            │    Components    │
│  (URL/localStorage)           │  useSceneData()       │
│  - User inputs   │◄───────────│  useSession()
│  - Form data     │  persist   │                  │
│  - Temp state    │            │                  │
└──────────────────┘            └──────────────────┘
```

---

## Key Design Decisions

### 1. URL params vs localStorage
**Decision: URL for session state, localStorage for cross-session persistence**

Two persistence modes:
- **URL params** (default): Ephemeral, shareable, dies when tab closes
- **localStorage**: Persists across sessions, survives browser restart

Developers mark which fields persist:

```jsx
// Ephemeral (default) - lives in URL only
const [email, setEmail] = useSession('checkout.email')

// Persistent - synced to localStorage, survives browser close
const [theme, setTheme] = useSession('settings.theme', { persist: true })
```

**How it works:**
- `persist: true` → writes to both URL AND localStorage
- On app load: localStorage values are restored to URL params (if not already set)
- URL wins for reading, but doesn't overwrite localStorage
- Only explicit `setTheme('dark')` calls persist to localStorage

```
Read priority:  URL param > localStorage > Scene JSON
Write behavior: setX() → URL (always) + localStorage (if persist: true)
```

**Shared link behavior:**
- Someone sends you `?theme=dark` but your localStorage has `light`
- You see dark (URL wins)
- Navigate to another page without the param → you see light (your localStorage)
- Shared links are temporary overrides, not permanent changes

**Use cases:**
- Theme preference → `persist: true`
- Language setting → `persist: true`  
- Form data in multi-step flow → default (URL only)
- Temporary filters → default (URL only)

### 2. Layered Data Model
**Decision: URL params override Scene JSON, accumulated across navigation**

```
Final Value = URL param ?? Scene JSON value ?? undefined
```

**How it works in practice:**

```
Page 1: /settings?story=default
├── Scene JSON defines: { theme: "light", notifications: true, language: "en" }
├── URL params: (none yet)
└── User sees: theme=light, notifications=true, language=en

User changes theme → URL updates:
/settings?story=default&theme=dark
├── Scene JSON: { theme: "light", ... }
├── URL params: { theme: "dark" }
└── User sees: theme=dark (override), notifications=true, language=en

User navigates to /dashboard?story=default&theme=dark
├── Dashboard can read theme=dark from URL
├── Dashboard reads its own data from Scene JSON
└── State persists across pages
```

**Key behaviors:**
- Scene JSON = base layer (read-only, defines defaults)
- URL params = overlay (read-write, accumulates with interaction)
- Params persist across navigation (they're in the URL)
- Any page can read any param (shared state)
- `useSession()` = merged read (URL ?? Scene JSON) + write to URL
- `useSceneData()` = Scene JSON only (for "reset to defaults" use cases)

### 3. Loading strategy
**Decision: Eager load current scene, lazy load on story switch**

On app boot:
1. Determine current scene from `?story=` param (default: "default")
2. Fetch manifest: `/data/scenes/{story}/manifest.json`
3. Parallel fetch all files listed in manifest

This gives:
- Fast initial load (one round-trip for manifest, one for data)
- No loading spinners mid-interaction
- Story switching can show a brief loading state (acceptable)

### 4. Framework coupling
**Decision: React-first, extract vanilla core later**

- Build for React now (your current stack)
- Keep core logic in pure functions where possible
- Extract to `@storyboard/core` + `@storyboard/react` when there's demand

---

## Implementation Phases

### Phase 1: Foundation
- [ ] JSON DB loader (fetch + cache JSON files)
- [ ] Session state manager (URL param read/write)
- [ ] Story resolver (which folder to load from)

### Phase 2: React Bindings
- [ ] `<StoryboardProvider>` context
- [ ] `useSceneData()` hook
- [ ] `useSession()` hook
- [ ] `useScene()` hook

### Phase 3: Form Helpers
- [ ] `<StoryboardForm>` component
- [ ] Auto-binding inputs to session state
- [ ] Submit → navigate with state

### Phase 4: Developer Experience
- [ ] Story switcher overlay UI
- [ ] DevTools panel (inspect current state)
- [ ] CLI to scaffold new scenes

---

---

## v1 Scope (What we're building now)

### In scope
- JSON DB with scene folders
- Manifest-based eager loading
- Session state (URL-first, localStorage overflow)
- React hooks: `useSceneData()`, `useSession()`, `useScene()`
- `<StoryboardProvider>` context
- Form helpers for persisting to session state

### Out of scope (v2)
- Simulation layer (delays, fake errors, outcomes)
- `useAction()` hook
- Non-React bindings
- DevTools / story switcher UI
- TypeScript generation from JSON schemas

---

## File Structure (v1)

```
/public/data/
  ├── shared/
  │   └── navigation.json       # reusable across scenes
  └── scenes/
      ├── default.json          # main scene file
      └── empty-state.json      # alternative scenario

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

## API Surface (v1)

### Hooks (Simplified)

```jsx
// PRIMARY: Read merged value, write to URL
const [theme, setTheme] = useSession('settings.theme')
// Read: URL param ?? localStorage ?? Scene JSON value
// Write: setTheme('dark') → updates URL param

// WITH PERSISTENCE: Also saves to localStorage (survives browser close)
const [theme, setTheme] = useSession('settings.theme', { persist: true })
// Write: setTheme('dark') → updates URL param AND localStorage

// SECONDARY: Read Scene JSON defaults only (for "reset" features)
const defaults = useSceneData('settings')
// Returns raw Scene JSON, ignores URL params and localStorage
// Use case: "Reset to defaults" button

// STORY: Check/switch current scene
const { story, switchScene } = useScene()
```

### Why merged-by-default is correct

```jsx
// Settings page
const [theme, setTheme] = useSession('settings.theme')

// User hasn't touched it yet:
//   URL: ?story=default (no theme param)
//   Scene JSON: { theme: "light" }
//   → theme = "light" (from Scene JSON)

// User toggles to dark:
//   setTheme('dark')
//   URL: ?story=default&settings.theme=dark
//   → theme = "dark" (from URL override)

// "Reset to defaults" button:
const defaults = useSceneData('settings')
const handleReset = () => setTheme(defaults.theme)  // writes Scene JSON value back to URL
```

### Provider & Forms

```jsx
// Provider wraps app (reads ?story= param automatically)
<StoryboardProvider>
  <App />
</StoryboardProvider>

// Form that auto-persists fields to URL params
<StoryboardForm namespace="checkout" onSubmit={handleSubmit}>
  <input name="email" />      {/* → ?checkout.email=... */}
  <input name="quantity" />   {/* → ?checkout.quantity=... */}
</StoryboardForm>
```

### URL = Complete Session State

```
/checkout?story=default&settings.theme=dark&checkout.email=a@b.com
          └─ base data  └─ override         └─ form state
```

Copy URL → share → recipient sees exact same prototype state.

---

## Implementation Phases (v1)

### Phase 1: Core
- [ ] JSON DB loader (fetch scene files)
- [ ] Session state manager (read/write URL params)
- [ ] Scene resolver (parse `?scene=` param)

### Phase 2: React Integration
- [ ] `<StoryboardProvider>` with context
- [ ] `useSceneData()` hook
- [ ] `useSession()` hook  
- [ ] `useScene()` hook

### Phase 3: Forms
- [ ] `<StoryboardForm>` component
- [ ] Auto-bind inputs to session state
- [ ] Handle submit → persist → navigate

### Phase 4: Polish
- [ ] Error boundaries for failed fetches
- [ ] Default/fallback story handling
- [ ] localStorage overflow for large payloads

---

## Open Questions — RESOLVED

### 1. Nested data access
**Decision: Yes, dot notation with simple DX**

```jsx
// Access top-level
const user = useSceneData('user')

// Access nested with dot notation
const userName = useSceneData('user.profile.name')
const firstProject = useSceneData('projects.0')
const projectOwner = useSceneData('projects.0.owner.name')

// Same for useSession
const [theme, setTheme] = useSession('settings.appearance.theme')
```

### 2. Scene file format
**Decision: Single file per scene, with imports for shared data**

```
/public/data/
  ├── shared/
  │   └── navigation.json      ← reusable across scenes
  └── scenes/
      ├── default.json
      └── empty-state.json
```

```json
// /data/scenes/default.json
{
  "$import": ["shared/navigation.json"],
  "user": {
    "name": "Jane",
    "role": "admin"
  },
  "projects": [ ... ],
  "settings": { ... }
}
```

- One file = one scene (simple)
- `$import` pulls in shared data files (merged at load time)
- No manifest needed

### 3. URL param name
**Decision: `?scene=`**

```
/dashboard?scene=default&settings.theme=dark
```

Avoids Storybook conflict, fits the cinematic "storyboard" metaphor.

---

## Next Steps

1. Validate this architecture with your use cases
2. Decide on the open questions above
3. Start with Phase 1 implementation
