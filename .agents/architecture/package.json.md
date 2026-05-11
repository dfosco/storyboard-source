# `package.json`

<!--
source: package.json
category: config
importance: high
-->

> [← Architecture Index](./architecture.index.md)

## Goal

[`package.json`](./package.json.md) is the private workspace root for this repository. It defines the app-level dependency set used by the prototype shell, exposes the top-level developer workflows, and declares the `packages/*` workspace that currently resolves to the publishable [`packages/storyboard/package.json`](./packages/storyboard/package.json.md) package.

Architecturally, this file is the coordination layer between repo-local development and package publishing: scripts here invoke Vite, Vitest, Changesets, release helpers, and package-scoped commands, while the dependency graph supplies the React, Primer, routing, terminal, and build tooling used by [`vite.config.js`](./vite.config.js.md) and [`src/index.jsx`](./src/index.jsx.md).

## Composition

The manifest establishes a single-workspace monorepo rooted in ESM:

```json
{
    "name": "storyboard",
    "private": true,
    "type": "module",
    "workspaces": [
        "packages/*"
    ],
    "version": "0.5.0"
}
```

Its scripts separate everyday app workflows from package-targeted workflows. The top-level commands are mostly thin wrappers over Storyboard CLI, Vite, Vitest, and the workspace package:

```json
"scripts": {
    "dev": "storyboard dev",
    "build": "vite build",
    "lint": "eslint . && npm run check:imports -w @dfosco/storyboard",
    "test": "vitest run",
    "build:ui": "npm run build:ui -w @dfosco/storyboard",
    "dev:ui": "npm run dev:ui -w @dfosco/storyboard",
    "release": "./scripts/release.sh",
    "setup": "./scripts/setup.sh"
}
```

The dependency list shows that the root app is a consumer of the unified `@dfosco/storyboard` package rather than hosting several split local packages. Core runtime dependencies include React 19, `react-router-dom`, `@generouted/react-router`, Primer, Radix primitives, `ghostty-web`, `node-pty`, and `ws`; dev dependencies add Vite, Vitest, ESLint, Changesets, Tailwind, and Testing Library.

Because this is the root manifest, there are no `exports`; package export surfaces live in [`packages/storyboard/package.json`](./packages/storyboard/package.json.md). The architectural job here is instead to define workspaces, scripts, and the shared dependency versions that the rest of the repo assumes.

## Dependencies

- [`packages/storyboard/package.json`](./packages/storyboard/package.json.md) — receives workspace-scoped script execution through `npm run ... -w @dfosco/storyboard`.
- `./scripts/release.sh`, `./scripts/release-resume.sh`, `./scripts/setup.sh`, and `./scripts/sync-root-version.js` — implement release, setup, and version synchronization behind the declared scripts.
- `vite`, `vitest`, `eslint`, and `@changesets/cli` — provide the repo's build, test, lint, and versioning toolchain.
- `react`, `react-dom`, `react-router-dom`, `@primer/react`, and related UI packages — supply the runtime used by [`src/index.jsx`](./src/index.jsx.md) and code built through [`vite.config.js`](./vite.config.js.md).

## Dependents

- [`vite.config.js`](./vite.config.js.md) is executed by the `dev`, `dev:vite`, `build`, and `preview` scripts defined here.
- [`packages/storyboard/package.json`](./packages/storyboard/package.json.md) is driven by the `build:ui`, `dev:ui`, and `lint` workspace commands declared here.
- `scripts/sync-root-version.js` reads both this manifest and [`packages/storyboard/package.json`](./packages/storyboard/package.json.md) to keep versions aligned.
- `packages/storyboard/src/core/cli/index.js` and `packages/storyboard/src/core/cli/updateVersion.js` read project `package.json` files as part of CLI behavior.
- Tooling files such as `vitest.config.js`, `eslint.config.js`, and `package-lock.json` rely on the dependency and script declarations here.

## Notes

- `postinstall` fixes executable permissions for `node-pty`'s macOS helper binary, which is required for terminal widgets to function reliably after install.
- `prepare` sets `core.hooksPath` to `.githooks`, so cloning and installing the repo also activates repo-managed git hooks.
- The root version is intentionally synced with [`packages/storyboard/package.json`](./packages/storyboard/package.json.md) by `scripts/sync-root-version.js` instead of being managed independently.
