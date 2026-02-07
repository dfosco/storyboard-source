# `src/data/scenes/other-scene.json`

<!--
source: src/data/scenes/other-scene.json
category: data
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

An alternate scene that demonstrates how the same prototype can render with different data. It shares the same structure as `default.json` (user, navigation, projects, settings) but uses a different user (John Doe, defined inline rather than via `$ref`) and the same navigation object. This validates that switching scenes via `?scene=other-scene` produces a meaningfully different UI state.

<details>
<summary>Technical details</summary>

### Composition

- **`navigation`**: `$ref` to `../objects/navigation` — same shared nav data
- **`user`**: Inline object — John Doe with admin role, same profile structure as Jane Doe
- **`projects`**: Inline array — identical to `default.json` (primer-react, storyboard)
- **`settings`**: Inline object — identical to `default.json`

### Dependencies

- `src/data/objects/navigation.json` — Navigation data (via `$ref`)

### Dependents

- Loaded by `loadScene('other-scene')` — accessible via `?scene=other-scene` URL param

### Notes

- The user data is inline here (not a `$ref`) to demonstrate that scenes can mix inline and referenced data. A more DRY approach would be to create a `john-doe.json` object file.

</details>
