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

<details>
<summary>Technical details</summary>

### Composition

- **`user`**: `$ref` to `../objects/jane-doe` — Jane Doe user profile
- **`navigation`**: `$ref` to `../objects/navigation` — primary and secondary nav items
- **`projects`**: Inline array of 2 project objects (primer-react, storyboard) with id, name, description, owner, stars, issues
- **`settings`**: Inline object with `theme: "dark_dimmed"`, `notifications: true`, `language: "en"`

### Dependencies

- `src/data/objects/jane-doe.json` — User data (via `$ref`)
- `src/data/objects/navigation.json` — Navigation data (via `$ref`)

### Dependents

- Loaded by `loadScene('default')` — the fallback when no scene is specified
- Used by `StoryboardProvider` and `SceneDebug` as the default scene

</details>
