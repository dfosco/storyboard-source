# `packages/storyboard/src/core/comments/config.test.js`

<!--
source: packages/storyboard/src/core/comments/config.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file tests normalization and enablement rules for comments config. It prevents subtle startup regressions by checking defaults, null handling, and incomplete repository configuration.

## Composition

The suite exercises [`packages/storyboard/src/core/comments/config.js`](./config.js.md) directly and treats `isCommentsEnabled()` as the public gate the rest of the comments system relies on.

```js
it('initializes config from valid rawConfig', () => {
  initCommentsConfig({
    repository: { owner: 'dfosco', name: 'storyboard' },
    comments: { discussions: { category: 'Comments' } },
  })
  expect(getCommentsConfig()).toEqual({
    repo: { owner: 'dfosco', name: 'storyboard' },
    discussions: { category: 'Comments' },
    basePath: '/',
  })
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Provides the config functions under test.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; this suite guards [`packages/storyboard/src/core/comments/config.js`](./config.js.md).
