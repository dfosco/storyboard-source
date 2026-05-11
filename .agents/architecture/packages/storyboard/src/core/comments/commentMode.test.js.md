# `packages/storyboard/src/core/comments/commentMode.test.js`

<!--
source: packages/storyboard/src/core/comments/commentMode.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This suite validates the small state machine in the comment mode module. It confirms that config and authentication gates are enforced before comment placement can be enabled.

## Composition

Tests reset the singleton state between cases, then check direct setters, toggling rules, and subscription callbacks for [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md).

```js
it('toggleCommentMode activates when enabled and authenticated', () => {
  initCommentsConfig({
    comments: { discussions: { category: 'Test' } },
    repository: { owner: 'o', name: 'r' },
  })
  setToken('ghp_test')
  const result = toggleCommentMode()
  expect(result).toBe(true)
  expect(isCommentModeActive()).toBe(true)
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md) — Provides the state machine under test.
- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Supplies enablement state.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Supplies authentication state.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; this is the regression suite for [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md).
