# Plan: Turn Storyboard into an Installable npm Package

## Vision

Turn the storyboard system into a set of npm packages that can be installed into any Vite project, providing a complete prototyping framework. Users install a **core** + **framework** + **design system** combination. Each layer is replaceable independently.

### What the user experience looks like

```bash
# Create a new storyboard project
npx create-storyboard my-prototype

# Or add to an existing Vite project — pick your design system:
npm install @storyboard/core @storyboard/react @storyboard/primer
# or
npm install @storyboard/core @storyboard/react @storyboard/reshaped
```

The scaffold produces:

```
my-prototype/
├── src/
│   ├── pages/          ← user writes these
│   ├── components/     ← user writes these
│   ├── templates/      ← user writes these
│   └── data/           ← user writes these (*.scene.json, *.object.json, *.record.json)
├── vite.config.js      ← imports storyboard plugin from @storyboard/react
├── package.json
└── node_modules/
    └── @storyboard/
        ├── core/         ← framework-agnostic data layer
        ├── react/        ← React hooks, context, Vite plugin (framework binding)
        └── primer/       ← design system + storyboard form wrappers (or reshaped/)
```

### Package dependency graph

```
@storyboard/primer          @storyboard/reshaped
    │                            │
    └──── both depend on ────────┘
                │
        @storyboard/react
                │
        @storyboard/core
```

Users always install all three layers, but the design system layer is a choice:
- `@storyboard/primer` — Primer React + theme provider + storyboard form wrappers
- `@storyboard/reshaped` — Reshaped + theme provider + storyboard form wrappers
- Or bring your own — just import hooks from `@storyboard/react` directly

The framework and core layers stay the same regardless of design system choice.

---

## Workspace Structure

```
storyboard/                    ← git repo root
├── packages/
│   ├── core/                  ← @storyboard/core
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── dotPath.js
│   │       ├── loader.js
│   │       ├── session.js
│   │       └── hashSubscribe.js
│   ├── react/                 ← @storyboard/react
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── StoryboardContext.js
│   │       ├── context.jsx
│   │       ├── hashPreserver.js
│   │       ├── context/
│   │       │   └── FormContext.js
│   │       ├── hooks/
│   │       │   ├── useSceneData.js
│   │       │   ├── useOverride.js
│   │       │   ├── useScene.js
│   │       │   ├── useRecord.js
│   │       │   ├── useRecordOverride.js
│   │       │   └── useSession.js
│   │       └── vite/
│   │           └── data-plugin.js
│   ├── primer/                ← @storyboard/primer
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── TextInput.jsx
│   │       ├── Select.jsx
│   │       ├── Checkbox.jsx
│   │       ├── Textarea.jsx
│   │       ├── StoryboardForm.jsx
│   │       ├── DevTools/
│   │       ├── SceneDebug.jsx
│   │       └── SceneDataDemo.jsx
│   └── reshaped/              ← @storyboard/reshaped
│       ├── package.json
│       └── src/
│           ├── index.js       ← barrel: re-exports reshaped + storyboard wrappers
│           ├── TextInput.jsx  ← Reshaped TextInput + useOverride integration
│           ├── Select.jsx
│           ├── Checkbox.jsx
│           ├── Textarea.jsx
│           └── StoryboardForm.jsx
├── src/                       ← prototype app (consumes the packages)
├── package.json               ← workspace root: { "workspaces": ["packages/*"] }
└── vite.config.js
```

### Root `package.json` addition

```json
{
  "workspaces": ["packages/*"]
}
```

That's it. `npm install` at the root symlinks all four packages into `node_modules/@storyboard/` so imports resolve. No Lerna, no Turborepo.

---

## Current State

The storyboard system already lives outside `src/` at the repo root:

```
storyboard/
├── core/          ← Pure JS. Zero npm deps. Uses only browser APIs.
├── internals/     ← React hooks, context, Primer components.
│                    Deps: react, react-router-dom, @primer/react, @primer/octicons-react
├── vite/          ← data-plugin.js. Deps: node:fs, node:path, glob, jsonc-parser
└── index.js       ← Barrel re-exporting from core + internals
```

Reshaped is already used in several pages (`Dashboard.jsx`, `Signup.jsx`, `issues/`) but imported directly from `reshaped` — no storyboard wrappers exist for it yet.

### What goes where in the four-package split

| Current location | Target package | Rationale |
|-----------------|----------------|-----------|
| `core/dotPath.js` | `@storyboard/core` | Pure JS utility |
| `core/loader.js` | `@storyboard/core` | Pure JS data loading |
| `core/session.js` | `@storyboard/core` | Pure JS hash/URL state |
| `core/hashSubscribe.js` | `@storyboard/core` | Pure JS event subscription |
| `core/index.js` | `@storyboard/core` | Barrel export |
| `internals/StoryboardContext.js` | `@storyboard/react` | React `createContext` |
| `internals/context.jsx` | `@storyboard/react` | React provider (remove `@primer/react` `Text` dep) |
| `internals/hooks/*.js` | `@storyboard/react` | React hooks (no Primer deps) |
| `internals/hashPreserver.js` | `@storyboard/react` | React Router integration |
| `internals/context/FormContext.js` | `@storyboard/react` | React form context |
| `vite/data-plugin.js` | `@storyboard/react` | Vite plugin (framework-coupled) |
| `internals/components/TextInput.jsx` | `@storyboard/primer` | Primer form wrapper |
| `internals/components/Select.jsx` | `@storyboard/primer` | Primer form wrapper |
| `internals/components/Checkbox.jsx` | `@storyboard/primer` | Primer form wrapper |
| `internals/components/Textarea.jsx` | `@storyboard/primer` | Primer form wrapper |
| `internals/components/StoryboardForm.jsx` | `@storyboard/primer` | Primer-coupled form |
| `internals/components/DevTools/` | `@storyboard/primer` | Primer-coupled dev UI |
| `internals/components/SceneDebug.jsx` | `@storyboard/primer` | Primer-coupled debug UI |
| `internals/components/SceneDataDemo.jsx` | `@storyboard/primer` | Primer-coupled demo |
| *(new)* | `@storyboard/reshaped` | Reshaped equivalents — written from scratch |

### Dependency Analysis

| Layer | npm Dependencies | Browser APIs |
|-------|-----------------|--------------|
| `core/` | **None** | `window.location`, `URLSearchParams`, `structuredClone`, `addEventListener` |
| `internals/hooks/`, `context.jsx`, `hashPreserver.js` | `react`, `react-router-dom` | `virtual:storyboard-data-index` (Vite) |
| `internals/components/` | `react`, `@primer/react`, `@primer/octicons-react` | None |
| `vite/` | `glob`, `jsonc-parser` | None (Node.js only) |

Note: `context.jsx` currently imports `Text` from `@primer/react` for loading/error states. This must be replaced with plain JSX (`<span>`) to keep `@storyboard/react` Primer-free.

---

## Package Architecture

### `@storyboard/core` — Framework-agnostic data layer

- Contains: `core/` (dotPath, loader, session, hashSubscribe)
- Zero runtime dependencies
- Can be used by React, Vue, Svelte, Alpine, vanilla JS
- Entry point: `@storyboard/core`

```json
{
  "name": "@storyboard/core",
  "type": "module",
  "exports": { ".": "./src/index.js" }
}
```

### `@storyboard/react` — React framework binding + Vite plugin

- Contains: hooks, context/provider, hash preserver, FormContext, Vite data plugin
- Depends on: `@storyboard/core`
- Peer dependencies: `react`, `react-router-dom`, `vite`
- **No design-system dependency** — pure React + storyboard core
- Entry points:
  - `@storyboard/react` — hooks, context, provider
  - `@storyboard/react/vite` — Vite data plugin
  - `@storyboard/react/hash-preserver` — React Router hash preservation

```json
{
  "name": "@storyboard/react",
  "type": "module",
  "dependencies": { "@storyboard/core": "*" },
  "peerDependencies": { "react": ">=18", "react-router-dom": ">=6", "vite": ">=5" },
  "exports": {
    ".": "./src/index.js",
    "./vite": "./src/vite/data-plugin.js",
    "./hash-preserver": "./src/hashPreserver.js"
  }
}
```

### `@storyboard/primer` — Primer design system package

- Contains: Primer React as a dependency, storyboard-aware form components (TextInput, Select, Checkbox, Textarea), StoryboardForm, DevTools, SceneDebug, SceneDataDemo
- Re-exports `@primer/react` so users import the design system from here
- Depends on: `@storyboard/react`
- Dependencies: `@primer/react`, `@primer/octicons-react`
- Entry point: `@storyboard/primer`

```json
{
  "name": "@storyboard/primer",
  "type": "module",
  "dependencies": {
    "@storyboard/react": "*",
    "@primer/react": "^37.0.0",
    "@primer/octicons-react": "^19.0.0"
  },
  "exports": { ".": "./src/index.js" }
}
```

### `@storyboard/reshaped` — Reshaped design system package

- Contains: Reshaped as a dependency, storyboard-aware form wrappers mirroring the Primer ones
- Re-exports `reshaped` so users import the design system from here
- Depends on: `@storyboard/react`
- Dependencies: `reshaped`
- Entry point: `@storyboard/reshaped`
- Written from scratch — no existing wrappers to migrate

```json
{
  "name": "@storyboard/reshaped",
  "type": "module",
  "dependencies": {
    "@storyboard/react": "*",
    "reshaped": "^3.0.0"
  },
  "exports": { ".": "./src/index.js" }
}
```

### Design system package contract

Every `@storyboard/<design-system>` package follows the same contract:

| Export | Purpose |
|--------|---------|
| `TextInput` | Text input wired to `useOverride` + `FormContext` |
| `Select` | Select input wired to `useOverride` + `FormContext` |
| `Checkbox` | Checkbox wired to `useOverride` + `FormContext` |
| `Textarea` | Textarea wired to `useOverride` + `FormContext` |
| `StoryboardForm` | Form wrapper that batches overrides on submit |
| `DevTools` | Scene/session inspector panel |

This contract means pages can swap design systems by changing one import path. The hook integration pattern is identical — only the rendered JSX differs.

### Import examples

```js
// vite.config.js
import { storyboardData } from '@storyboard/react/vite'

// Pages using Primer
import { useSceneData, useOverride } from '@storyboard/react'
import { TextInput, DevTools } from '@storyboard/primer'

// Pages using Reshaped
import { useSceneData, useOverride } from '@storyboard/react'
import { TextInput, DevTools } from '@storyboard/reshaped'
```

### Why this split?

1. **`@storyboard/react` stays design-system-agnostic.** No Primer or Reshaped peer dep. Can be used with any UI library.
2. **Each design system package IS the design system.** `@storyboard/primer` bundles Primer + storyboard wrappers. `@storyboard/reshaped` bundles Reshaped + its wrappers. Users pick one.
3. **Clean dependency direction.** Design system depends on framework, framework depends on core. No circular deps, no optional peer dep complexity.
4. **Hooks have zero design-system coupling today.** The codebase already has this boundary — hooks use only React, components use Primer. The split codifies the existing architecture.

### Why keep Vite plugin in `@storyboard/react`?

The Vite plugin is tightly coupled to the React provider — it generates the virtual module that calls `core.init()`, and `context.jsx` imports it. Keeping them together is simpler. If a Vue renderer needs the same Vite plugin, it can depend on the same one or we can extract it then.

---

## Todos

### Phase 1: Workspace + Package Setup

1. **setup-workspace** — Add `"workspaces": ["packages/*"]` to the root `package.json`. Create `packages/core/`, `packages/react/`, `packages/primer/`, and `packages/reshaped/` directories, each with their own `package.json`.

2. **move-core-to-package** — Move `storyboard/core/` → `packages/core/src/`. Create `packages/core/package.json` with `name: "@storyboard/core"`, `type: "module"`, `exports` field pointing to the barrel. No dependencies.

3. **move-react-to-package** — Move framework-layer files to `packages/react/src/`:
   - `internals/StoryboardContext.js`
   - `internals/context.jsx` (replace `@primer/react` `Text` import with plain `<span>`)
   - `internals/hooks/` (all hook files)
   - `internals/hashPreserver.js`
   - `internals/context/FormContext.js`
   - `vite/data-plugin.js`
   
   Create `packages/react/package.json` with dependency on `@storyboard/core`, peer deps on `react`, `react-router-dom`, `vite`. Set up `exports` for `@storyboard/react`, `@storyboard/react/vite`, `@storyboard/react/hash-preserver`.

4. **move-primer-to-package** — Move `internals/components/` → `packages/primer/src/`. Create `packages/primer/package.json` with `name: "@storyboard/primer"`, dependency on `@storyboard/react`, and dependencies on `@primer/react`, `@primer/octicons-react`. Update component imports to reference `@storyboard/react` for hooks and context. Re-export `@primer/react` from the barrel.

5. **create-reshaped-package** — Create `packages/reshaped/` with storyboard form wrappers for Reshaped. Write `TextInput`, `Select`, `Checkbox`, `Textarea`, and `StoryboardForm` components that mirror the Primer wrappers but use Reshaped components. Wire them to `useOverride` and `FormContext` from `@storyboard/react`. Re-export `reshaped` from the barrel.

### Phase 2: Import Path Migration

6. **update-internal-imports** — Update all imports within `packages/react/` to use `@storyboard/core` instead of relative `../../core/` paths.

7. **update-primer-imports** — Update all imports within `packages/primer/` to use `@storyboard/react` for hooks (e.g., `useOverride`) and context (`FormContext`), instead of relative paths.

8. **update-consumer-imports** — Update all `src/` imports:
   - Hooks/context → `@storyboard/react`
   - Primer components → `@storyboard/primer`
   - `vite.config.js` → `@storyboard/react/vite`
   - Pages using Reshaped directly → `@storyboard/reshaped` (for wrapped form components)

9. **remove-old-storyboard-dir** — Delete the root `storyboard/` directory once everything is migrated to `packages/`.

### Phase 3: Verify

10. **verify-workspace** — Run `npm install` at root to link workspaces. Verify `npm run build` and `npm run dev` still work. All imports resolve via workspace symlinks. Both Primer and Reshaped pages render correctly.

### Phase 4: Scaffold CLI (Future)

11. **create-scaffold** — Build `create-storyboard` CLI that scaffolds a new project:
    - `npx create-storyboard my-app`
    - Prompts for design system choice (Primer or Reshaped)
    - Creates directory, `package.json`, `vite.config.js`, `src/pages/index.jsx`, `src/data/default.scene.json`
    - Installs the chosen stack (e.g., core + react + primer)

12. **scaffold-templates** — Create starter templates:
    - `primer` — Primer React + generouted (current setup)
    - `reshaped` — Reshaped + generouted
    - `minimal` — Bare React, no design system (core + react only)
    - Future: `vue`, `alpine`, `svelte`

### Phase 5: Documentation

13. **package-readme** — Write README for each package:
    - `@storyboard/core`: API reference for `init()`, `loadScene()`, session utils, hash subscription
    - `@storyboard/react`: Quick start, hooks reference, Vite plugin setup, provider config
    - `@storyboard/primer`: Component catalog, Primer theme setup
    - `@storyboard/reshaped`: Component catalog, Reshaped theme setup

14. **design-system-guide** — Document how to create a new `@storyboard/<design-system>` package: the component contract, required exports, how to wire into `useOverride` + `FormContext`.

15. **migration-guide** — Document how to migrate an existing storyboard project from the single-directory layout to the workspace layout.

---

## Design Decisions

### 1. Design system decoupling (Decided: Separate packages per design system)

Each design system gets its own package (`@storyboard/primer`, `@storyboard/reshaped`, etc.). The package owns:
1. **The design system dependency** — bundles or re-exports the chosen library
2. **Theme/provider setup** — any design-system-specific theme provider or configuration
3. **Storyboard form wrappers** — components that integrate the design system's inputs with storyboard's override hooks
4. **Dev tools UI** — DevTools, SceneDebug, etc., styled with the design system

`@storyboard/react` is completely design-system-free. `context.jsx`'s `Text` import from `@primer/react` gets replaced with a plain `<span>`.

### 2. Workspace manager (Decided: npm workspaces)

npm workspaces — zero additional tooling, works with the existing `package-lock.json`. Just `"workspaces": ["packages/*"]` in root `package.json`. No Lerna, no Turborepo, no pnpm migration.

### 3. Package scope

- `@storyboard/core` + `@storyboard/react` + `@storyboard/primer` + `@storyboard/reshaped` — Clear, professional, but requires npm org.
- `storyboard-core` + `storyboard-react` + `storyboard-primer` + `storyboard-reshaped` — No org needed, but less clean.

**Recommendation: Decide based on npm name availability and whether you want to claim an org.**

### 4. Data file location (Decided: Keep as-is)

Data files can live anywhere in the repo. The Vite plugin already scans the whole project. Opinionated directory structure can be a scaffold default without being enforced.

### 5. generouted coupling (Decided: Keep as user-land)

generouted is a scaffold choice, not a framework requirement. `@storyboard/react` doesn't depend on it.

### 6. Build step (Decided: No build for now)

Packages export raw ESM source. Vite handles transpilation during dev and build. No `tsup`, no `unbuild`. If packages are ever published to npm for use outside Vite, add a build step then.

### 7. Reshaped wrapper scope

`@storyboard/reshaped` starts with the same component contract as `@storyboard/primer`: TextInput, Select, Checkbox, Textarea, StoryboardForm. DevTools and SceneDebug can be added later — they're useful but not required for the initial package to be functional. Pages currently importing Reshaped directly (Dashboard, Signup, issues/) continue to work — the wrappers are specifically for storyboard-integrated form components.
