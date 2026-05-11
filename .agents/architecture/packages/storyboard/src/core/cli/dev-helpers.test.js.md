# `packages/storyboard/src/core/cli/dev-helpers.test.js`

<!--
source: packages/storyboard/src/core/cli/dev-helpers.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vitest integration tests for [`dev-helpers.js`](./dev-helpers.js.md). Runs against the actual git repository to verify real-world behavior rather than mocking git. Tests cover both happy paths and error cases (invalid cwd, non-existent branches, detached HEAD in CI).

## Composition

Three `describe` suites:

- **`hasUncommittedChanges`** — verifies return type; returns `false` for non-existent directories.
- **`localBranchExists`** — checks current branch exists; handles detached HEAD (CI) by falling back to `'main'` or `'0.5.0'`; returns `false` for fictitious branches and invalid cwd.
- **`resolveDefaultBranch`** — returns string or `null`; prefers `'main'` when it exists; returns `null` for `/tmp` (non-git directory).

## Dependencies

- `vitest`
- [`dev-helpers.js`](./dev-helpers.js.md)
- Node.js `child_process` (`execSync` to discover real repo root)

## Dependents

None — test file only.

## Notes

Because these tests exercise real git commands, they must run inside the repository. Running them in an isolated temp directory would cause all tests to fail.
