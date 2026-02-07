# Copilot Instructions

Before running any other instruction, evaluate if the user prompt contains a trigger for one or more skills in `.github/skills`

---

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:1234
npm run build        # Production build
npm run lint         # Run ESLint
```

## Architecture

This is a **Primer React prototyping app** using Vite and file-based routing via `@generouted/react-router`.

### Routing

Routes are auto-generated from the file structure in `src/pages/`:
- `src/pages/index.jsx` → `/`
- `src/pages/Overview.jsx` → `/Overview`
- `src/pages/Issues.jsx` → `/Issues`

To create a new page, add a `.jsx` file to `src/pages/` and it will automatically be available at the corresponding URL path.

### Component Organization

- **`src/pages/`** - Route components (each file = one route)
- **`src/components/`** - Reusable UI components (GlobalNavigation, SidebarNavigation, etc.)
- **`src/templates/`** - Page layout templates (e.g., `Application` template with header + sidebar)

### Layout Pattern

Pages typically use the `Application` template which provides:
- Global navigation header with customizable `topnav` items
- Optional `sidenav` sidebar navigation
- Main content area via `children`

```jsx
<Application title="Primer" subtitle="React" topnav={topnav} sidenav={sidenav}>
  {/* Page content */}
</Application>
```

## Prime Anti-patterns to Avoid

- Do NOT use `<Box>` components
- Do NOT use `sx` styled-components

## Skills

- **Primer Primitives** (`.github/skills/primer-primitives/primer-primitives.md`) — Complete reference of all `@primer/primitives` CSS design tokens (sizes, typography, borders, breakpoints, controls, motion). **Always consult this skill when writing CSS or any component that imports `@primer/react`.**
- **Architecture Scanner** (`.github/skills/architecture-scanner/architecture-scanner.md`) — Scans the codebase and generates architecture documentation in `.github/architecture/`. Invoke with: "scan the codebase architecture", "update the architecture", "update arch".

## Storyboard Data System

The storyboard data system separates UI prototype data from components using JSON files and a scene loader.

### Data Objects (`src/data/objects/`)

Reusable JSON data files that represent entities (users, navigation, etc.). Each file exports a plain JSON object:

```json
// src/data/objects/jane-doe.json
{
  "jane": {
    "name": "Jane Doe",
    "username": "janedoe",
    "role": "admin",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4",
    "profile": {
      "bio": "Designer & developer",
      "location": "San Francisco, CA"
    }
  }
}
```

Objects are standalone data fragments — they have no special keys and can be structured however you need.

### Scenes (`src/data/scenes/`)

Scene files compose objects into a complete data context for a prototype. They support two special keys:

- **`$global`** — An array of relative paths to objects that get merged into the scene root. The scene's own values win on conflicts.
- **`$ref`** — An inline reference `{ "$ref": "../objects/some-object" }` that gets replaced with the contents of the referenced file at any nesting level.

```json
// src/data/scenes/default.json
{
  "$global": ["../objects/navigation"],
  "user": { "$ref": "../objects/jane-doe" },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true
  }
}
```

After loading, `$global` and `$ref` are resolved — the final scene data is a flat object with all references inlined. Circular `$ref` chains are detected and throw an error.

### Scene Loader (`src/storyboard/core/loader.js`)

The `loadScene(sceneName)` function loads and resolves a scene file:

```js
import { loadScene } from '../storyboard/core/loader.js'

const data = await loadScene('default')    // loads src/data/scenes/default.json
const data = await loadScene('other-scene') // loads src/data/scenes/other-scene.json
```

### SceneDebug Component (`src/storyboard/components/SceneDebug.jsx`)

A debug component that renders resolved scene data as formatted JSON. It reads the scene name from a `?scene=` URL parameter, a `sceneName` prop, or defaults to `"default"`.

### StoryboardProvider & useSceneData Hook

The `StoryboardProvider` wraps the app and loads scene data into React context. Components access scene data via the `useSceneData` hook with dot-notation paths:

```jsx
import { useSceneData, useSceneLoading } from '../storyboard'

// Access nested data with dot-notation
const user = useSceneData('user')
const userName = useSceneData('user.profile.name')
const firstProject = useSceneData('projects.0')
const allData = useSceneData() // entire scene object

const loading = useSceneLoading() // true while loading
```

The provider reads the scene name from `?scene=` URL param, a `sceneName` prop, or defaults to `"default"`.

**Public exports** from `src/storyboard/index.js`:
- `StoryboardProvider` — React context provider
- `useSceneData(path?)` — Access scene data by dot-notation path
- `useSceneLoading()` — Returns true while scene is loading
- `getByPath(obj, path)` — Dot-notation path utility
- `loadScene(sceneName)` — Low-level scene loader

### Creating New Data

1. **New object**: Add a `.json` file to `src/data/objects/`. Structure it however you need.
2. **New scene**: Add a `.json` file to `src/data/scenes/`. Use `$global` for shared data and `$ref` to compose objects.
3. **Reference an object**: Use `{ "$ref": "../objects/filename" }` (no `.json` extension) anywhere in a scene.

## Key Conventions

- Use **Primer React** components from `@primer/react` for all UI elements
- Use **Primer Octicons** from `@primer/octicons-react` for icons
- Use **CSS Modules** (`*.module.css`) for component-specific styles
- Default theme is `night` mode with `dark_dimmed` scheme (configured in `src/index.jsx`)