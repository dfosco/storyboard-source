# `packages/storyboard/src/core/vite/docs-handler.js`
<!--
source: packages/storyboard/src/core/vite/docs-handler.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Express-style middleware factory for the `/_storyboard/docs/` API segment. Serves the project README, individual source files, a tree of all component files, and the GitHub repository identity. Used by the in-app docs viewer to let users browse prototype source code without leaving the browser.

## Composition

```js
// Routes (all under /_storyboard/docs/ prefix, stripped before reaching handler):
// GET /readme          — reads README.md from project root (tries 3 filename casings)
// GET /source?path=... — reads a single source file (restricted to src/ subtree)
// GET /files           — tree of .jsx/.tsx/.js/.ts files in src/prototypes/
// GET /repo            — repository owner/name (git remote first, then storyboard.config.json)

export async function collectFiles(dir, rootDir) { /* recursive async readdir */ }

export function docsHandler({ root, sendJson }) {
  return async (req, res, { path: routePath, method }) => { ... }
}
```

Security: The `/source` endpoint validates that the resolved path stays within `root` (no path traversal) and is prefixed with `src/` (no access to `.storyboard/`, secrets, or build artifacts).

## Dependencies

- `node:fs`
- `node:path`
- `node:child_process` — `execSync` for git remote detection

## Dependents

- [`packages/storyboard/src/core/vite/server-plugin.js`](./server-plugin.js.md) — imports `docsHandler` and `collectFiles`, mounts at `/_storyboard/docs/`

## Notes

- `README_CANDIDATES = ['README.md', 'readme.md', 'Readme.md']` — tries each in order, returns first match.
- Repository detection falls back to `storyboard.config.json`'s `repository.owner`/`repository.name` when git is unavailable (e.g. CI environments with shallow clones or no remote configured).
