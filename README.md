# Storyboard

A small framework to create stateful prototypes. Create `scenes` with JSON to prototype flows of your app and save all interaction as URL parameters. This means you can:

- Set up interactions that create and edit data in your UI with ease
- Share *any* state of your prototype – every single change has a unique URL!
- Build a static site that can be deployed anywhere (including GitHub Pages)
- Work with data structures that mirror your production app without dealing with APIs or using heavy frameworks like NextJS

Built with [Vite](https://vite.dev) and [generouted](https://github.com/oedotme/generouted). 

Uses [GitHub Primer](https://primer.style) as the default design system, with per-page support for other systems like [Reshaped](https://www.reshaped.so).

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
│  Data Files (read-only)      │  ← Discovered by Vite plugin
│  *.scene.json / *.object.json│
│  *.record.json               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Storyboard Context          │  ← Loaded into React context
│  useSceneData() / useOverride │
│  useRecord()                  │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐  ┌────────────┐
│ Components │  │ URL Hash   │  ← Runtime overrides (#key=value)
│            │◄─│ Overrides  │
└────────────┘  └────────────┘
```

---

## Data Structure

Data files use a **suffix-based naming convention** and can live anywhere in the repo. A Vite plugin discovers them automatically at dev/build time.

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.scene.json` | Page data context | `default.scene.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Parameterized collection | `posts.record.json` |

```
src/data/
  ├── default.scene.json         # Main scene
  ├── other-scene.scene.json     # Alternative scene
  ├── jane-doe.object.json       # A user object
  ├── navigation.object.json     # Nav links
  └── posts.record.json          # Blog post collection
```

Files can be organized into subdirectories if desired — the plugin finds them regardless. Every name+suffix must be **unique** across the repo (the build fails with a clear error on duplicates).

### Objects

Objects are **reusable data fragments** — standalone JSON files representing a single entity like a user, a navigation config, or a settings block. Any scene can pull in an object via `$ref`, so you define it once and reuse it everywhere.

Use objects when a piece of data is **shared across multiple scenes** or when you want to keep your scene files focused and readable.

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

#### Creating a new object

Add a `.object.json` file anywhere in the repo (typically in `src/data/`). The name must be unique across all data files.

```json
// acme-org.object.json
{
  "name": "Acme Corp",
  "plan": "enterprise",
  "members": 42
}
```

Then reference it from any scene with `{ "$ref": "acme-org" }`.

#### Updating an object at runtime

Objects are read-only JSON — you don't modify the file at runtime. Instead, use `useOverride()` to override individual fields via the URL hash:

```jsx
const [name, setName] = useOverride('user.name')
setName('Alice')
// URL becomes: #user.name=Alice
// Components reading user.name now see "Alice" instead of "Jane Doe"
```

The JSON file stays unchanged. The override lives in the URL and can be cleared at any time, reverting to the original value.

#### Removing an object field at runtime

To "delete" a value from the UI, override it with an empty string or `null`. Components should handle missing/empty values gracefully:

```jsx
const [bio, setBio] = useOverride('user.profile.bio')
setBio('')  // effectively "removes" the bio from the UI
```

Since every component is expected to handle `null`/`undefined`/empty values, the UI simply stops rendering that content.

### Scenes

Scenes are the **data context for a page** — they define what data is available when a user visits a particular URL. Think of each scene as a complete snapshot of your app's state: the logged-in user, the navigation links, the list of projects, the current settings.

**Why create multiple scenes?** Scenes are how you prototype different states and flows without changing any UI code. A large prototype might have:

- `default.scene.json` — the happy-path state with a full profile, active projects, and all features enabled
- `empty-state.scene.json` — a new user with no projects, testing empty states
- `admin.scene.json` — an admin user with elevated permissions, showing admin-only UI
- `error-state.scene.json` — settings configured to trigger error or warning states
- `onboarding.scene.json` — a first-time user going through a setup flow

Each scene can reference the same objects (via `$ref`) or define its own inline data. Switching between scenes is instant — just change the `?scene=` URL parameter.

#### Composing a scene

Scenes support two special keys for composing data:

- **`$ref`** — Replaced inline with the contents of the referenced object (by name)
- **`$global`** — An array of object names merged into the scene root (scene values win on conflicts)

```json
// default.scene.json
{
  "user": { "$ref": "jane-doe" },
  "navigation": { "$ref": "navigation" },
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

References are resolved by **name** — no relative paths needed. `{ "$ref": "jane-doe" }` finds `jane-doe.object.json` anywhere in the repo.

After loading, all `$ref` and `$global` references are resolved — the final data is a flat object with everything inlined.

`$global` is useful when an object's keys should be merged directly into the scene root rather than nested under a single key. Compare `$ref` vs `$global`:

**With `$ref`** — the object is nested under a key you choose:

```json
// scene file
{ "nav": { "$ref": "navigation" } }

// resolved result
{
  "nav": {
    "primary": [{ "label": "Overview", "url": "/Overview" }],
    "secondary": [{ "label": "Settings", "url": "/settings" }]
  }
}
```

**With `$global`** — the object's keys are merged into the scene root:

```json
// scene file
{
  "$global": ["navigation"],
  "pageTitle": "Repositories"
}

// resolved result
{
  "primary": [{ "label": "Overview", "url": "/Overview" }],
  "secondary": [{ "label": "Settings", "url": "/settings" }],
  "pageTitle": "Repositories"
}
```

This is handy when multiple components read top-level keys (e.g., a header reads `primary`, a sidebar reads `secondary`) and you don't want to nest everything under a single parent key. Scene values always win on conflicts.

JSONC is supported — you can use `//` and `/* */` comments in your data files.

#### Creating a new scene

Add a `.scene.json` file anywhere in `src/data/`:

```json
// empty-state.scene.json
{
  "user": { "$ref": "jane-doe" },
  "projects": [],
  "settings": { "theme": "light" }
}
```

Then load it by visiting `?scene=empty-state` in your browser. No code changes needed.

**Page-scene matching:** If no `?scene=` param is set, Storyboard checks if a scene file matches the current page name. For example, visiting `/Repositories` automatically loads `Repositories.scene.json` if it exists. Otherwise it falls back to `default.scene.json`.

### Records

Records are **collections** — arrays of entries, each with a unique `id` field. They power **dynamic routes** where the same page template renders different content based on the URL (think blog posts, repositories, issues, users — any list-and-detail pattern).

**Why use records instead of scene data?** Scenes provide the static context for a page. Records provide the *collection* that populates lists and detail views. In a large prototype you might have:

- `repositories.record.json` — all repos shown in a list, each clickable to a detail page
- `issues.record.json` — issues for a repo, each with its own route
- `team-members.record.json` — people shown in a team directory

Records are the core building block for any prototype with **repeating items** and **detail pages**.

```json
// posts.record.json
[
  {
    "id": "welcome-to-storyboard",
    "title": "Welcome to Storyboard",
    "date": "2026-02-14",
    "author": "Jane Doe",
    "body": "Storyboard is a prototyping meta-framework..."
  },
  {
    "id": "data-driven-prototyping",
    "title": "Data-Driven Prototyping",
    "date": "2026-02-13",
    "author": "Jane Doe",
    "body": "Traditional prototyping tools force you..."
  }
]
```

#### Reading records

Use `useRecord()` for a single entry (matched by URL param) or `useRecords()` for the full collection:

```jsx
// src/pages/posts/[slug].jsx — detail page
import { useRecord } from '../../storyboard'

function BlogPost() {
  const post = useRecord('posts', 'slug')
  // URL /posts/welcome-to-storyboard → entry with id "welcome-to-storyboard"
  return <h1>{post?.title}</h1>
}
```

```jsx
// src/pages/posts/index.jsx — list page
import { useRecords } from '../../storyboard'

function BlogIndex() {
  const posts = useRecords('posts')
  return posts.filter(p => p.id).map(post => (
    <a key={post.id} href={`/posts/${post.id}`}>{post.title}</a>
  ))
}
```

#### Updating a record entry at runtime

Use `useRecordOverride()` to override a specific field on a specific entry. The override is stored in the URL hash:

```jsx
import { useRecordOverride } from '../../storyboard'

// Override the title of a specific post
const [title, setTitle] = useRecordOverride('posts', 'welcome-to-storyboard', 'title')
setTitle('New Title')
// URL becomes: #record.posts.welcome-to-storyboard.title=New%20Title
```

The hash convention for record overrides is: `record.{name}.{entryId}.{field}=value`

#### Creating a new record entry at runtime

You can create entries that don't exist in the JSON file by setting override fields with a new id. The entry is appended to the collection at runtime:

```
#record.posts.my-new-post.title=Draft%20Post&record.posts.my-new-post.author=Alice
```

When `useRecords('posts')` runs, it sees overrides for an id (`my-new-post`) that doesn't exist in the JSON, so it creates a new entry `{ id: "my-new-post", title: "Draft Post", author: "Alice" }` and appends it to the array.

#### Removing a record entry at runtime

To "delete" an entry from a list, override its `id` to an empty string. The entry still exists in the array, but components that filter on `id` will skip it:

```jsx
const [id, setId] = useRecordOverride('posts', 'welcome-to-storyboard', 'id')
setId('')  // "deletes" this entry
```

For this pattern to work, your list components should filter out entries with empty or falsy ids:

```jsx
const posts = useRecords('posts')
const visiblePosts = posts.filter(p => p.id)
```

This is a convention, not a hard rule — but it's the recommended way to simulate deletion in a prototype where the underlying JSON is read-only.

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

`useSceneData()` is **read-only** — it returns scene data with any hash overrides applied transparently. Use it by default for reading data.

---

## Overrides (Read/Write)

Use `useOverride()` when you need to **write** an override. Values are stored in the **URL hash** (`#key=value`) so they persist across page refreshes and can be shared by copying the URL.

```jsx
import { useOverride } from '../storyboard'

const [value, setValue, clearValue] = useOverride('path.to.value')
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
import { useOverride } from '../storyboard'
import { Button, ButtonGroup } from '@primer/react'

function UserSwitcher() {
  const [name, setName] = useOverride('user.name')
  const [role, setRole] = useOverride('user.role')

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

### Example: Form with StoryboardForm

Storyboard provides form components that automatically persist to URL session state on submit. No hooks or event handlers needed — just use a `name` prop.

```jsx
import { FormControl, Button } from '@primer/react'
import { StoryboardForm, TextInput, Textarea } from '../storyboard'

function ProfileForm() {
  return (
    <StoryboardForm data="user">
      <FormControl>
        <FormControl.Label>Name</FormControl.Label>
        <TextInput name="name" />
      </FormControl>

      <FormControl>
        <FormControl.Label>Bio</FormControl.Label>
        <Textarea name="profile.bio" />
      </FormControl>

      <Button type="submit">Save</Button>
    </StoryboardForm>
  )
}
```

The `data` prop sets a root path. Each input's `name` is appended to it:
- `data="user"` + `name="name"` → session path `user.name`
- `data="user"` + `name="profile.bio"` → session path `user.profile.bio`

Values are buffered locally while typing. On submit, they flush to the URL hash:
```
#user.name=Alice&user.profile.bio=Hello%20world
```

Available form components: `TextInput`, `Textarea`, `Select`, `Checkbox`. They look and behave identically to Primer React originals — just import from `'../storyboard'` instead of `'@primer/react'`.

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

Routes are auto-generated from the file structure in `src/pages/` via [@generouted/react-router](https://github.com/oedotme/generouted) with lazy loading for automatic route-level code splitting:

- `src/pages/index.jsx` → `/`
- `src/pages/Overview.jsx` → `/Overview`
- `src/pages/Signup.jsx` → `/Signup`
- `src/pages/posts/index.jsx` → `/posts`
- `src/pages/posts/[slug].jsx` → `/posts/:slug` (dynamic route)

To create a new page, add a `.jsx` file to `src/pages/`. Each page is loaded on-demand — pages using different design systems (e.g., Reshaped) don't affect the initial bundle size.

### Dynamic Routes

Use `[paramName]` brackets in filenames for dynamic segments. The param value is available via `useParams()` or the `useRecord()` hook:

```
src/pages/posts/[slug].jsx    → /posts/:slug
src/pages/users/[id].jsx      → /users/:id
```

Pair dynamic routes with `.record.json` files to create data-driven parameterized pages. See [Records](#records) above.

### Hash Preservation

URL hash params (session state) are automatically preserved across **all** page navigations — both `<a>` link clicks and programmatic `navigate()` calls. A global interceptor installed in `src/index.jsx` wraps both the document-level click handler and `router.navigate()` to carry the current hash forward automatically.

No page needs to manually append `window.location.hash` — just use `navigate('/Page')` or any link component and the hash carries forward.

Hash is **not** preserved when:
- The target path already defines its own hash fragment
- The link points to an external origin
- `switchScene()` is called (intentionally clears hash since it belongs to the previous scene)

---

## API Reference

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useSceneData(path?)` | `any` | Read scene data (overrides applied transparently). Dot-notation path. Omit path for entire scene. |
| `useSceneLoading()` | `boolean` | `true` while scene is loading |
| `useOverride(path)` | `[value, setValue, clearValue]` | Read/write hash overrides on scene data. Use when you need to set or clear a value. |
| `useScene()` | `{ sceneName, switchScene }` | Current scene name + switch function |
| `useRecord(name, param)` | `object \| null` | Load a single record entry. `name` = record file name, `param` = route param matched against `id`. |
| `useRecords(name)` | `Array` | Load all entries from a record collection. |
| `useRecordOverride(name, entryId, field)` | `[value, setValue, clearValue]` | Read/write hash overrides on a specific record entry field. Builds path as `record.{name}.{entryId}.{field}`. |

### Components

| Component | Description |
|-----------|-------------|
| `<StoryboardProvider>` | Wraps the app. Loads scene from `?scene=` param. Already configured in `src/index.jsx`. |
| `<DevTools>` | Floating debug panel showing current scene, hash params, and scene data. Already configured in `_app.jsx`. |
| `<SceneDebug>` | Renders resolved scene data as formatted JSON. Import directly from `storyboard/internals/components/SceneDebug.jsx`. |
| `<StoryboardForm>` | Form wrapper. `data` prop sets root path for child inputs. Buffers values locally; flushes to URL hash on submit. |
| `<TextInput>` | Wrapped Primer TextInput. `name` prop auto-binds to session state via form context. |
| `<Textarea>` | Wrapped Primer Textarea. `name` prop auto-binds to session state via form context. |
| `<Select>` | Wrapped Primer Select. `name` prop auto-binds to session state via form context. |
| `<Checkbox>` | Wrapped Primer Checkbox. `name` prop auto-binds to session state via form context. |

### Utilities

| Function | Description |
|----------|-------------|
| `loadScene(name)` | Low-level scene loader. Returns resolved scene data. |
| `loadRecord(name)` | Low-level record loader. Returns full array. |
| `findRecord(name, id)` | Find a single entry in a record collection by id. |
| `sceneExists(name)` | Check if a scene file exists. |
| `getByPath(obj, path)` | Dot-notation path accessor. |
| `setByPath(obj, path, value)` | Dot-notation path setter (mutates in-place). |
| `deepClone(obj)` | Deep clone an object. |
| `deepMerge(target, source)` | Deep merge two objects (source wins, arrays replaced). |
| `getParam(key)` | Read a URL hash param. |
| `setParam(key, value)` | Write a URL hash param. |
| `getAllParams()` | Get all hash params as an object. |
| `removeParam(key)` | Remove a URL hash param. |
| `installHashPreserver(router, basename)` | Intercepts both `<a>` link clicks and programmatic `router.navigate()` calls for client-side navigation with hash preservation. |
| `getHashSnapshot()` | Returns current hash string (for `useSyncExternalStore`). |

### Special JSON keys

| Key | Where | What it does |
|-----|-------|-------------|
| `$ref` | Any value in a scene or object | Replaced with the contents of the referenced object, by **name** (e.g., `"jane-doe"` finds `jane-doe.object.json`). |
| `$global` | Top-level array in a scene | Each name is loaded and deep-merged into the scene root. Scene values win on conflicts. |

---

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run lint     # ESLint
```

---

## Architecture

Detailed architecture docs live in `.github/architecture/`. Implementation plan and phase history in `.github/plans/`.

### Core / React Split

The storyboard system is split into framework-agnostic and framework-specific layers:

```
storyboard/
├── core/     ← Framework-agnostic (pure JS, zero dependencies)
├── vite/     ← Vite data plugin (works with any Vite frontend)
├── internals/ ← Framework-specific plumbing (React hooks, context, Primer components)
└── index.js  ← Barrel re-exporting from core + react
```

**For non-React frontends** (Alpine.js, Vue, Svelte, vanilla JS), import only from `core/`:

```js
import {
  init, loadScene, sceneExists, loadRecord, findRecord,
  getByPath, setByPath, deepClone,
  getParam, setParam, getAllParams, removeParam,
  subscribeToHash, getHashSnapshot,
} from './storyboard/core/index.js'

// 1. Seed the data index (the Vite plugin does this automatically)
init({ scenes: { ... }, objects: { ... }, records: { ... } })

// 2. Load a scene
const data = await loadScene('default')

// 3. Read scene values
const userName = getByPath(data, 'user.name')

// 4. Override values via URL hash
setParam('user.name', 'Alice')

// 5. React to hash changes (for reactive frameworks)
subscribeToHash(() => {
  const overriddenName = getParam('user.name') ?? getByPath(data, 'user.name')
  // update your UI
})
```
