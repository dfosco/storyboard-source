# `packages/storyboard/src/core/comments/graphql.js`

<!--
source: packages/storyboard/src/core/comments/graphql.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module is the low-level GitHub GraphQL transport for comments. It centralizes auth header injection, retry policy, and translation of HTTP or GraphQL failures into plain JavaScript errors.

## Composition

A single exported `graphql()` function reads the token from [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md), posts the query and variables, short-circuits auth failures, and retries transient errors with linear backoff.

```js
export async function graphql(query, variables = {}, options = {}) {
  const { retries = 2 } = options
  const token = getToken()
  if (!token) throw new Error('Not authenticated — no GitHub PAT found. Please sign in.')
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GITHUB_GRAPHQL_URL, { method: 'POST', headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) })
      if (res.status === 401) throw new Error('GitHub PAT is invalid or expired. Please sign in again.')
      const json = await res.json()
      if (json.errors?.length) throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`)
      return json.data
    } catch (err) { /* retry logic */ }
  }
}
```

## Dependencies

- [`packages/storyboard/src/core/comments/auth.js`](./auth.js.md) — Provides the current PAT for each request.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports the transport for advanced use.
- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Uses it for every read and write operation.
- [`packages/storyboard/src/core/comments/graphql.test.js`](./graphql.test.js.md) — Validates auth, variables, and error handling.
- [`packages/storyboard/src/core/comments/api.test.js`](./api.test.js.md) — Mocks it as the network boundary.

## Notes

Retries are intentionally skipped for auth failures so the UI can prompt for sign-in immediately.
