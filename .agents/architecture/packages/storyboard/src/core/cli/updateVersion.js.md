# `packages/storyboard/src/core/cli/updateVersion.js`

<!--
source: packages/storyboard/src/core/cli/updateVersion.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard update[:channel|:version]` — updates all `@dfosco/storyboard*` and `@dfosco/tiny-canvas` packages in `package.json` to a specific version, channel (`beta`/`alpha`), or `latest`. Syncs scaffold files via `npx storyboard-scaffold` after install, then auto-commits the version bump.

## Composition

Sequential top-level flow:

1. Parse command (`update`, `update:beta`, `update:alpha`, `update:version <ver>`, `update:<ver>`) to determine `channel` or `targetVersion`
2. Scan `dependencies` + `devDependencies` for `@dfosco/storyboard*` packages
3. Resolve actual version from registry if using a tag (`npm view <pkg>@<tag> version`)
4. `npm install <pkg1>@<ver> <pkg2>@<ver> …`
5. `npx storyboard-scaffold` to sync agent skill files
6. `git add package.json package-lock.json .github/skills scripts` + `git commit` with `[storyboard-update]` message

## Dependencies

- Node.js `child_process` (`execSync`), `fs`, `path`
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — dispatches `update`, `update:beta`, `update:alpha`, `update:version` commands here

## Notes

Auto-commit only runs if `git diff --cached --quiet` fails (i.e. there are staged changes). The commit message format `[storyboard-update] Update storyboard to <version>` is recognised by some automation pipelines.
