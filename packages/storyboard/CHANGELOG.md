# @dfosco/storyboard

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
