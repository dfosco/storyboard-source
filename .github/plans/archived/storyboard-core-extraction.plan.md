# Plan: Extract `storyboard-core` from the Storyboard App

## Problem

The storyboard system (`storyboard/`) mixes framework-agnostic data logic with React-specific rendering concerns. To support future frontends (vanilla JS + Alpine.js, Vue, Svelte), the pure-JS data layer needs to be extracted into a standalone `storyboard-core` package that any rendering framework can consume.

## Current Architecture Analysis

### What lives in `storyboard/` today

| Layer | Files | React Dependency? |
|-------|-------|-------------------|
| **Core data utilities** | `core/dotPath.js` (getByPath, setByPath, deepClone) | ❌ None |
| **Scene loader** | `core/loader.js` (loadScene, sceneExists, loadRecord, findRecord, deepMerge) | ❌ None — BUT depends on `virtual:storyboard-data-index` (Vite plugin) |
| **Session (URL hash state)** | `core/session.js` (getParam, setParam, getAllParams, removeParam) | ❌ None — uses `window.location` directly |
| **Hash subscribe** | `core/hashSubscribe.js` (subscribeToHash, getHashSnapshot) | ⚠️ Designed for `useSyncExternalStore` but the functions themselves are plain JS |
| **Hash preserver** | `core/hashPreserver.js` (installHashPreserver) | ⚠️ Coupled to React Router's `router.navigate()` API |
| **Vite data plugin** | `vite/data-plugin.js` | ❌ None — Vite-specific but not React-specific |
| **React context** | `StoryboardContext.js`, `context.jsx` | ✅ React (createContext, useState, useEffect, useParams) |
| **React hooks** | `hooks/useSceneData.js`, `useOverride.js`, `useScene.js`, `useRecord.js`, `useRecordOverride.js`, `useSession.js` | ✅ React (useContext, useMemo, useSyncExternalStore, useParams) |
| **React components** | `components/` (DevTools, StoryboardForm, TextInput, Select, Checkbox, Textarea, SceneDebug, SceneDataDemo) | ✅ React + Primer React |
| **Form context** | `context/FormContext.js` | ✅ React (createContext) |

### Key Coupling Points

1. **`loader.js` ↔ Vite plugin**: The loader imports `virtual:storyboard-data-index`, a build-time virtual module. This is the main design challenge — storyboard-core needs a way to receive data without being coupled to Vite.

2. **`hashPreserver.js` ↔ React Router**: Directly patches `router.navigate()`. This is a React Router integration, not core logic.

3. **`hashSubscribe.js`**: The functions are plain JS (addEventListener/removeEventListener), but they exist *only* to power `useSyncExternalStore`. They're still useful for any framework's reactivity system (Alpine's `$watch`, Vue's `watchEffect`, Svelte's `$effect`).

4. **`session.js`**: Pure browser API. No React dependency. Clean candidate for core.

---

## Proposed Approach

### Package Structure

```
storyboard/
├── core/                    ← `storyboard-core` (framework-agnostic, zero dependencies)
│   ├── dotPath.js           ✅ move as-is
│   ├── session.js           ✅ move as-is
│   ├── hashSubscribe.js     ✅ move as-is (useful for any reactivity system)
│   ├── loader.js            🔧 refactor: decouple from virtual module
│   └── index.js             🆕 barrel export for the core package
│
├── vite/                    ← stays as-is (Vite-specific, not React-specific)
│   └── data-plugin.js       ✅ move as-is (Vite works with Vue/Svelte too)
│
├── react/                   ← `storyboard-react` (React + React Router layer)
│   ├── StoryboardContext.js
│   ├── context.jsx          (uses react-router-dom's useParams)
│   ├── hashPreserver.js     (patches React Router's navigate)
│   ├── hooks/               (all React hooks)
│   ├── components/          (all Primer React components)
│   ├── context/             (FormContext)
│   └── index.js
│
└── index.js                 → updated barrel that re-exports from core + react
```

### What belongs where — the guiding principle

**Core** = pure JavaScript, zero npm dependencies, runs anywhere with a browser `window` object.

**Vite plugin** = build-tool layer. Vite is framework-agnostic (works with React, Vue, Svelte, vanilla), so the data plugin stays outside of `react/`. It calls `core.init()` to seed the data index.

**React layer** = everything that imports from `react`, `react-dom`, `react-router-dom`, `@primer/react`, or `@primer/octicons-react`. This includes generouted (file-based routing), React Router integration (hashPreserver, useParams in hooks), React context, React hooks, and all Primer-based components. When building a Vue or Svelte frontend, this entire layer gets replaced — including routing, which is inherently framework-specific (vue-router, SvelteKit routing, etc.).

### The Loader Decoupling Problem

The central challenge is `loader.js` importing `virtual:storyboard-data-index`. Options:

**Option A — Initialization pattern**: Core exports an `init({ scenes, objects, records })` function. The Vite plugin (or any build tool) calls it at startup to inject the data index. The loader reads from that injected state.

**Option B — Adapter/provider pattern**: Core defines a `DataProvider` interface (just a plain object with `getScene(name)`, `getObject(name)`, `getRecord(name)` methods). The Vite plugin creates a concrete provider. Core's loader functions accept a provider or use a global default.

**Option C — Keep the virtual import but abstract it**: The Vite plugin stays as the primary mechanism but loader.js gets a `setDataIndex()` escape hatch for non-Vite environments.

**Recommendation: Option A** — simplest, most predictable. One `init()` call at app startup, loader reads from module-level state. The Vite plugin auto-calls `init()` at import time.

---

## Todos

### Phase 1: Extract storyboard-core

1. **refactor-loader** — Decouple `loader.js` from `virtual:storyboard-data-index` by adding an `init({ scenes, objects, records })` + `setDataIndex()` function. Loader reads from module-level variable instead of direct import.

2. **create-core-barrel** — Create `storyboard/core/index.js` barrel exporting all core APIs: dotPath utils, session utils, hashSubscribe, loader functions, and the new `init()`.

3. **update-vite-plugin** — Update `data-plugin.js` so the generated virtual module calls `init()` from storyboard-core instead of just exporting raw data. The virtual module becomes: `import { init } from 'storyboard-core'; init({ scenes, objects, records })`.

4. **update-loader-imports** — Update `loader.js` to read from the initialized module state instead of the virtual import.

### Phase 2: Reorganize React layer

5. **move-react-specific** — Move `hashPreserver.js` into a `react/` subdirectory (it's React Router specific). Move context, hooks, and components under `react/`.

6. **update-barrel-exports** — Update `storyboard/index.js` to re-export from both `core/index.js` and `react/index.js`, preserving all existing import paths.

7. **verify-no-breakage** — Run build + lint to confirm all existing imports and functionality still work.

### Phase 3: Documentation & future-proofing

8. **update-docs** — Update AGENTS.md, README.md, and architecture docs to reflect the new core/react split.

9. **add-integration-notes** — Document how a non-React frontend would consume storyboard-core (init pattern, subscribing to hash changes, reading scene data imperatively).

---

## Decisions (Resolved)

1. **Subdirectory, not monorepo** — `storyboard-core` stays as a well-separated subdirectory within `storyboard/core/`, not a separate npm package.
2. **Init pattern (Option A)** — `init({ scenes, objects, records })` seeds module-level state. Simple, imperative, no abstraction.
3. **Everything React goes into `react/`** — hashPreserver, generouted integration, all hooks using `useParams`/`useContext`, all Primer components. When swapping to another frontend framework, the entire `react/` directory gets replaced — including routing (generouted → vue-router, SvelteKit, etc.).
4. **Vite plugin stays framework-agnostic** — Vite works with React, Vue, Svelte, and vanilla JS. The data plugin stays in `vite/` outside `react/`, calling `core.init()` to seed data.
