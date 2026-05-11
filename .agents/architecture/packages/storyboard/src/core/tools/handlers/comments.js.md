# `packages/storyboard/src/core/tools/handlers/comments.js`

<!--
source: packages/storyboard/src/core/tools/handlers/comments.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler is the declarative entry point for the comments system. Its `guard` calls the shared comments config helper so the tool disappears completely when comments are disabled, and only then lazy-loads [`packages/storyboard/src/core/ui/CommentsMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CommentsMenuButton.jsx). 

## Composition

```js
export const id = 'comments'

export async function guard() {
  const { isCommentsEnabled } = await import('../../index.js')
  return isCommentsEnabled()
}

export async function component() {
  const mod = await import('../../ui/CommentsMenuButton.jsx')
  return mod.default
}
```

The module cleanly separates a capability check from UI rendering, which keeps toolbar config declarative while still honoring feature toggles.

## Dependencies

- Reads feature state from [`packages/storyboard/src/core/index.js`](../../../../../../../../packages/storyboard/src/core/index.js).
- Dynamically imports [`packages/storyboard/src/core/ui/CommentsMenuButton.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CommentsMenuButton.jsx).

## Dependents

- [`packages/storyboard/src/core/tools/registry.js`](../registry.js.md) exposes the core handler under `comments`.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
