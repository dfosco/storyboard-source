# Plan: Epoch SemVer + Package Unification

## Problem

Storyboard is currently split across 5 npm packages (`@dfosco/storyboard-core`, `@dfosco/storyboard-react`, `@dfosco/tiny-canvas`, `@dfosco/storyboard-react-primer`, `@dfosco/storyboard-react-reshaped`) all fixed-versioned at `4.2.0-beta.17`. The separation no longer reflects reality — core and react are tightly coupled, tiny-canvas is deeply entangled with the canvas system, and the design-system wrappers (primer/reshaped) are thin enough to be client-side examples.

Version numbers have lost meaning through internal iteration (4.0 → 4.1 → 4.2-beta → 4.3 branches). The goal is to adopt **epoch semantic versioning** and unify into a single published package.

## Decisions Made

| Decision | Choice |
|----------|--------|
| **Versioning scheme** | Zero-major epoch semver: `0.X.Y` where X = major, Y = minor+patch |
| **Starting version** | `0.5.0` (the unification itself is the major bump from 4→5) |
| **Epoch naming** | Codenames for eras, not encoded in version number |
| **Package name** | `@dfosco/storyboard` (new scoped package) |
| **Merge scope** | All-in-one: core + react + tiny-canvas → single package |
| **react-primer/reshaped** | Removed from monorepo; become client example repo code |
| **Migration approach** | One-shot merge |

## Architecture: Before → After

### Before
```
packages/
  core/           → @dfosco/storyboard-core    (4.2.0-beta.17)
  react/          → @dfosco/storyboard-react   (4.2.0-beta.17)
  tiny-canvas/    → @dfosco/tiny-canvas         (4.2.0-beta.17)
  react-primer/   → @dfosco/storyboard-react-primer   (4.2.0-beta.17)
  react-reshaped/ → @dfosco/storyboard-react-reshaped (4.2.0-beta.17)
  svelte-ui/      → dead package (only vitest config, no source)
```

### After
```
packages/
  storyboard/     → @dfosco/storyboard (0.5.0)
    src/
      core/       ← packages/core/src/         (framework-agnostic layer)
      internals/  ← packages/react/src/        (React-specific layer)
      canvas/     ← packages/tiny-canvas/src/  (canvas engine)
      vite/       ← merged vite plugins from core + react
    dist/         ← built assets (ui-runtime, tiny-canvas, tailwind)
    package.json
```

## Subpath Exports Migration Map

Old import → New import:

```
# Main exports
@dfosco/storyboard-core              → @dfosco/storyboard/core
@dfosco/storyboard-react             → @dfosco/storyboard
@dfosco/tiny-canvas                  → @dfosco/storyboard/canvas
@dfosco/tiny-canvas/style.css        → @dfosco/storyboard/canvas/style.css

# React subpaths
@dfosco/storyboard-react/vite               → @dfosco/storyboard/vite
@dfosco/storyboard-react/hash-preserver     → @dfosco/storyboard/hash-preserver
@dfosco/storyboard-react/canvas/CanvasPage  → @dfosco/storyboard/canvas/CanvasPage

# Core subpaths (keep similar structure)
@dfosco/storyboard-core/config              → @dfosco/storyboard/config
@dfosco/storyboard-core/canvas/materializer → @dfosco/storyboard/canvas/materializer
@dfosco/storyboard-core/canvas/collision    → @dfosco/storyboard/canvas/collision
@dfosco/storyboard-core/canvas/identity     → @dfosco/storyboard/canvas/identity
@dfosco/storyboard-core/canvas/writeGuard   → @dfosco/storyboard/canvas/writeGuard
@dfosco/storyboard-core/ui-runtime          → @dfosco/storyboard/ui-runtime
@dfosco/storyboard-core/ui-runtime/style.css → @dfosco/storyboard/ui-runtime/style.css
@dfosco/storyboard-core/comments            → @dfosco/storyboard/comments
@dfosco/storyboard-core/comments/ui/*       → @dfosco/storyboard/comments/ui/*
@dfosco/storyboard-core/modes.css           → @dfosco/storyboard/modes.css
@dfosco/storyboard-core/inspector/highlighter → @dfosco/storyboard/inspector/highlighter
@dfosco/storyboard-core/smooth-corners      → @dfosco/storyboard/smooth-corners
@dfosco/storyboard-core/worktree/*          → @dfosco/storyboard/worktree/*
@dfosco/storyboard-core/vite/server         → @dfosco/storyboard/vite/server
@dfosco/storyboard-core/styles/tailwind.css → @dfosco/storyboard/styles/tailwind.css

# Config files
@dfosco/storyboard-core/toolbar.config.json       → @dfosco/storyboard/toolbar.config.json
@dfosco/storyboard-core/widgets.config.json        → @dfosco/storyboard/widgets.config.json
@dfosco/storyboard-core/paste.config.json          → @dfosco/storyboard/paste.config.json
@dfosco/storyboard-core/commandpalette.config.json → @dfosco/storyboard/commandpalette.config.json

# Dropped (moved to client example repo)
@dfosco/storyboard-react-primer    → ❌ removed
@dfosco/storyboard-react-reshaped  → ❌ removed
```

## Implementation Phases

### Phase 1: Create unified package skeleton
- Create `packages/storyboard/` directory
- Write `package.json` with name `@dfosco/storyboard`, version `0.5.0`
- Define the full exports map pointing to the source directories
- Carry over CLI `bin` entries from core (`storyboard`, `sb`, `storyboard-scaffold`)
- Set up build scripts (carry over from core + tiny-canvas prepublish)
- Merge build pipelines: core's `ui-runtime` CSS/JS build + tiny-canvas Vite lib build + tailwind.css

### Phase 2: Move source code
- Move `packages/core/src/` → `packages/storyboard/src/core/`
- Move `packages/react/src/` → `packages/storyboard/src/internals/`
- Move `packages/tiny-canvas/src/` → `packages/storyboard/src/canvas/`
- Move config JSONs (`toolbar.config.json`, `widgets.config.json`, etc.) to `packages/storyboard/`
- Move `packages/core/dist/` build assets and build scripts
- Move `packages/tiny-canvas/` build config (vite build for the canvas lib)

### Phase 3: Rewrite internal imports
- In `src/internals/` (was react): replace all `@dfosco/storyboard-core` imports with relative paths to `../core/`
- In `src/internals/` (was react): replace all `@dfosco/tiny-canvas` imports with relative paths to `../canvas/`
- In `src/core/`: verify no cross-package imports (core should be standalone)
- In `src/canvas/`: verify no cross-package imports (canvas should be standalone or import core relatively)

### Phase 4: Update root app imports
- In root `src/`: replace all `@dfosco/storyboard-react` → `@dfosco/storyboard`
- In root `src/`: replace all `@dfosco/storyboard-core` → `@dfosco/storyboard/core` (or appropriate subpath)
- In root `src/`: replace all `@dfosco/tiny-canvas/style.css` → `@dfosco/storyboard/canvas/style.css`
- In root `src/`: replace all `@dfosco/storyboard-react-primer` → inline the components or move to local src/
- Update root `package.json` workspace config and dependencies

### Phase 5: Remove old packages
- Delete `packages/core/`, `packages/react/`, `packages/tiny-canvas/`
- Delete `packages/react-primer/`, `packages/react-reshaped/`
- Delete `packages/svelte-ui/` (dead package — only vitest config, no source)
- Archive react-primer and react-reshaped source for the client example repo (save as a patch or copy)

### Phase 6: Update tooling & config
- Update `.changeset/config.json`: single package reference, exit beta prerelease mode
- Update `scripts/release.sh`: single package version flow
- Update `scripts/sync-root-version.js`: sync from `packages/storyboard/package.json`
- Update `vite.config.js`: resolve aliases for the unified package
- Update `vitest.config.js` if needed
- Update `eslint.config.js` if needed
- Update root `package.json` workspaces field

### Phase 7: Update documentation
- Update `AGENTS.md`: new package structure, import paths, build commands
- Update `releasing.md`: new release process
- Update `README.md`
- Update `.agents/architecture/` docs
- Document epoch semver convention and codename system

### Phase 8: Verify & release
- Run `npm run lint` — fix any import resolution issues
- Run `npm run build` — verify production build works
- Run tests — verify nothing is broken
- Create changeset for `0.5.0`
- Release and publish `@dfosco/storyboard@0.5.0`
- Deprecate old npm packages:
  ```bash
  npm deprecate @dfosco/storyboard-core "Merged into @dfosco/storyboard — see migration guide"
  npm deprecate @dfosco/storyboard-react "Merged into @dfosco/storyboard"
  npm deprecate @dfosco/tiny-canvas "Merged into @dfosco/storyboard"
  npm deprecate @dfosco/storyboard-react-primer "Moved to client example repo"
  npm deprecate @dfosco/storyboard-react-reshaped "Moved to client example repo"
  ```

## Risks & Considerations

1. **Inter-package import rewriting is the riskiest step** — packages/react has ~20+ import sites from core and tiny-canvas that all need to become relative imports. Automated find-and-replace should handle most, but edge cases in dynamic imports or Vite-specific paths need manual review.

2. **Build pipeline unification** — Three separate build pipelines must merge:
   - **core's ui-runtime** (`prepublishOnly: npm run build:css && npm run build:ui`) → `dist/storyboard-ui.js`, `dist/storyboard-ui.css`, `dist/tailwind.css`
   - **tiny-canvas** (`prepublishOnly: npm run build`) → `dist/tiny-canvas.js`, `dist/tiny-canvas.css` (Vite lib mode)
   - These become a single build script in the unified package.

3. **CLI binaries** — `packages/core/package.json` declares three `bin` entries: `storyboard`, `sb`, `storyboard-scaffold`. These must move to the unified package's `package.json` and their source paths updated.

4. **Svelte legacy exports** — Core still exports `./comments/svelte`, `./svelte-plugin-ui`, and related Svelte paths. **Drop all Svelte exports during the merge** — no Svelte support going forward.

5. **Consumer-safe devtools proxy** — `devtools-consumer.js` delegates to a compiled UI bundle (`dist/storyboard-ui.js`). **Drop this pattern** — only React is supported, so consumer repos use React directly. No need for a framework-agnostic compiled bundle.

6. **Vite resolve aliases** — The root app uses workspace resolution to find packages. After merge, `@dfosco/storyboard` resolves to `packages/storyboard/`. Need to verify Vite's package exports resolution works correctly for all subpath exports.

7. **react-primer components used in root app** — The root app imports `@dfosco/storyboard-react-primer`. Those components (Primer-wrapped form elements, etc.) need to either:
   - Be inlined into the root app's local components
   - Be bundled into the main package (since storyboard already depends on Primer anyway)
   - Kept as a subpath export `@dfosco/storyboard/primer` for convenience

8. **Client repo migration** — Any external client repos consuming the old packages need a migration guide. This is lower priority since there aren't many external consumers.

9. **npm package availability** — Need to verify `@dfosco/storyboard` isn't already taken on npm.

## Open Questions

- Should react-primer components be kept as `@dfosco/storyboard/primer` subpath (since storyboard itself depends on Primer), or fully removed to the client repo?
- Should the unified package export a single main entry point that re-exports everything, or keep explicit subpath imports to encourage tree-shaking?
- Should Svelte legacy exports (`comments/svelte`, `svelte-plugin-ui`) be preserved or dropped during the merge? → **Dropped. No Svelte.**
- Should the devtools-consumer compiled bundle pattern be kept? → **Dropped. React-only.**
