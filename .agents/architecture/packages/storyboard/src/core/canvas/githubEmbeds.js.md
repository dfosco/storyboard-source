# `packages/storyboard/src/core/canvas/githubEmbeds.js`

<!--
source: packages/storyboard/src/core/canvas/githubEmbeds.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/githubEmbeds.js`](./githubEmbeds.js.md) is the GitHub metadata adapter behind canvas URL embeds. It validates GitHub issue, pull request, discussion, and comment URLs, calls the local `gh` CLI, and normalizes the response into a small snapshot object the canvas server can attach to widgets.

## Composition

The file defines strict parsers and a typed error class:

```js
export class GitHubEmbedError extends Error {
  constructor(code, message, status = 500) {
    super(message)
    this.name = 'GitHubEmbedError'
    this.code = code
    this.status = status
  }
}
```

All GitHub access goes through `gh` wrappers with JSON parsing and timeout control:

```js
function runGh(args) {
  return execFileSync('gh', args, {
    encoding: 'utf-8',
    timeout: GH_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}
```

Builder helpers (`buildPullRequestSnapshot`, `buildIssueSnapshot`, `buildDiscussionSnapshot`, comment variants) normalize GitHub’s different REST and GraphQL shapes into one embed contract.

## Dependencies

- Node `child_process.execFileSync` to invoke `gh`.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js`
- `packages/storyboard/src/core/canvas/githubEmbeds.test.js`

## Notes

Errors are sanitized before surfacing so `gh` tokens or raw stderr do not leak into API responses. The module prefers friendly, status-aware failures (`auth required`, `not found`, `rate limited`) over passing through GitHub CLI noise.
