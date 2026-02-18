# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Root package manifest for the storyboard monorepo. Defines the workspace structure, scripts, and dependencies. The monorepo uses npm workspaces with packages in the `packages/` directory (`packages/core`, `packages/react`, etc.).

## Composition

**Scripts:**
- `dev` / `build` / `preview` — Vite commands
- `lint` — ESLint
- `test` / `test:watch` / `test:core` / `test:react` — Vitest
- `changeset` / `version` / `tag` — Changesets for versioning

**Key dependencies:**
- `@primer/react`, `@primer/octicons-react`, `@primer/primitives` — GitHub Primer design system
- `react`, `react-dom`, `react-router-dom` — React framework
- `@generouted/react-router` — File-based routing
- `reshaped` — Alternative design system
- `jsonc-parser` — JSONC support for data files

**Workspace:** `"workspaces": ["packages/*"]` — enables `@dfosco/storyboard-core` and `@dfosco/storyboard-react` as local packages.

## Dependencies

N/A — this is the root manifest.

## Dependents

All build and development tooling reads this file.
