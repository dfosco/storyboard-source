# `src/data/scenes/other-scene.json`

<!--
source: src/data/scenes/other-scene.json
category: data
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

An alternate scene that demonstrates how the same prototype can render with different data. It shares the same structure as [`src/data/scenes/default.json`](./default.json.md) (user, navigation, projects, settings) but uses a different user (John Doe, defined inline rather than via `$ref`) and the same navigation object. This validates that switching scenes via `?scene=other-scene` produces a meaningfully different UI state.

## Composition

```json
{
  "navigation": { "$ref": "../objects/navigation" },
  "user": {
    "name": "John Doe",
    "username": "johndoe",
    "role": "admin",
    "avatar": "https://avatars.githubusercontent.com/u/1?v=4",
    "profile": {
      "bio": "Designer & developer",
      "location": "San Francisco, CA"
    }
  },
  "projects": [ /* identical to default.json */ ],
  "settings": { /* identical to default.json */ }
}
```

- **`navigation`** uses `$ref` — same shared nav data as [`default.json`](./default.json.md)
- **`user`** is inline — John Doe with admin role, demonstrating that scenes can mix `$ref` and inline data

These `$ref` directives are resolved at load time by [`src/storyboard/core/loader.js`](../../storyboard/core/loader.js.md).

## Dependencies

- `src/data/objects/navigation.json` — Navigation data (via `$ref`)

## Dependents

- Loaded by [`loadScene('other-scene')`](../../storyboard/core/loader.js.md) — accessible via `?scene=other-scene` URL param

## Notes

The user data is inline here (not a `$ref`) to demonstrate that scenes can mix inline and referenced data. A more DRY approach would be to create a `john-doe.json` object file.
