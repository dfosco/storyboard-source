# `packages/storyboard/src/core/comments/auth.test.js`

<!--
source: packages/storyboard/src/core/comments/auth.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file tests token storage, cached-user behavior, authentication checks, and the two-step token validation flow. It locks down the user-facing error messages emitted by the comments sign-in path.

## Composition

The suite clears localStorage between tests, stubs `fetch`, and verifies both happy paths and permission failures for [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md).

```js
it('throws descriptive error when token lacks discussion access', async () => {
  initCommentsConfig({
    comments: { discussions: { category: 'Comments' } },
    repository: { owner: 'testorg', name: 'testrepo' },
  })
  globalThis.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ login: 'testuser', avatar_url: 'https://img/avatar' }), headers: { get: () => '' } })
  globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ errors: [{ message: 'Resource not accessible by personal access token' }] }) })
  await expect(validateToken('ghp_no_scope')).rejects.toThrow(/doesn't have access.*discussions/i)
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Provides the functions under test.
- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Supplies repository context for permission probes.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; this is the regression suite for [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md).
