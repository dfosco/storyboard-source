# `packages/storyboard/src/core/comments/queries.js`

<!--
source: packages/storyboard/src/core/comments/queries.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file contains the raw GitHub GraphQL documents used by the comments subsystem. It isolates query text from request orchestration so transport and business logic can stay focused on behavior rather than string assembly.

## Composition

The exports are grouped by use case: search queries, comment detail, category lookup, mutations for create/update/delete/reactions, and a list query for browsing comment discussions.

```js
export const SEARCH_DISCUSSION_LIGHTWEIGHT = `
  query SearchDiscussionLightweight($query: String!) {
    search(query: $query, type: DISCUSSION, first: 1) {
      nodes {
        ... on Discussion {
          id
          title
          url
          comments(first: 100) {
            nodes {
              id
              body
              author { login avatarUrl }
            }
          }
        }
      }
    }
  }
`
```

## Dependencies

This file has no significant module imports beyond platform globals such as `fetch`, `localStorage`, or the test runner.

## Dependents

- [`packages/storyboard/src/core/comments/api.js`](./api.js.md) — Imports every query and mutation string from this module.

## Notes

The presence of both full and lightweight search queries is deliberate: pin rendering does not need replies or reactions, so the API can avoid overfetching.
