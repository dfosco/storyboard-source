# `packages/storyboard/src/core/comments/graphql.test.js`

<!--
source: packages/storyboard/src/core/comments/graphql.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This suite verifies the GraphQL transport wrapper used by the comments subsystem. It ensures authentication, request payloads, and GraphQL error translation stay stable.

## Composition

Tests seed tokens through [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md), stub `fetch`, and assert the request contract of [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md).

```js
it('passes variables in request body', async () => {
  setToken('ghp_test')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ data: {} }) }))
  await graphql('mutation ($id: ID!) { delete(id: $id) }', { id: '123' })
  const body = JSON.parse(fetch.mock.calls[0][1].body)
  expect(body.variables).toEqual({ id: '123' })
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md) — Provides the transport under test.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Supplies token state.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; this file is the regression suite for [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md).
