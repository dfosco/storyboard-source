# Storyboard

A small framework to create stateful prototypes. Create `scenes` with JSON to prototype flows of your app and save all interaction as URL parameters. This means:

- Set up interactions that create and edit data in your UI with ease
- Every single change is saved to a unique URL — that means you can share *any* state of your prototype
- Generates a static site that can be deployed anywhere 
- Work with data structures that mirror your production app - without the complexity of connecting to APIs or using complex frameworks like NextJS

Built with [Vite](https://vite.dev) and [generouted](https://github.com/oedotme/generouted). 

Uses [GitHub Primer](https://primer.style) for layout – support for more design systems coming soon!

## Quick Start

```bash
npm install
npm run dev     # http://localhost:1234
```

## How It Works

Storyboard separates **data** from **UI**. Your components read from JSON scene files instead of hardcoding content. 

You can switch between different scenes (flows) via a URL parameter, and override any value at runtime through the URL. 

Every interaction on your UI get saved to the URL and persist during a user session. That also means any session and user state can be recovered just by sharing a URL! 

```
┌──────────────────────────────┐
│  Scene JSON (read-only)      │  ← Your data files define defaults
│  src/data/scenes/default.json│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Storyboard Context          │  ← Loaded into React context
│  useSceneData() / useSession │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐  ┌────────────┐
│ Components │  │ URL Hash   │  ← Runtime overrides (#key=value)
│            │◄─│ Session    │
└────────────┘  └────────────┘
```

---

## Data Structure

```
src/data/
  ├── objects/              # Reusable data fragments
  │   ├── jane-doe.json     # A user object
  │   └── navigation.json   # Nav links
  └── scenes/               # Complete scenarios
      ├── default.json      # Main scene
      └── other-scene.json  # Alternative data
```

### Objects

Objects are standalone JSON files representing a single entity. They live in `src/data/objects/` and can be referenced by any scene.

```json
// src/data/objects/jane-doe.json
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

### Scenes

Scenes compose objects into a full data context. They support two special keys:

- **`$ref`** — Replaced inline with the contents of the referenced file
- **`$global`** — An array of paths merged into the scene root (scene values win on conflicts)

```json
// src/data/scenes/default.json
{
  "user": { "$ref": "../objects/jane-doe" },
  "navigation": { "$ref": "../objects/navigation" },
  "projects": [
    { "id": 1, "name": "primer-react", "stars": 2500 },
    { "id": 2, "name": "storyboard", "stars": 128 }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true,
    "language": "en"
  }
}
```

After loading, all `$ref` and `$global` references are resolved — the final data is a flat object with everything inlined.

JSONC is supported — you can use `//` and `/* */` comments in your data files.

### Creating a new scene

Add a new `.json` file to `src/data/scenes/`:

```json
// src/data/scenes/empty-state.json
{
  "user": { "$ref": "../objects/jane-doe" },
  "projects": [],
  "settings": { "theme": "light" }
}
```

Then load it by visiting `?scene=empty-state` in your browser.

---

## Reading Scene Data

Use `useSceneData()` to read data from the current scene. Supports dot-notation for nested access.

```jsx
import { useSceneData } from '../storyboard'

function UserCard() {
  const user = useSceneData('user')
  const name = useSceneData('user.profile.name')
  const firstProject = useSceneData('projects.0')
  const allData = useSceneData() // entire scene object

  return (
    <div>
      <Text>{name}</Text>
      <Text>{user.profile.bio}</Text>
      <Text>First project: {firstProject.name}</Text>
    </div>
  )
}
```

`useSceneData()` is **read-only** — it always returns the scene JSON defaults, ignoring any runtime overrides.

---

## Session State (Runtime Overrides)

Use `useSession()` to read and write runtime state. Values are stored in the **URL hash** (`#key=value`) so they persist across page refreshes and can be shared by copying the URL.

```jsx
import { useSession } from '../storyboard'

const [value, setValue, clearValue] = useSession('path.to.value')
```

The hook returns a 3-element array:

| Index | What it does |
|-------|-------------|
| `value` | Current value — reads from URL hash first, falls back to scene JSON default |
| `setValue` | Writes a new value to the URL hash |
| `clearValue` | Removes the hash param, reverting to the scene default |

### Read priority

```
URL hash param  →  Scene JSON default  →  undefined
```

If the user hasn't overridden anything, they see the scene default. Once they interact, the URL hash takes over. Clearing the override reverts to the default.

### Example: Updating user info with buttons

```jsx
import { useSession } from '../storyboard'
import { Button, ButtonGroup } from '@primer/react'

function UserSwitcher() {
  const [name, setName] = useSession('user.name')
  const [role, setRole] = useSession('user.role')

  return (
    <div>
      <Text>Current user: {name} ({role})</Text>
      <ButtonGroup>
        <Button onClick={() => { setName('Alice'); setRole('admin') }}>
          Switch to Alice
        </Button>
        <Button onClick={() => { setName('Bob'); setRole('viewer') }}>
          Switch to Bob
        </Button>
      </ButtonGroup>
    </div>
  )
}
```

Clicking a button updates the URL to something like:
```
/?scene=default#user.name=Alice&user.role=admin
```

Refresh the page — the override persists. Remove the hash params from the URL — it reverts to the scene JSON defaults.

### Example: Form with controlled inputs

```jsx
import { useState } from 'react'
import { useSession } from '../storyboard'
import { FormControl, TextInput, Button } from '@primer/react'

function ProfileForm() {
  const [name, setName] = useSession('user.name')
  const [bio, setBio] = useSession('user.profile.bio')

  // Local form state
  const [formName, setFormName] = useState(name || '')
  const [formBio, setFormBio] = useState(bio || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    setName(formName)
    setBio(formBio)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
      </FormControl>

      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <TextInput
          value={formBio}
          onChange={(e) => setFormBio(e.target.value)}
        />
      </FormControl>

      <Button type="submit">Save</Button>
    </form>
  )
}
```

Clicking **Save** updates the URL hash:
```
#user.name=Alice&user.profile.bio=Hello%20world
```

---

## Scene Switching

### Via URL

Change the `?scene=` search parameter:

```
http://localhost:1234/?scene=other-scene
http://localhost:1234/?scene=empty-state
```

No parameter defaults to `?scene=default`.

### Programmatically

```jsx
import { useScene } from '../storyboard'
import { Button } from '@primer/react'

function ScenePicker() {
  const { sceneName, switchScene } = useScene()

  return (
    <div>
      <Text>Current scene: {sceneName}</Text>
      <Button onClick={() => switchScene('other-scene')}>
        Switch to other-scene
      </Button>
    </div>
  )
}
```

`switchScene()` updates the `?scene=` param and clears all hash overrides (since they belonged to the previous scene).

---

## Routing

Routes are auto-generated from the file structure in `src/pages/` via [@generouted/react-router](https://github.com/oedotme/generouted):

- `src/pages/index.jsx` → `/`
- `src/pages/Overview.jsx` → `/Overview`
- `src/pages/Issues.jsx` → `/Issues`

To create a new page, add a `.jsx` file to `src/pages/`.

---

## API Reference

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useSceneData(path?)` | `any` | Read-only scene data. Dot-notation path. Omit path for entire scene. |
| `useSceneLoading()` | `boolean` | `true` while scene is loading |
| `useSession(path)` | `[value, setValue, clearValue]` | Read/write session state. Merged with scene defaults. |
| `useScene()` | `{ sceneName, switchScene }` | Current scene name + switch function |

### Components

| Component | Description |
|-----------|-------------|
| `<StoryboardProvider>` | Wraps the app. Loads scene from `?scene=` param. Already configured in `src/index.jsx`. |
| `<SceneDebug>` | Renders resolved scene data as formatted JSON. Useful for debugging. |

### Utilities

| Function | Description |
|----------|-------------|
| `loadScene(name)` | Low-level scene loader. Returns resolved scene data. |
| `getByPath(obj, path)` | Dot-notation path accessor. |
| `getParam(key)` | Read a URL hash param. |
| `setParam(key, value)` | Write a URL hash param. |
| `getAllParams()` | Get all hash params as an object. |
| `removeParam(key)` | Remove a URL hash param. |

### Special JSON keys

| Key | Where | What it does |
|-----|-------|-------------|
| `$ref` | Any value in a scene or object | Replaced with the contents of the referenced file. Path is relative to the current file. |
| `$global` | Top-level array in a scene | Each path is loaded and deep-merged into the scene root. Scene values win on conflicts. |

---

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run lint     # ESLint
```

---

## Architecture

Detailed architecture docs live in `.github/architecture/`. Implementation plan and phase history in `.github/plans/`.
