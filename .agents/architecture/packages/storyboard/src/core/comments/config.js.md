# `packages/storyboard/src/core/comments/config.js`

<!--
source: packages/storyboard/src/core/comments/config.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module normalizes the comments subset of `storyboard.config.json` into a compact runtime config object. It gives the rest of the comments system one stable place to read repository, discussion category, and base-path settings.

## Composition

The module keeps config in a private singleton, exposes an initializer, a getter, and a boolean enablement check. Missing repository fields are converted to empty strings so callers can use `isCommentsEnabled()` instead of defensive null checks everywhere.

```js
export function initCommentsConfig(rawConfig, options = {}) {
  if (!rawConfig || !rawConfig.comments) {
    _config = null
    return
  }
  const c = rawConfig.comments
  const r = rawConfig.repository
  _config = {
    repo: { owner: r?.owner ?? '', name: r?.name ?? '' },
    discussions: { category: c.discussions?.category ?? 'Storyboard Comments' },
    basePath: options.basePath ?? '/',
  }
}
```

## Dependencies

This file has no significant module imports beyond platform globals such as `fetch`, `localStorage`, or the test runner.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports config helpers.
- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Reads repository and category settings.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Uses repository info for permission probes.
- [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md) — Checks whether comments are enabled.
- `packages/storyboard/src/core/comments/ui/mount.js` — Bootstraps comments runtime only when enabled.
- `packages/storyboard/src/core/comments/ui/AuthModal.jsx` — Shows repository context in auth UX.
- [`packages/storyboard/src/core/comments/config.test.js`](./config.test.js.md) — Covers normalization rules.

## Notes

The file mirrors other storyboard core singleton initializers: callers inject parsed config at startup instead of importing JSON directly.
