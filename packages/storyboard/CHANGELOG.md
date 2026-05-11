# @dfosco/storyboard

## 0.5.0-alpha.22

### Patch Changes

-   fix(build): include dist/runtime/ in published tarball

    alpha.21 was published without `dist/runtime/`, so consumers hit
    `Cannot find module '.../dist/runtime/client/index.js'` as soon as the
    CLI tried to talk to the runtime daemon. `prepublishOnly` now also
    runs `build:runtime`.

## 0.5.0-alpha.21

### Minor Changes

-   Reliability fixes for canvas/story creation and proxy startup

    -   Fix canvas creation navigating to malformed `/branch--<x>src/canvas` URLs (artifact route now returns explicit `route` field; CreateDialog hardened)
    -   Eliminate post-creation 404 race for canvases and stories — server synchronously rebuilds the data index before responding
    -   Fix `sb proxy start` failing with garbled "subject does not qualify for certificate" error (Caddy stdin + stdio bugs)
    -   Fix `sb run` printing a deprecation warning from the legacy `generateCaddyfile()` stub
    -   Fix agent terminals failing with `command not found: storyboard` when `.zshrc` resets PATH — welcome command now uses absolute CLI path
    -   Surface 'agent done' status with a new collab-bar (matches canvas-toolbar visual language)
    -   Persist agent status at canvas level + accept widget type 'agent'
    -   Snap dropped connectors inside widget bounds to nearest anchor
    -   CreateDialog uses Primer's experimental Dialog with proper inner-content scrolling
    -   Hide Flow / Object / Record / Page from the command palette's create section
    -   Markdown editing works in split-screen secondary panes (caret preserved)

## 0.5.0-alpha.20

### Minor Changes

-   Runtime CLI integration, unified create flows, and markdown polish

    -   Internalize `@dfosco/storyboard-runtime` into `@dfosco/storyboard` and wire the CLI through it
    -   `sb dev` now inherits `devDomain` from the repo root config
    -   Route Add-widget flows in the canvas menu and CreateDialog through the unified `ArtifactForm`
    -   Connector waypoints data layer and routing module (Part B)
    -   Fix expanded markdown pane theme and edit-mode scroll

-   [`dcb84d8`](https://github.com/dfosco/storyboard/commit/dcb84d814429dfdcac8887efe46e5f008658ff5e) Thanks [@dfosco](https://github.com/dfosco)! - Browser-side guards for the cross-repo branch-mixing bug class:

    -   **`hashPreserver`** now passes through clicks targeting a different
        `/branch--<x>/` than the current base. Lets the browser do a full
        navigation through the proxy instead of feeding a foreign path into
        the basename-aware router (which would produce
        `/branch--A/branch--B/...`).
    -   **`localStorage` keys** are now namespaced as
        `storyboard:${devDomain}:${branch}:` derived from `window.location.hostname`
        and `import.meta.env.BASE_URL`. Two repos sharing `storyboard.localhost`
        (or one repo with multiple branch tabs) can no longer leak history
        snapshots, hide-mode state, or pending-navigation tokens across apps.
    -   A one-shot migration on first import drops legacy un-namespaced
        `storyboard:*` keys to prevent stale state from being restored after
        upgrade.
    -   `STORAGE_PREFIX` is now exported for tooling that needs to introspect
        the active namespace.

-   [`dcb84d8`](https://github.com/dfosco/storyboard/commit/dcb84d814429dfdcac8887efe46e5f008658ff5e) Thanks [@dfosco](https://github.com/dfosco)! - Initial release of the Storyboard Runtime — a single-machine daemon that
    owns the proxy and dev-server lifecycle so cross-repo races (the
    `/branch--A/branch--B/...` bug class) become structurally impossible.

    The runtime is the **only** process that:

    -   Writes to the Caddy admin API (`http://localhost:2019`).
    -   Spawns / kills Vite dev-server processes.
    -   Allocates ports, leases, and Caddy routes.

    CLI commands become thin clients that _acquire_ resources from the runtime;
    they never spawn processes themselves.

    Includes:

    -   HTTP API on `127.0.0.1:4321` with zod-validated requests/responses
        (`/devserver/{acquire,release,renew,list}`, `/proxy/{state,upsert,remove}`,
        `/pool/status`, `/health`).
    -   Singleton enforcement via `~/.storyboard/runtime.lock` (O_EXCL +
        stale-PID reclaim).
    -   `ProxyController` — sole writer to Caddy admin, serialized writes.
    -   `DevServerOrchestrator` — explicit FSM (idle→spawning→ready→draining→stopped),
        per-slot mutex, slot-CWD conflict refusal, lease enforcement.
    -   `HotPool` — pre-allocated TCP ports for instant `acquire` (env-tunable
        via `STORYBOARD_RUNTIME_WARM_PORTS` / `STORYBOARD_RUNTIME_POOL_CAP`).
    -   Auto-injected Vite plugin (`vite-config-wrapper`) that hardens
        `base-redirect` against cross-branch URL concatenation and namespaces
        `server.hmr.path` so HMR rides the branch route instead of the catch-all.
    -   Refuses the legacy default `devDomain "storyboard"` unless explicitly
        opted in.

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
