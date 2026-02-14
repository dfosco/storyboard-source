# Copilot Instructions

## General instructions

- Before running any other instruction, evaluate if the user prompt contains a trigger for one or more skills in `.github/skills`.
- If the user asks `how to use this repo`, `how to run this project` etc, give them an outline of `AGENTS.md` and point them to this file, the `README.md` and the `.github/architecture` docs

---

## Skills

- **Primer Builder** (`.github/skills/primer-screenshot-builder/primer-screenshot-builder.md`) — Self-contained skill for converting screenshots or UI descriptions into working Primer React pages. Includes page archetypes with JSX scaffolding, build rules, inline component and token references, scene data structuring, and visual fidelity checklist. **This is the primary skill for screenshot-to-code workflows.**

- **Primer Primitives** (`.github/skills/primer-primitives/primer-primitives.md`) — Complete reference of all `@primer/primitives` CSS design tokens. **Only consult when you need tokens not covered by the Primer Builder's inline token tables** (e.g., motion, controls, overlays, breakpoints, component-specific colors).

- **Primer Components Catalog** (`.github/skills/primer-components-catalog/primer-components-catalog.md`) — Full catalog of all `@primer/react` components with props and sub-components. **Only consult when you need details on a component not covered by the Primer Builder's inline quick reference.**

- **Storyboard Data** (`.github/skills/storyboard-data/storyboard-data.md`) — Detailed guide for data structuring. **Only consult for standalone data tasks** (refactoring, creating scenes outside the builder flow). The Primer Builder skill has inline data structuring guidance.

- **Architecture Scanner** (`.github/skills/architecture-scanner/architecture-scanner.md`) Scans the codebase and generates architecture documentation in `.github/architecture/`. Invoke with: "scan the codebase architecture", "update the architecture", "update arch".

---

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:1234
npm run build        # Production build
npm run lint         # Run ESLint
```

---

## Architecture

This is a **Storyboard prototyping app** using Vite and file-based routing via `@generouted/react-router`.

Detailed architectural documentation lives in `.github/architecture/`. Consult the relevant architecture docs when:

- Debugging a hard-to-solve bug in a file or set of files
- Implementing a large-scale refactor of a file

After any meaningful refactor, ask the user if the architecture documents should be updated.

## Key Conventions to follow at all times

- Use **Primer React** components from `@primer/react` for all UI elements
- Use **semantic HTML tags** whenever they are appropriate in between Primer React components
- Use **Primer Octicons** from `@primer/octicons-react` for icons
- Use **CSS Modules** (`*.module.css`) for component-specific styles
  - If you find any `sx` styled-components styling, migrate them to CSS Modules

---

## Key anti-patterns to avoid

- **DO NOT EVER USE** `<Box>` components
- **DO NOT EVER USE** `sx` styled-components

---

## Storyboard Data System

The storyboard data system separates UI prototype data from components using JSON files discovered by a Vite plugin at dev/build time.

### Data File Types

Data files use **suffix-based naming** and can live anywhere in the repo:

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.scene.json` | Page data context | `default.scene.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Parameterized collection (array with `id` per entry) | `posts.record.json` |

Every name+suffix must be unique across the repo — the build fails on duplicates.

---

### Data Objects (`*.object.json`)

Reusable JSON data files that represent entities (users, navigation, etc):

```json
// jane-doe.object.json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "role": "admin",
  "avatar": "https://avatars.githubusercontent.com/u/1?v=4",
  "profile": {
    "bio": "Designer & developer",
    "location": "San Francisco, CA"
  }
}
```

Objects are standalone data fragments — they have no special keys and can be structured however you need.

---

### Scenes (`*.scene.json`)

Scene files compose objects into a complete data context. They support two special keys:

- **`$global`** — An array of object **names** merged into the scene root. Scene values win on conflicts.
- **`$ref`** — An inline reference `{ "$ref": "some-object" }` resolved by **name** from the data index.

```json
// default.scene.json
{
  "$global": ["navigation"],
  "user": { "$ref": "jane-doe" },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true
  }
}
```

References use **names**, not paths: `"jane-doe"` not `"../objects/jane-doe"`.

After loading, `$global` and `$ref` are resolved — the final scene data is a flat object with all references inlined. Circular `$ref` chains are detected and throw an error.

---

### Records (`*.record.json`)

Records are collections — arrays of entries, each with a unique `id`. They power dynamic routes:

```json
// posts.record.json
[
  { "id": "welcome-to-storyboard", "title": "Welcome", "author": "Jane Doe" },
  { "id": "another-post", "title": "Another Post", "author": "Jane Doe" }
]
```

Access with `useRecord('posts', 'slug')` in a `pages/posts/[slug].jsx` dynamic route page.

---

### Scene Loader (`src/storyboard/core/loader.js`)

The loader consumes a data index generated by the Vite plugin (`virtual:storyboard-data-index`):

```js
import { loadScene } from '../storyboard/core/loader.js'

const data = await loadScene('default')    // loads default.scene.json
const data = await loadScene('other-scene') // loads other-scene.scene.json
```

Also exports `loadRecord(name)`, `findRecord(name, id)`, and `sceneExists(name)`.

---

### StoryboardProvider & Hooks

The `StoryboardProvider` wraps the app and loads scene data into React context:

```jsx
import { useSceneData, useSceneLoading, useRecord, useRecords } from '../storyboard'

// Scene data (dot-notation paths)
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const allData = useSceneData() // entire scene object

// Records (dynamic routes)
const post = useRecord('posts', 'slug')    // single entry by URL param
const allPosts = useRecords('posts')        // all entries

const loading = useSceneLoading()
```

**Page-scene matching:** If no `?scene=` param or `sceneName` prop is provided, the provider checks whether a scene file exists whose name matches the current page (e.g. `Repositories.scene.json` for the `/Repositories` route). If it does, that scene is loaded automatically. Otherwise it falls back to `"default"`.

**Public exports** from `src/storyboard/index.js`:
- `StoryboardProvider` — React context provider
- `useSceneData(path?)` — Access scene data by dot-notation path
- `useSceneLoading()` — Returns true while scene is loading
- `useRecord(name, param)` — Load single record entry by URL param
- `useRecords(name)` — Load all entries from a record collection
- `loadScene(name)` — Low-level scene loader
- `loadRecord(name)` — Low-level record loader
- `findRecord(name, id)` — Find record entry by id
- `sceneExists(name)` — Check if a scene file exists
- `getByPath(obj, path)` — Dot-notation path utility