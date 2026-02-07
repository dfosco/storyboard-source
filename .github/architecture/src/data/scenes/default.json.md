# `src/data/scenes/default.json`

<!--
source: src/data/scenes/default.json
category: data
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

The default scene data file, loaded when no `?scene=` parameter is specified. It composes a complete prototype data context by referencing shared objects (`jane-doe` for user data, `navigation` for nav items) via `$ref` directives, and includes inline data for projects and settings.

This scene demonstrates the core data patterns: `$ref` for reusable objects, inline data for scene-specific content, and the overall shape that components expect (user, navigation, projects, settings).

## Composition

```json
{
  "user": { "$ref": "../objects/jane-doe" },
  "navigation": { "$ref": "../objects/navigation" },
  "projects": [
    {
      "id": 1,
      "name": "primer-react",
      "description": "React components for the Primer Design System",
      "owner": { "name": "GitHub", "avatar": "..." },
      "stars": 2500,
      "issues": 42
    },
    { "id": 2, "name": "storyboard", ... }
  ],
  "settings": {
    "theme": "dark_dimmed",
    "notifications": true,
    "language": "en"
  }
}
```

- **`user`** and **`navigation`** use `$ref` to pull from shared objects in `src/data/objects/`
- **`projects`** is an inline array of project objects with id, name, description, owner, stars, issues
- **`settings`** is inline with theme, notifications, and language preferences

## Dependencies

- `src/data/objects/jane-doe.json` — User data (via `$ref`)
- `src/data/objects/navigation.json` — Navigation data (via `$ref`)

## Dependents

- Loaded by `loadScene('default')` — the fallback when no scene is specified
- Used by `StoryboardProvider` and `SceneDebug` as the default scene
