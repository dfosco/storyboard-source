# Storyboard Data Structuring

> Triggered by: when building a new page using the primer-builder workflow, "create scene data", "set up storyboard data", "create data objects", "create new page", "create new route"m, when structuring data for a prototype page

## What This Does

Guides the creation of data objects and scene files for pages being built. Determines what data should be externalized into the Storyboard data system vs. hardcoded in the component.

## When This Applies

- After the primer-builder skill has identified the page structure and components (Steps 1–3)
- Replaces the primer-builder's Step 4 (Plan Data) with a more structured approach
- When refactoring an existing page to use scene data

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

Create one object file per logical entity. Follow existing naming conventions:

| Data type | File name pattern | Example |
|-----------|------------------|---------|
| User/person | `src/data/objects/{name}.json` | `jane-doe.json` |
| Navigation | `src/data/objects/{context}-navigation.json` | `org-navigation.json` |
| Entity list | `src/data/objects/{entity-plural}.json` | `repositories.json` |
| Org/team | `src/data/objects/{org-name}.json` | `primer-org.json` |

**Object structure rules:**
- Keep objects flat where possible — avoid deep nesting
- Use arrays for lists of items
- Include all fields that the UI needs — don't make the component compute derived data
- Use realistic placeholder data (real GitHub avatar URLs, plausible repo names, etc.)

### Step 3: Compose the scene

Create a scene file in `src/data/scenes/` that composes the objects:

```json
{
  "$global": ["../objects/org-navigation"],
  "user": { "$ref": "../objects/jane-doe" },
  "org": {
    "name": "my-org",
    "avatar": "https://avatars.githubusercontent.com/u/9919?v=4"
  },
  "repositories": { "$ref": "../objects/repositories" }
}
```

**Scene composition rules:**
- Use `$global` for navigation — it merges at the root level, making nav data available at the top
- Use `$ref` for entity objects — keeps them reusable across scenes
- Inline small, scene-specific data directly (org name, settings, filter state)
- Name the scene after the page/flow: `org-repos.json`, `issue-detail.json`, `settings-general.json`
- Rule of thumb, a scene can be named after it's corresponding page 

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

## Examples

### Navigation object

```json
// src/data/objects/org-navigation.json
{
  "topnav": [
    { "icon": "home", "label": "Overview", "url": "/Overview" },
    { "icon": "repo", "label": "Repositories", "url": "/Repositories", "counter": 5432, "current": true },
    { "icon": "project", "label": "Projects", "url": "/Projects", "counter": 25 },
    { "icon": "package", "label": "Packages", "url": "/Packages", "counter": 21 },
    { "icon": "people", "label": "Teams", "url": "/Teams", "counter": 132 },
    { "icon": "person", "label": "People", "url": "/People", "counter": 566 },
    { "icon": "shield", "label": "Security", "url": "/Security" },
    { "icon": "graph", "label": "Insights", "url": "/Insights" },
    { "icon": "gear", "label": "Settings", "url": "/Settings" }
  ],
  "sidenav": [
    { "label": "All", "url": "/repos", "current": true },
    { "label": "Public", "url": "/repos?type=public" },
    { "label": "Private", "url": "/repos?type=private" },
    { "label": "Sources", "url": "/repos?type=sources" },
    { "label": "Forks", "url": "/repos?type=forks" },
    { "label": "Archived", "url": "/repos?type=archived" }
  ]
}
```

### Entity list object

```json
// src/data/objects/repositories.json
{
  "repositories": [
    {
      "name": "primer-react",
      "description": "React components for the Primer Design System",
      "language": "TypeScript",
      "stars": 2500,
      "forks": 380,
      "updatedAt": "2024-01-15T10:30:00Z",
      "url": "/primer/primer-react"
    },
    {
      "name": "design-tokens",
      "description": "Design tokens for Primer",
      "language": "JavaScript",
      "stars": 890,
      "forks": 120,
      "updatedAt": "2024-01-10T08:00:00Z",
      "url": "/primer/design-tokens"
    }
  ]
}
```

### Scene composing both

```json
// src/data/scenes/org-repos.json
{
  "$global": ["../objects/org-navigation"],
  "user": { "$ref": "../objects/jane-doe" },
  "org": {
    "name": "primer",
    "avatar": "https://avatars.githubusercontent.com/u/7143434?v=4"
  },
  "repositories": { "$ref": "../objects/repositories" },
  "filterQuery": ""
}
```

## Checklist

Before finishing data structuring, verify:

- [ ] Every navigation array is in a data object (not hardcoded in the component)
- [ ] Every list of content items is in a data object
- [ ] User/org profile data is in a data object
- [ ] Button labels, placeholder text, and section headings are hardcoded
- [ ] The scene file uses `$global` for navigation and `$ref` for entities
- [ ] The component uses `useSceneData()` for all externalized data
- [ ] Data objects use realistic placeholder values
- [ ] The scene name matches the page name or flow

## Final Step: Provide the URL

After creating the scene and wiring up the component, **always provide the full dev URL** so the user can immediately preview the page.

**Page-scene matching:** If the scene file name matches the page file name exactly (e.g. `scenes/Repositories.json` for `pages/Repositories.jsx`), the scene loads automatically — no `?scene=` param needed:

```
http://localhost:1234/Repositories
```

If the scene name differs from the page name, add the `?scene=` parameter:

```
http://localhost:1234/Repositories?scene=heron-silver
```

Use the port from the running dev server (default `1234`) and the route path matching the page file name.
