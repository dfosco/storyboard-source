# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

Defines the Storyboard project's identity, scripts, and dependency tree. This is a private ESM (`"type": "module"`) project built with Vite and React 19. The four npm scripts are the primary developer commands.

The dependency set reveals the project's core pillars: **Primer React** (`@primer/react`, `@primer/primitives`, `@primer/octicons-react`) for UI, **Generouted** for file-based routing, **styled-components** for Primer's CSS-in-JS layer, and **jsonc-parser** for loading data files with comment support.

## Composition

```json
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
}
```

Key runtime dependencies:

| Package | Purpose |
|---------|---------|
| `react@^19`, `react-dom@^19` | React runtime |
| `@primer/react@^38` | Primer UI component library |
| `@primer/primitives@^11` | Design tokens (CSS custom properties) |
| `@primer/octicons-react@^19` | Icon library |
| `@generouted/react-router@^1.19` | File-based routing |
| `jsonc-parser@^3.3` | JSON with comments parser (for scene data) |
| `styled-components@^6` | CSS-in-JS (required by Primer React) |

Key dev dependencies: `vite@^7`, `@vitejs/plugin-react@^5`, `eslint@^9`, `postcss-preset-env@^10`, `@github/browserslist-config`.

## Dependencies

This file is the root dependency manifest — all other files depend on the packages declared here.

## Dependents

Consumed by `npm install`, the Vite CLI (see [`vite.config.js`](./vite.config.js.md)), and all import statements throughout the codebase.
