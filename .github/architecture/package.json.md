# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Defines the Storyboard project's identity, scripts, and dependency tree. This is a private ESM (`"type": "module"`) monorepo using **npm workspaces** (`"workspaces": ["packages/*"]`), built with Vite and React 19. The workspace packages are [`@dfosco/storyboard-core`](./packages/core/package.json.md) and [`@dfosco/storyboard-react`](./packages/react/package.json.md). The npm scripts are the primary developer commands.

The dependency set reveals the project's core pillars: **Primer React** (`@primer/react`, `@primer/primitives`, `@primer/octicons-react`) for the default UI, **Reshaped** (`reshaped`) as an additional design system used per-page, **Generouted** for file-based routing with lazy loading, **styled-components** for Primer's CSS-in-JS layer, and **jsonc-parser** for loading data files with comment support.

## Composition

```json
"workspaces": [
    "packages/*"
],
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "changeset": "changeset",
    "version": "changeset version",
    "tag": "changeset tag"
}
```

Key runtime dependencies:

| Package | Purpose |
|---------|---------|
| `react@^19.2`, `react-dom@^19.2` | React runtime |
| `react-is@^19.2` | React type checking (peer dep for styled-components) |
| `@primer/react@^38` | Primer UI component library |
| `@primer/primitives@^11` | Design tokens (CSS custom properties) |
| `@primer/octicons-react@^19` | Icon library |
| `@generouted/react-router@^1.19` | File-based routing with lazy loading |
| `react-router-dom@^7.12` | React Router DOM |
| `jsonc-parser@^3.3` | JSON with comments parser (for scene data) |
| `reshaped@^3.9` | Reshaped design system (loaded per-page, not global) |
| `styled-components@^6` | CSS-in-JS (required by Primer React) |
| `web-vitals@^5` | Performance metrics |

Key dev dependencies: `vite@^7.3`, `@vitejs/plugin-react@^5`, `eslint@^9`, `postcss-preset-env@^10`, `glob@^13`, `@github/browserslist-config`, `@changesets/cli@^2`.

## Dependencies

This file is the root dependency manifest — all other files depend on the packages declared here.

## Dependents

Consumed by `npm install`, the Vite CLI (see [`vite.config.js`](./vite.config.js.md)), and all import statements throughout the codebase.
