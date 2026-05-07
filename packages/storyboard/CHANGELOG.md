# @dfosco/storyboard

## 0.5.0-alpha.17

### Minor Changes

-   Fixes broken widget resize, adds a "See deployed branch" command palette entry, and ensures all top-level storyboard.config.json fields reach the runtime.

    -   Fix widget resize being completely non-functional (zoom scale was NaN, dropped by the NaN guard).
    -   Add "See deployed branch" command palette entry that opens the current page on the configured prodDomain over HTTPS in a new tab. Hidden when prodDomain is unset.
    -   prodDomain may include a base path (e.g. "dfosco.github.io/storyboard/") which is prepended to the current pathname.
    -   Forward all storyboard.config.json top-level keys (and configSchema defaults) to the runtime config — no more silent drops for new fields.

## 0.5.0-alpha.16

### Minor Changes

-   Error resilience for workspace and canvas

    -   Add route-level error boundaries so a broken prototype never crashes the workspace or other prototypes
    -   Wrap canvas and story lazy renders in error boundaries for cross-section isolation
    -   Fix NaN width/height in prototype widgets — `readProp` now rejects NaN values and falls through to schema defaults
    -   Guard `handleWidgetUpdate` against saving NaN dimensions to the JSONL

## 0.5.0-alpha.15

### Patch Changes

-   Fixes

    -   Fix `storyboard dev <branch> --no-create` when run from inside the worktree itself
    -   Improve VS Code CLI setup with `~/.local/bin` fallback when `/usr/local/bin` lacks permissions

## 0.5.0-alpha.14

### Patch Changes

-   Add sidebar visibility props to Workspace, hide "All artifacts" by default

    -   Added `showAllArtifacts`, `showPrototypes`, `showCanvases`, `showComponents` props
    -   All artifacts hidden by default
    -   Added `component` icon to Icon.jsx

## 0.5.0-alpha.13

### Patch Changes

-   Add /primer export with ThemeSync component for Primer-based projects

## 0.5.0-alpha.12

### Patch Changes

-   Smart connector anchors + reduced curve bounciness

    -   Auto-calculate optimal connector anchors in API/CLI — no manual `--start-anchor`/`--end-anchor` needed
    -   Reduce Bézier curve bounciness when widgets are close together
    -   Use minimum axis distance for scaling — prevents S-curves on vertically/horizontally aligned widgets

## 0.5.0-alpha.11

### Patch Changes

-   Fix all lint errors for CI

    -   Fix unused variable warnings in cli/run.js, publish.js, pull.js
    -   Fix `cmdk-overlay` and `cmdk-dialog` unknown property errors (use `data-` prefix)
    -   Fix "cannot access refs during render" in PrototypeEmbed.jsx
    -   Add eslint-disable comments for intentionally unused code

## 0.5.0-alpha.10

### Patch Changes

-   Enhanced setup and new `run` command

    -   Add `sb run` command (combines proxy start + dev in one)
    -   Setup now installs Git via brew (bypasses Xcode CLT)
    -   Setup now installs Copilot CLI automatically
    -   Add `--nuke` flag to output machine cleanup commands
    -   Wire unified artifact API across all creation surfaces
    -   Fix durable hub message delivery for unbound agents

## 0.5.0-alpha.3

### Patch Changes

-   Fix update:version CLI to detect unified @dfosco/storyboard package

## 0.5.0-alpha.2

### Minor Changes

-   Multi-agent messaging bus, hub system, and CLI parity

    -   Messaging bus core: presence registry, SSE subscribe, WebSocket push, JSONL storage
    -   Hub roles system with cluster manager, token manager, and delegation chains
    -   Agent alias system with leader crown persistence and broadcast auto-propagation
    -   All server API endpoints now have matching CLI commands
    -   Hot pool zombie cleanup, terminal color hardening, widget duplication race fix

## 0.5.0-alpha.1

### Patch Changes

-   fix(vite): pre-bundle CJS-only deps (feather-icons, @primer/octicons, ansi-to-html) for consumer apps

## 0.5.0-alpha.0

### Major Changes

-   Unify all packages into a single `@dfosco/storyboard` package

    -   Merge `@dfosco/storyboard-core`, `@dfosco/storyboard-react`, `@dfosco/tiny-canvas`, and `@dfosco/storyboard-react-primer` into `@dfosco/storyboard`
    -   Adopt epoch semver: `0.X.Y` where `0` is epoch, `X` is major, `Y` is minor/patch
    -   Organize core source into logical subdirectories: `ui/`, `stores/`, `session/`, `data/`, `modes/`, `utils/`, `devtools/`
    -   Fix ui-runtime build externalization for self-referential package imports
