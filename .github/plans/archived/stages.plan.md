# Stages Architecture Plan

## The Metaphor (Simplified)

| Concept | What it is |
|---------|-----------|
| **Scene** | Data + state (JSON files), selected via `?scene=` |
| **Stage** | Just the app — its pages, routes, components |

**There is no "Stage" abstraction in the code.** Stage is just a conceptual term for "the prototype application." The app is built normally with React + Vite + Generouted. Scenes can be freely swapped at runtime.

---

## Core Principle: Graceful Degradation

**Any scene can run on any page. Missing data never crashes the page.**

| Situation | Behavior |
|-----------|----------|
| Scene has data the page doesn't use | Ignored (no error) |
| Page requests data the scene doesn't have | Returns `undefined`, component handles it |
| Nested path doesn't exist | Returns `undefined`, not an error |

```tsx
// Component level graceful handling
const projects = useSceneData('projects') // undefined if missing
const userName = useSession('user.name')  // undefined if missing

// Component decides how to handle missing data
if (!projects) return <EmptyState />
return <ProjectList projects={projects} />
```

**The hooks never throw.** They return `undefined` for missing paths. Components are responsible for handling missing data gracefully.

---

## Repository Structure (Simple)

```
/src/
  ├── pages/                      # Generouted file-based routing
  │   ├── index.tsx               → /
  │   ├── dashboard.tsx           → /dashboard
  │   ├── settings.tsx            → /settings
  │   └── projects/
  │       ├── index.tsx           → /projects
  │       └── [id].tsx            → /projects/:id
  │
  ├── components/                 # Shared components
  │   ├── ProjectCard.tsx
  │   └── UserAvatar.tsx
  │
  └── storyboard/                 # Storyboard library
      └── ...

/public/data/
  └── scenes/
      ├── default.json            # Full data for all pages
      ├── empty-state.json        # Minimal/empty data
      ├── dashboard-only.json     # Only has dashboard data
      └── shared/
          └── navigation.json
```

---

## How Scenes Work with Pages

```
URL: /dashboard?scene=default
├── Page: Dashboard.tsx
├── Scene: default.json (has dashboard, settings, projects data)
└── Result: Dashboard renders with full data

URL: /dashboard?scene=dashboard-only  
├── Page: Dashboard.tsx
├── Scene: dashboard-only.json (only has dashboard data)
└── Result: Dashboard renders, settings/projects data is undefined

URL: /settings?scene=dashboard-only
├── Page: Settings.tsx
├── Scene: dashboard-only.json (no settings data)
└── Result: Settings renders with empty/fallback state
```

---

## Hook Behavior

### `useSceneData(path)`
```tsx
const user = useSceneData('user')
// Scene has 'user' → returns user object
// Scene missing 'user' → returns undefined (no error)

const avatar = useSceneData('user.profile.avatar')
// Scene has nested path → returns value
// Any part of path missing → returns undefined (no error)
```

### `useSession(path)`
```tsx
const [theme, setTheme] = useSession('settings.theme')
// URL has param OR Scene has value → returns it
// Neither exists → returns undefined (no error)
// setTheme() always works (writes to URL)
```

### Optional: Default values
```tsx
const theme = useSceneData('settings.theme') ?? 'light'
const [count, setCount] = useSession('counter', { default: 0 })
```

---

## Component Patterns for Graceful Degradation

### Pattern 1: Conditional rendering
```tsx
const projects = useSceneData('projects')
if (!projects) return null // or <EmptyState />
return <ProjectList projects={projects} />
```

### Pattern 2: Default values
```tsx
const projects = useSceneData('projects') ?? []
return <ProjectList projects={projects} />
```

### Pattern 3: Loading boundary (optional future feature)
```tsx
<SceneDataBoundary path="projects" fallback={<EmptyState />}>
  <ProjectList />
</SceneDataBoundary>
```

---

## Summary

- **No Stage config or build flags** — just a normal Vite + React app
- **Scenes are freely interchangeable** — any scene works on any page
- **Graceful degradation** — missing data = `undefined`, never crashes
- **Components own their fallbacks** — each component decides how to handle missing data
