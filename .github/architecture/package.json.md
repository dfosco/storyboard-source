# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Defines the Storyboard project's identity, scripts, and dependency tree. This is a private ESM (`"type": "module"`) project built with Vite and React 19. The four npm scripts (`dev`, `build`, `lint`, `preview`) are the primary developer commands.

The dependency set reveals the project's core pillars: **Primer React** (`@primer/react`, `@primer/primitives`, `@primer/octicons-react`) for UI, **Generouted** for file-based routing, **styled-components** for Primer's CSS-in-JS layer, and **jsonc-parser** for loading data files with comment support. Dev dependencies cover the build toolchain (Vite, PostCSS, ESLint) and browser compatibility (`@github/browserslist-config`).

<details>
<summary>Technical details</summary>

### Composition

- **name**: `storyboard`, **version**: `0.1.0`, **private**: `true`
- **Scripts**:
  - `dev` — `vite` (dev server on port 1234)
  - `build` — `vite build` (production build)
  - `lint` — `eslint .`
  - `preview` — `vite preview`
- **Key runtime dependencies**: `react@^19`, `react-dom@^19`, `@primer/react@^38`, `@generouted/react-router@^1.19`, `jsonc-parser@^3.3`, `styled-components@^6`
- **Key dev dependencies**: `vite@^7`, `@vitejs/plugin-react@^5`, `eslint@^9`, `postcss-preset-env@^10`

### Dependencies

This file is the root dependency manifest — all other files depend on the packages declared here.

### Dependents

Consumed by `npm install`, `vite`, and all import statements throughout the codebase.

</details>
