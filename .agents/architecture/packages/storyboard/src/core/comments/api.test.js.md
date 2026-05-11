# `packages/storyboard/src/core/comments/api.test.js`

<!--
source: packages/storyboard/src/core/comments/api.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This test file verifies the behavior of the public comments API module against mocked GraphQL responses. It covers the translation layer between raw GitHub responses and the richer objects expected by the UI.

## Composition

The suite mocks [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md), seeds config and auth state, then checks fetch, create, reply, resolve, move, and reaction flows.

```js
vi.mock('./graphql.js', () => ({
  graphql: vi.fn(),
}))

it('parses comments with metadata', async () => {
  graphql.mockResolvedValue({
    search: { nodes: [{ comments: { nodes: [{ body: '<!-- sb-meta {"x":10,"y":20} -->\nHello', replies: { nodes: [] }, reactionGroups: [] }] } }] },
  })
  const result = await fetchRouteDiscussion('/Overview')
  expect(result.comments[0].meta).toEqual({ x: 10, y: 20 })
})
```

## Dependencies

- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Provides the functions under test.
- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Initializes repository and discussion settings.
- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Seeds and clears auth state for authenticated requests.
- [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md) — Mocked transport dependency.

## Dependents

No direct import dependents were found; this file is consumed by the test runner rather than other source modules.

## Notes

No runtime dependents; Vitest executes this file as coverage for [`packages/storyboard/src/core/comments/api.js`](./api.js.md).
