# Storyboard Implementation Plan

> Each phase is designed to be runnable start-to-finish and provide visual feedback in the browser.

---

## Phase 1: Scene Loading & Debug Display ✅

### Goal
Load JSON scene data with object references and display it visually to confirm the loader works.

### Technical Concepts

**Scene File Format**
A scene is a single JSON/JSONC file in `src/data/scenes/` containing all prototype data. Supports two special reference keys:

- **`$ref`** — Inline replacement at any nesting level:
  ```json
  { "user": { "$ref": "../objects/jane-doe" } }
  ```
  Gets replaced with the contents of the referenced file.

- **`$global`** — Root-level merge from an array of paths:
  ```json
  { "$global": ["../objects/navigation"], "user": { ... } }
  ```
  Referenced files are deep-merged into the scene root (scene values win on conflicts).

**Loader Behavior**
1. All files under `src/data/` are bundled at build time via `import.meta.glob` (eager, raw text)
2. Files are parsed with JSONC parser (allows comments)
3. `$global` references are resolved and deep-merged first
4. `$ref` objects are recursively resolved throughout the tree
5. Circular `$ref` chains are detected and throw errors
6. Paths are resolved relative to the referring file's directory

**Deep Merge Rules**
- Objects are recursively merged
- Arrays are replaced, not concatenated
- Primitives are overwritten
- Scene data takes priority over imported/global data

### Deliverables
- [x] Scene files in `src/data/scenes/` (default.json, other-scene.json)
- [x] Reusable data objects in `src/data/objects/` (jane-doe.json, navigation.json)
- [x] Loader module: `src/storyboard/core/loader.js`
- [x] JSONC parser integration via `jsonc-parser`
- [x] `$ref` inline replacement with relative path resolution
- [x] `$global` root-level merge
- [x] Circular reference detection
- [x] Debug component: `src/storyboard/components/SceneDebug.jsx`

### Visual Feedback
A `<SceneDebug />` component renders the loaded scene data as formatted JSON on the page. Reads scene name from `?scene=` URL param, a `sceneName` prop, or defaults to `"default"`.

---

## Phase 2: React Context & useSceneData Hook ✅

### Goal
Provide scene data to components via React context, with a clean hook API.

### Technical Concepts

**StoryboardProvider**
A React context provider that:
1. Reads scene name from `?scene=` search param, `sceneName` prop, or defaults to `"default"`
2. Loads scene data on mount (using loader from Phase 1)
3. Stores data in context state with loading/error states
4. Blocks rendering children until data is loaded
5. Shows fallback UI during loading and error states

**useSceneData Hook**
```jsx
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const firstProject = useSceneData('projects.0')
const allData = useSceneData()  // entire scene object
```

Supports dot-notation paths to access nested data. Returns `undefined` during loading, warns in console for missing paths.

**useSceneLoading Hook**
```jsx
const loading = useSceneLoading()  // true while scene is loading
```

**Dot Path Resolution**
`getByPath(obj, path)` utility handles:
- Object property access (`user.name`)
- Array index access (`projects.0`)
- Mixed access (`projects.0.owner.name`)
- Returns `undefined` for invalid paths (no errors thrown)

### Deliverables
- [x] Context: `src/storyboard/StoryboardContext.js` + `src/storyboard/context.jsx`
- [x] Dot path utility: `src/storyboard/core/dotPath.js`
- [x] useSceneData hook: `src/storyboard/hooks/useSceneData.js`
- [x] useSceneLoading hook (in same file)
- [x] App wrapped in `<StoryboardProvider>`

### Visual Feedback
`<SceneDataDemo />` component uses `useSession()` (merged reads) to display user info, demonstrating data flowing through hooks.

---

## Phase 3: Session State & useSession Hook ✅

### Goal
Enable read/write of runtime state via URL hash parameters, merged with scene defaults.

### Technical Concepts

**Session State Storage**
URL **hash params** (after `#`) store runtime state:
```
/settings?scene=default#settings.theme=dark&checkout.email=a@b.com
           ↑ scene        ↑ session state (hash params)
```

Hash params are used instead of search params because React Router (via generouted) patches `history.replaceState/pushState`. Any search param change triggers a full route tree re-render. Hash changes only fire `hashchange` events, which React Router ignores.

**URL Hash Utilities** (`src/storyboard/core/session.js`)
- `getParam(key)` → read single hash param
- `setParam(key, value)` → write single hash param
- `getAllParams()` → read all as object
- `removeParam(key)` → delete hash param

Uses `URLSearchParams` to parse `window.location.hash` and native `window.location.hash =` assignment to write (avoids router interception).

**useSession Hook**
```jsx
const [theme, setTheme, clearTheme] = useSession('settings.theme')
```

Returns a 3-element tuple:
- `[0]` — Current value (merged: hash param ?? scene default)
- `[1]` — Setter function (writes to hash param)
- `[2]` — Clear function (removes hash param, reverts to scene default)

**Read behavior (merged):**
```
URL hash param  ??  Scene JSON value  ??  undefined
```

Uses `useSyncExternalStore` subscribing to `hashchange` events for reactive updates without causing React Router re-renders.

**Write behavior:**
`setTheme('dark')` writes to URL hash only (scene JSON is read-only).

**Works with paths not in scene data:**
Session state paths don't need to exist in scene JSON. For example, `useSession('checkout.email')` works even if there's no `checkout` object in the scene — the value will simply be `undefined` until the user writes to it.

### Deliverables
- [x] URL hash utilities: `src/storyboard/core/session.js`
- [x] useSession hook: `src/storyboard/hooks/useSession.js`
- [x] Reactive updates via `useSyncExternalStore` + `hashchange`
- [x] Scene data merge via StoryboardContext

### Visual Feedback
`<SceneDataDemo />` component demonstrates merged reads. Theme toggle or settings changes update the URL hash in real-time. Refresh the page—state persists. Copy URL to new tab—state transfers.

---

## Phase 4: Scene Switching ✅

### Goal
Allow switching between different scene files (scenarios) via URL parameter.

### Technical Concepts

**Scene Parameter**
The `?scene=` URL search param determines which JSON file to load:
```
?scene=default      → src/data/scenes/default.json
?scene=other-scene  → src/data/scenes/other-scene.json
```

If no `?scene=` param exists, defaults to `"default"`.

**Current Implementation**
Scene switching is handled directly in `StoryboardProvider`:
1. Reads `?scene=` param from `window.location.search`
2. Falls back to `sceneName` prop, then `"default"`
3. Triggers scene reload when the active scene name changes
4. Renders loading/error states appropriately

### Deliverables
- [x] Scene resolver logic in `StoryboardProvider` (`context.jsx`)
- [x] `?scene=` param detection via `window.location.search`
- [x] Additional scene file: `src/data/scenes/other-scene.json`
- [x] `useScene()` hook: `src/storyboard/hooks/useScene.js`

### Visual Feedback
Change `?scene=other-scene` in the URL → app reloads with different data. Use `useScene()` hook to read scene name or switch programmatically:
```jsx
const { sceneName, switchScene } = useScene()
switchScene('other-scene')  // updates ?scene= param, clears hash, reloads
```

---

## Phase 5: Form Components

### Goal
Provide designer-friendly form components that automatically persist to URL session state, requiring no hook or event handler knowledge.

### Technical Concepts

**Design Principle**
This framework is meant for designers. Manual `useSession` + `onChange` handlers are too complex. Designers should be able to use familiar Primer React components with minimal additional API.

**StoryboardForm Component**
```jsx
<StoryboardForm data="checkout">
  <FormControl>
    <FormControl.Label>Email</FormControl.Label>
    <TextInput name="email" />
  </FormControl>
  <FormControl>
    <FormControl.Label>Quantity</FormControl.Label>
    <TextInput name="quantity" type="number" />
  </FormControl>
  <Button type="submit">Continue</Button>
</StoryboardForm>
```

- Renders a native `<form>` element
- `data` prop sets the root path for all fields (e.g., `data="checkout"`)
- Provides a React context that child input components consume
- `data="checkout"` + `name="email"` → hash param `#checkout.email=...`

**Scene data is optional** — forms work without a matching object in scene JSON. If `checkout` exists in the scene, its values serve as defaults. If not, fields start empty and write to hash params independently.

**Wrapped Primer Components**
Storyboard provides wrapped versions of Primer React form components:
```jsx
import { TextInput } from '../storyboard/components'
```

Each wrapper:
- Looks and behaves identically to the Primer original
- Reads the `data` prefix from `StoryboardForm` context
- Uses `useSession(prefix.name)` internally for auto-binding
- Passes through all other Primer props unchanged

**URL Hash Format**
```
/checkout?scene=default#checkout.email=user@example.com&checkout.quantity=5
```

### Deliverables
- [ ] Form context: `src/storyboard/context/FormContext.js`
- [ ] StoryboardForm component: `src/storyboard/components/StoryboardForm.jsx`
- [ ] Wrapped TextInput: `src/storyboard/components/TextInput.jsx`
- [ ] Wrapped Checkbox: `src/storyboard/components/Checkbox.jsx`
- [ ] Wrapped Select: `src/storyboard/components/Select.jsx`
- [ ] Wrapped Textarea: `src/storyboard/components/Textarea.jsx`
- [ ] Updated exports in `src/storyboard/index.js`
- [ ] Example form page demonstrating the pattern

### Visual Feedback
Create a multi-field form using Primer components. Type in fields—URL hash updates live. Refresh page—values persist. Navigate away and back—values still there.

---

## Phase 6: Rename useSession → useCue — Future

### Goal
Rename `useSession` to `useCue` across the codebase for a better cinematic metaphor. A "cue" is a signal to change something in the current scene — maps well to runtime overrides on top of scene defaults.

### Deliverables
- [ ] Rename hook: `useSession` → `useCue`
- [ ] Rename file: `useSession.js` → `useCue.js`
- [ ] Rename core utilities: `session.js` → consider `cue.js`
- [ ] Update all imports and usages
- [ ] Update exports in `src/storyboard/index.js`
- [ ] Keep `useSession` as a deprecated re-export for backward compatibility (optional)

---

## Phase 7: Persistence Layer (localStorage) — Future

### Goal
Allow certain session values to survive browser close via localStorage.

### Technical Concepts

**Persist Option**
```jsx
const [theme, setTheme] = useSession('settings.theme', { persist: true })
```

**Read Priority**
```
URL hash param > localStorage > Scene JSON
```

**Not yet implemented.** Current session state is hash-only (ephemeral, dies with tab close).

---

## File Structure (Current + Planned)

```
src/data/
  ├── objects/
  │   ├── jane-doe.json
  │   └── navigation.json
  └── scenes/
      ├── default.json
      └── other-scene.json

src/storyboard/
  ├── index.js                    # public exports
  ├── context.jsx                 # StoryboardProvider
  ├── StoryboardContext.js        # React context (createContext)
  ├── hooks/
  │   ├── useSceneData.js         # ✅ read-only scene data
  │   └── useSession.js           # ✅ merged read/write via hash
  ├── core/
  │   ├── loader.js               # ✅ scene loader with $ref/$global
  │   ├── session.js              # ✅ URL hash param utilities
  │   └── dotPath.js              # ✅ dot-notation path resolver
  └── components/
      ├── SceneDebug.jsx          # ✅ debug JSON viewer
      ├── SceneDataDemo.jsx       # ✅ demo component
      ├── StoryboardForm.jsx      # 🔜 Phase 5
      ├── TextInput.jsx           # 🔜 Phase 5
      ├── Checkbox.jsx            # 🔜 Phase 5
      ├── Select.jsx              # 🔜 Phase 5
      └── Textarea.jsx            # 🔜 Phase 5
```

---

## Phase Dependencies

```
Phase 1 (Loading) ✅
    ↓
Phase 2 (Context + useSceneData) ✅
    ↓
Phase 3 (useSession + hash params) ✅
    ↓
Phase 4 (Scene Switching) ✅
    ↓
Phase 5 (Form Components) ← NEXT
    ↓
Phase 6 (Rename useSession → useCue) — Future
    ↓
Phase 7 (localStorage Persistence) — Future
```

Each phase builds on previous ones but remains independently testable with visual output.
