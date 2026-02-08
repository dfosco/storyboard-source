# Storyboard Architecture Plan

## Vision
A meta-framework for prototyping that treats JSON as a database, enabling designers to create multiple "scenes" (scenarios) of the same application by swapping data files—without touching code.

---

## Core Concepts

### 1. JSON DB (Data Layer)
Static JSON/JSONC files bundled with the app via Vite's `import.meta.glob`. These define:
- **Objects** — Reusable data fragments (users, navigation, etc.) in `src/data/objects/`
- **Scenes** — Complete data contexts that compose objects via `$ref` and `$global` in `src/data/scenes/`

```
src/data/
  ├── objects/
  │   ├── jane-doe.json          # reusable user data
  │   └── navigation.json        # reusable nav data
  └── scenes/
      ├── default.json           # main scene
      └── other-scene.json       # alternative scenario
```

**Object References:**
- `$ref` — Inline replacement: `{ "$ref": "../objects/jane-doe" }` is replaced with the file contents at any nesting level
- `$global` — Root-level merge: an array of paths merged into the scene root (scene values win on conflicts)

```json
// src/data/scenes/default.json
{
  "user": { "$ref": "../objects/jane-doe" },
  "navigation": { "$ref": "../objects/navigation" },
  "projects": [ ... ],
  "settings": { "theme": "dark_dimmed" }
}
```

### 2. Session State (Runtime Layer)
Temporary state that lives in **URL hash params** (`#key=value`):
- Form submissions and user interactions persist here, not to JSON files
- Enables multi-page flows (form step 1 → step 2 → confirmation)
- Shareable via URL (copy link = copy state)
- Inspectable in DevTools

Hash params are used instead of search params (`?`) to avoid triggering React Router re-renders (generouted patches `history.replaceState`).

### 3. Scene Switching
Load a different "scene" (JSON dataset) via the `?scene=` search param:
- `?scene=default` → loads `src/data/scenes/default.json`
- `?scene=other-scene` → loads `src/data/scenes/other-scene.json`
- No param → defaults to `"default"`

---

## Core Utilities

### Reading Data
```jsx
// Read from Scene JSON (read-only defaults)
const user = useSceneData('user')
const projects = useSceneData('projects')

// Read merged value (hash param ?? scene default), write to hash
const [theme, setTheme] = useSession('settings.theme')
```

### Writing Session State
```jsx
// Read/write via URL hash params
const [value, setValue, clearValue] = useSession('field-name')

// setValue('dark') → writes #field-name=dark to URL hash
// clearValue() → removes hash param, reverts to scene default
```

### Scene Management
```jsx
// Scene is determined by ?scene= param, read in StoryboardProvider
// Currently managed via URL directly
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Scene JSON                           │
│   src/data/scenes/{scene-name}.json                    │
│   (read-only, defines defaults via $ref/$global)        │
└─────────────────────────┬───────────────────────────────┘
                          │ loaded on mount via import.meta.glob
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Storyboard Context                    │
│   - Holds resolved scene data in memory                 │
│   - Provides useSceneData() for raw defaults            │
│   - Provides useSession() for merged reads + writes     │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   Session State  │            │    Components    │
│  (URL hash #)    │            │  useSceneData()  │
│  - User inputs   │◄───────────│  useSession()    │
│  - Form data     │  persist   │                  │
│  - Temp state    │            │                  │
└──────────────────┘            └──────────────────┘
```

---

## Key Design Decisions

### 1. Hash params for session state
**Decision: URL hash fragment (`#`) for all session state**

Session params are stored in the URL hash (after `#`):
```
/settings?scene=default#settings.theme=dark&checkout.email=a@b.com
           ↑ scene (search param)  ↑ session state (hash params)
```

**Why hash instead of search params:**
- React Router (via generouted) patches `history.replaceState/pushState`
- Any search param change triggers a full route tree re-render
- Hash changes only fire `hashchange` events, which React Router ignores
- Native `window.location.hash` assignment avoids the router entirely

```
Read priority:  URL hash param  ??  Scene JSON value  ??  undefined
Write behavior: setValue() → URL hash only (scene JSON is read-only)
```

**Shared link behavior:**
- Copy URL → share → recipient sees exact same prototype state
- Hash params persist across page navigation
- Clearing a param reverts to scene JSON default

### 2. Layered Data Model
**Decision: Hash params override Scene JSON, accumulated across navigation**

```
Final Value = Hash param ?? Scene JSON value ?? undefined
```

**Key behaviors:**
- Scene JSON = base layer (read-only, defines defaults)
- Hash params = overlay (read-write, accumulates with interaction)
- Params persist across navigation (they're in the URL)
- Any page can read any param (shared state)
- `useSession()` = merged read (hash ?? Scene JSON) + write to hash
- `useSceneData()` = Scene JSON only (for "reset to defaults" use cases)

### 3. Loading strategy
**Decision: Eager load via Vite bundling**

Scene and object files are loaded eagerly via `import.meta.glob` with the `eager: true` option. This means:
- All JSON/JSONC files under `src/data/` are bundled at build time
- No runtime fetching or manifest needed
- JSONC parser allows comments in data files
- Scene resolution and `$ref`/`$global` merging happen synchronously at load time

### 4. Framework coupling
**Decision: React-first, extract vanilla core later**

- Built for React (current stack)
- Core logic in pure functions where possible (`loader.js`, `session.js`, `dotPath.js`)
- Extract to `@storyboard/core` + `@storyboard/react` when there's demand

---

## v1 Scope

### Implemented ✅
- Scene loading with `$ref` and `$global` object references
- JSONC support (comments in JSON files)
- `<StoryboardProvider>` context with `?scene=` param support
- `useSceneData(path)` hook with dot-notation access
- `useSceneLoading()` hook
- `useSession(path)` hook with merged reads and hash-param writes
- Session state utilities: `getParam`, `setParam`, `getAllParams`, `removeParam`
- `getByPath()` dot-notation utility
- `<SceneDebug>` debug component

### Next: Form Components
- `<StoryboardForm>` component for designer-friendly form binding
- Wrapped Primer React components that auto-sync with session state
- See implementation plan for details

### Out of scope (v2)
- Rename `useSession` → `useCue` (better cinematic metaphor: a "cue" is a signal to change something in the current scene)
- localStorage persistence layer (`{ persist: true }` option)
- Simulation layer (delays, fake errors, outcomes)
- `useAction()` hook
- Non-React bindings
- DevTools / scene switcher UI
- TypeScript generation from JSON schemas

---

## File Structure (Current)

```
src/data/
  ├── objects/
  │   ├── jane-doe.json           # reusable user object
  │   └── navigation.json         # reusable nav object
  └── scenes/
      ├── default.json            # main scene (uses $ref)
      └── other-scene.json        # alternative scenario

src/storyboard/
  ├── index.js                    # public exports
  ├── context.jsx                 # StoryboardProvider
  ├── StoryboardContext.js        # React context (createContext)
  ├── hooks/
  │   ├── useSceneData.js         # read-only scene data access
  │   └── useSession.js           # merged read/write via hash params
  ├── core/
  │   ├── loader.js               # scene loader with $ref/$global resolution
  │   ├── session.js              # URL hash param utilities
  │   └── dotPath.js              # dot-notation path resolver
  └── components/
      ├── SceneDebug.jsx          # debug JSON viewer
      ├── SceneDebug.module.css
      └── SceneDataDemo.jsx       # demo component using hooks
```

---

## API Surface (Current)

### Hooks

```jsx
// Read scene JSON defaults (read-only)
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const allData = useSceneData()  // entire scene object

// Check loading state
const loading = useSceneLoading()

// Read merged value + write to hash
const [theme, setTheme, clearTheme] = useSession('settings.theme')
// Read: hash param ?? scene JSON ?? undefined
// setTheme('dark') → writes to hash
// clearTheme() → removes hash param, reverts to scene default
```

### Provider

```jsx
// Provider wraps app, reads ?scene= param automatically
<StoryboardProvider>
  <App />
</StoryboardProvider>

// Or pass scene name as prop
<StoryboardProvider sceneName="other-scene">
  <App />
</StoryboardProvider>
```

### URL = Complete Session State

```
/checkout?scene=default#settings.theme=dark&checkout.email=a@b.com
          ↑ scene        ↑ session state (hash params)
```

Copy URL → share → recipient sees exact same prototype state.

---

## Resolved Decisions

### 1. Nested data access
**Yes, dot notation with simple DX**

```jsx
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const firstProject = useSceneData('projects.0')

const [theme, setTheme] = useSession('settings.theme')
```

### 2. Scene file format
**Single file per scene, with `$ref` and `$global` for shared data**

```json
{
  "$global": ["../objects/navigation"],
  "user": { "$ref": "../objects/jane-doe" },
  "projects": [ ... ],
  "settings": { ... }
}
```

- `$ref` replaced inline with referenced file contents
- `$global` array merged into scene root (scene wins conflicts)
- Circular `$ref` chains detected and throw errors
- Replaces original `$import` design

### 3. URL param name
**`?scene=` for scene selection, `#` for session state**

```
/dashboard?scene=default#settings.theme=dark
```

Avoids Storybook conflict (not `story`), fits the cinematic "storyboard" metaphor.
