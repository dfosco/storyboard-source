# Storyboard Data Structuring

> Triggered by: when building a new page or route in storyboard, "create scene data", "set up storyboard data", "create data objects", "create new page", "create new route", when structuring data for a prototype page

## What This Does

Guides the creation of data objects, scene files, and record collections for pages being built. Determines what data should be externalized into the Storyboard data system vs. hardcoded in the component.

## Data File Types

Storyboard uses **suffix-based naming** for data files. Files can live anywhere in the repo — a Vite plugin discovers them automatically at dev/build time.

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.scene.json` | Page data context | `default.scene.json` |
| `.object.json` | Reusable data fragment | `jane-doe.object.json` |
| `.record.json` | Parameterized collection (array with `id` per entry) | `posts.record.json` |

**Rules:**
- Every name+suffix must be unique across the entire repo (build fails on duplicates)
- Files can be organized into any subdirectory structure
- JSONC (comments) is supported — use `.jsonc` extension if preferred
- `$ref` and `$global` use **name-based** references (not paths): `{ "$ref": "jane-doe" }` finds `jane-doe.object.json` anywhere

## When This Applies

- After the primer-builder skill has identified the page structure and components (Steps 1–3)
- Replaces the primer-builder's Step 4 (Plan Data) with a more structured approach
- When refactoring an existing page to use scene data
- When creating dynamic route pages with records

## The Core Rule: What Goes in Data vs. What's Hardcoded

### Externalize as data objects

**Content and business model data** — anything that represents "what" the page displays:

- User profiles (name, avatar, bio, role)
- Repository / project metadata (name, description, language, stars, forks)
- Issue / PR items (title, state, author, labels, timestamps)
- Organization info (name, avatar, member count)
- Lists of entities (repos, issues, teams, packages, people)

**Navigation** — always externalize because it has repeated elements with many labels that benefit from easy bulk adjustment:

- Top navigation tabs (label, icon, counter, url, current state)
- Sidebar filter lists
- Settings section navigation
- Breadcrumb paths

**Important**: This will more usually be slotted in existing Template components from the repository, not generated code.

### Hardcode in the component

**UI chrome and microcopy** — anything that describes "how" the page works:

- Button labels: `"New repository"`, `"Save changes"`, `"Cancel"`
- Placeholder text: `"Find a repository..."`
- Section headings that are structural: `"Pinned repositories"`, `"Activity"`
- Empty state messages: `"No results found"`
- Filter dropdown labels: `"Type"`, `"Language"`, `"Sort"`
- Dropdown option labels: `"All"`, `"Public"`, `"Private"`
- Static instructional text

### Gray area — use judgment

- **Counters on tabs** — externalize if they represent real data counts; hardcode if decorative
- **Metadata labels** (e.g., "Updated 3 days ago") — externalize the date, hardcode the label format
- **Card/list item structure** — externalize the items array, hardcode the card template

## Workflow

### Step 1: Inventory the data needs

From the page description (primer-builder Step 1), list every piece of dynamic content:

```
Navigation:
  - topnav: 9 tabs with icons, labels, counters, active state
  - sidenav: 10 filter options with active state

Content:
  - org name, avatar
  - 6 repository items, each with: name, description, language, stars, updated date
  - filter query string
```

### Step 2: Design the data objects

Create one object file per logical entity:

| Data type | File name pattern | Example |
|-----------|------------------|---------|
| User/person | `{name}.object.json` | `jane-doe.object.json` |
| Navigation | `{context}-navigation.object.json` | `org-navigation.object.json` |
| Entity list | `{entity-plural}.object.json` | `repositories.object.json` |
| Org/team | `{org-name}.object.json` | `primer-org.object.json` |

**Object structure rules:**
- **The object file's top-level structure IS the value that `$ref` resolves to.** If the scene has `"repositories": { "$ref": "repositories" }`, the object file should be a bare array `[...]`, not `{ "repositories": [...] }` — otherwise the data double-nests as `repositories.repositories`.
- Same rule for single-entity objects: if the scene has `"user": { "$ref": "jane-doe" }`, the object file should contain the user fields directly at root (`{ "name": "Jane", ... }`), not wrapped in `{ "user": { "name": "Jane", ... } }`.
- Keep objects flat where possible — avoid deep nesting
- Use arrays for lists of items
- Include all fields that the UI needs — don't make the component compute derived data
- Use realistic placeholder data (real GitHub avatar URLs, plausible repo names, etc.)

### Step 3: Compose the scene

Create a scene file that composes the objects:

```json
// default.scene.json
{
  "$global": ["org-navigation"],
  "user": { "$ref": "jane-doe" },
  "org": {
    "name": "my-org",
    "avatar": "https://avatars.githubusercontent.com/u/9919?v=4"
  },
  "repositories": { "$ref": "repositories" }
}
```

**Scene composition rules:**
- Use `$global` for navigation — it merges at the root level, making nav data available at the top
- Use `$ref` for entity objects — keeps them reusable across scenes
- `$ref` and `$global` use **names**, not paths: `"jane-doe"` not `"../objects/jane-doe"`
- Inline small, scene-specific data directly (org name, settings, filter state)
- Name the scene after the page/flow: `org-repos.scene.json`, `issue-detail.scene.json`
- Rule of thumb: a scene can be named after its corresponding page

### Step 4: Wire up the component

In the page component, use `useSceneData()` with dot-notation paths:

```jsx
import { useSceneData, useSceneLoading } from '../storyboard'

function ReposPage() {
  const topnav = useSceneData('topnav')       // from $global navigation
  const sidenav = useSceneData('sidenav')     // from $global navigation
  const org = useSceneData('org')
  const repos = useSceneData('repositories')
  const loading = useSceneLoading()

  if (loading) return <Spinner />

  return (
    <Application title={org.name} topnav={topnav} sidenav={sidenav}>
      {/* Hardcoded UI chrome */}
      <h2>All repositories</h2>
      <Button variant="primary">New repository</Button>
      <TextInput placeholder="Find a repository..." />

      {/* Data-driven content */}
      {repos.map(repo => (
        <article key={repo.name}>
          <h3><a href={repo.url}>{repo.name}</a></h3>
          <p>{repo.description}</p>
        </article>
      ))}
    </Application>
  )
}
```

## Records & Dynamic Routes

Records power **parameterized pages** — the same page template renders different content based on the URL.

### Creating a record

A record file is a **collection** — an array of entries, each with a unique `id`:

```json
// posts.record.json
[
  {
    "id": "welcome-to-storyboard",
    "title": "Welcome to Storyboard",
    "date": "2026-02-14",
    "author": "Jane Doe",
    "body": "..."
  },
  {
    "id": "another-post",
    "title": "Another Post",
    "date": "2026-02-13",
    "author": "Jane Doe",
    "body": "..."
  }
]
```

### Creating a dynamic route page

Use generouted's `[paramName]` bracket convention for the filename:

```
src/pages/posts/[slug].jsx    → /posts/:slug
```

In the component, use `useRecord()`:

```jsx
import { useRecord } from '../../storyboard'

function BlogPost() {
  // 'posts' = record file name, 'slug' = route param matched against entry.id
  const post = useRecord('posts', 'slug')
  // URL /posts/welcome-to-storyboard → entry with id "welcome-to-storyboard"

  if (!post) return <p>Post not found</p>
  return <h1>{post.title}</h1>
}
```

### Listing all records

Use `useRecords()` for index/listing pages:

```jsx
import { useRecords } from '../../storyboard'

function PostsIndex() {
  const posts = useRecords('posts')
  return posts.map(post => (
    <Link key={post.id} to={`/posts/${post.id}`}>{post.title}</Link>
  ))
}
```

### Records + Scenes

A page can use both a scene (for page-level data like navigation) and a record (for parameterized content). Pass `recordName` and `recordParam` to `StoryboardProvider` to merge record data under the `record` key:

```jsx
<StoryboardProvider recordName="posts" recordParam="slug">
  {/* useSceneData('record.title') works here */}
</StoryboardProvider>
```

## Common Pitfall: Double-Nesting with `$ref`

The most frequent data bug is double-nesting. This happens when an object file wraps its data in a key that matches the scene's `$ref` key:

```
// ❌ WRONG — causes double-nesting (advisory.advisory)

// scene: { "advisory": { "$ref": "advisory" } }
// advisory.object.json:
{ "advisory": { "title": "Bug", "severity": "High" } }
// Result: scene.advisory = { "advisory": { "title": "Bug", ... } }

// ✅ CORRECT — object file is the raw value

// scene: { "advisory": { "$ref": "advisory" } }
// advisory.object.json:
{ "title": "Bug", "severity": "High" }
// Result: scene.advisory = { "title": "Bug", "severity": "High" }
```

**Rule of thumb:** The `$ref` key in the scene IS the namespace. The object file provides the value.

## Hash Param Preservation (CRITICAL)

URL hash params are the foundation of the override system. They carry user-set and session-set values across navigations. **Never write code that drops them.**

### How it works

`installHashPreserver(router)` in `src/index.jsx` patches both `<a>` click interception and `router.navigate()` so that hash params automatically carry forward on every navigation — including programmatic `navigate('/SomePage')` calls.

### Rules

1. **Never manually strip or omit the hash.** The global preserver handles it. Plain `navigate('/Page')` works — the hash carries forward automatically.
2. **Never bypass the router.** Using `window.location.href = '/Page'` or `window.location.assign()` will drop the hash. Always use React Router's `navigate()` or `<Link>`.
3. **If a page reads overrides, it must use the hooks.** `useSceneData(path)` automatically merges hash overrides. `useOverride(path)` gives read/write access.
4. **If a page writes overrides, downstream pages get them for free.** The Signup→Dashboard flow works because Signup writes via `useOverride`, navigation carries the hash, and Dashboard reads via `useSceneData` — no manual plumbing needed.
5. **To intentionally clear overrides**, use `clearValue` from `useOverride` or `removeParam` from `session.js`. Never clear by navigating without the hash.

## Checklist

Before finishing data structuring, verify:

- [ ] **No double-nesting:** Object files referenced via `$ref` contain raw values, not wrapped in a key
- [ ] Every navigation array is in a data object (not hardcoded in the component)
- [ ] Every list of content items is in a data object
- [ ] User/org profile data is in a data object
- [ ] Button labels, placeholder text, and section headings are hardcoded
- [ ] The scene file uses `$global` for navigation and `$ref` for entities
- [ ] `$ref` and `$global` use **names** (not relative paths)
- [ ] Data files use the correct suffix: `.scene.json`, `.object.json`, `.record.json`
- [ ] The component uses `useSceneData()` for all externalized data
- [ ] Dynamic route pages use `useRecord()` for parameterized content
- [ ] Data objects use realistic placeholder values
- [ ] The scene name matches the page name or flow
- [ ] **Hash params are never dropped** — see "Hash Param Preservation" above

## Final Step: Provide the URL

After creating the scene and wiring up the component, **always provide the full dev URL** so the user can immediately preview the page.

**Page-scene matching:** If the scene file name matches the page file name exactly (e.g. `Repositories.scene.json` for `pages/Repositories.jsx`), the scene loads automatically — no `?scene=` param needed:

```
http://localhost:1234/Repositories
```

If the scene name differs from the page name, add the `?scene=` parameter:

```
http://localhost:1234/Repositories?scene=heron-silver
```

For dynamic routes, use the record entry's `id` as the URL slug:

```
http://localhost:1234/posts/welcome-to-storyboard
```
