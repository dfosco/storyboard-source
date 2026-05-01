# @dfosco/storyboard-core

## 4.2.6

### Patch Changes

-   Alt+Cmd+. completely hides all toolbars including the lightbulb trigger

    -   Add alt+cmd+. shortcut to completely hide all chrome (no half-opacity trigger button)
    -   Command palette shows "Completely hide toolbars" when alt is held
    -   Fix ComponentWidget stub to prevent CanvasPage crash on missing widget types

## 4.2.5

### Patch Changes

-   Lightweight isolate iframes for canvas widgets, tokens URL params, and terminal UX improvements

    -   Story and component-set widgets now use lightweight isolate iframes instead of full SPA bootstrap — significantly faster load times
    -   Removed legacy ComponentWidget; renamed ComponentSetWidget → StorySetWidget (user-facing labels unchanged)
    -   Added HMR guard to isolate iframes to prevent reload blinking
    -   Added `tokens` object support in prototype and flow JSON for default URL query params
    -   WebGL context virtualization for terminal widgets
    -   Frozen terminal overlay UX consolidation and layout fixes
    -   Hot pool: `webgl_ready_slots` config and load balancer removal
    -   Command palette: submenu tool resolution and prototype flow expansion
    -   Viewfinder respects `meta.default` flow for landing route

## 4.2.4

### Patch Changes

-   Fix scaffold sync crash on `sb update`

    -   Fixed `.gitignore` not being included in the published npm tarball, causing `sb update` to fail with ENOENT during scaffold sync

## 4.2.3

### Patch Changes

-   Configurable BranchBar color, Svelte removal, component-set sizing, scaffold updates

    -   Add configurable `devDomainColor` for BranchBar background and `devDomain` name label with ⌘ prefix
    -   Remove all Svelte code, dependencies, and references — Icon, mode stores, and mount entrypoints replaced with React equivalents
    -   Fix component-set widget sizing — cells snap to max content dimensions, widget auto-resizes to fit grid via postMessage
    -   Restyle component-set grid: edge-to-edge cells, collapsed borders, padding inside cells, swapped header/content backgrounds
    -   Make all scaffold files updateable (AGENTS.md, .gitignore, configs, workflows) so clients get latest on every version update

## 4.2.2

### Patch Changes

-   Canvas widget fixes and internal navigation improvements

    -   Fix image download (use blob URL instead of broken `<a download>`)
    -   Fix crop bar clipping — render outside widget with Primer theme-aware styling; hide connector anchors during crop
    -   Fix `<details>` panels not rendering in GitHub embed widgets — force open, style summary as interactive toggle
    -   Fix scoped story IDs (`folder/story-name`) failing to resolve in StoryWidget and ComponentSetWidget
    -   Style `@mention` links as blue pills in GitHub embeds
    -   Use `<a href>` for internal page navigation (PageSelector, Viewfinder dropdowns) — Cmd+click and right-click open in new tab

## 4.2.1

### Patch Changes

-   [`ab1db0e`](https://github.com/dfosco/storyboard/commit/ab1db0e2a85fd76630b6709995872547fc99e2d6) Thanks [@dfosco](https://github.com/dfosco)! - Fix dev server startup crash caused by orphaned debug code

    -   Fix `SyntaxError: Unexpected token ':'` on `npm run dev` caused by an incomplete devlog removal in `buildUnifiedConfig` (data-plugin.js)
    -   Fix terminal snapshots not being emitted in production builds

## 4.2.0

### Minor Changes

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`6fb27ac`](https://github.com/dfosco/storyboard/commit/6fb27ac747c541e0221f7588a0ff2a61a6306bcd) Thanks [@dfosco](https://github.com/dfosco)! - TMUX session management, terminal widget UX, interact gate system, and canvas page ordering.

    -   Terminal sessions scoped by branch/canvas with persistent registry, friendly names (color-bird), and graceful orphan handling
    -   `storyboard terminal` CLI: session browser, welcome prompt, close/open/remove subcommands
    -   Widget interact gate system: configurable "Click to interact" overlay in WidgetChrome, double-Escape to exit
    -   Terminal widget: title bar, zzz sleep animation, selection border radius, default size 800×450
    -   Canvas folder page ordering via .meta.json with drag-and-drop persistence
    -   Command palette focus fix (removed duplicate mount)
    -   Viewfinder page order fix
    -   Connector arrow endpoints (circle, arrow-in, arrow-out, none)

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`a9c8163`](https://github.com/dfosco/storyboard/commit/a9c8163bf228d5fd34e74ec8a5bc8be66433b4a7) Thanks [@dfosco](https://github.com/dfosco)! - Terminal agents: context awareness, auto-launch copilot, canvas update CLI

    -   Terminal agents with context awareness, signal bus, and action widgets
    -   Auto-launch copilot with agent instructions on new terminal sessions
    -   Canvas update CLI command and PATCH /widget API endpoint
    -   Inline full widget data in terminal config for zero-latency context
    -   Fix: prevent accidental canvas wipes from PUT /update endpoint
    -   Fix: reliable env var passing to terminal agents
    -   Several fixes for copilot launch flow (pre-type, agent flag, env vars)

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`237829b`](https://github.com/dfosco/storyboard/commit/237829b14083b14bd30c91fadb50cbda101de726) Thanks [@dfosco](https://github.com/dfosco)! - Live canvas updates from CLI/API — no more page refresh needed

    Canvas API endpoints now push real-time updates to the browser via HMR after every write. Widget adds, updates, deletes, and connector changes all propagate instantly without requiring a page refresh.

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`d6f3e02`](https://github.com/dfosco/storyboard/commit/d6f3e02e2b8e750ebae2953496d657f906742930) Thanks [@dfosco](https://github.com/dfosco)! - Terminal widget expand/collapse fixes and persistence

    -   Fix expand: always render xterm container to prevent black screen on expand/collapse
    -   Auto-focus terminal and set interactive mode on expand
    -   Persist expanded state across page refreshes (URL hash)
    -   Store terminal widget's own props in config (agents can read prettyName, etc.)
    -   Use tmux session name as stable config lookup key
    -   Refresh terminal config on every canvas mutation
    -   Persist hide-chrome setting across page reloads
    -   Improve toolbar tooltip shortcut labels
    -   Command palette fixes (resilient config loading, empty state fix)
    -   Rename surfaces: main-toolbar → command-toolbar, command-list → command-palette
    -   BranchBar: blue accent, show on main in dev
    -   Show both proxy and localhost URLs on dev server start
    -   Change private image prefix from underscore to tilde (~)
    -   Unified config store for all storyboard configuration
    -   Enable folder grouping in all viewfinder nav views
    -   Auto-discover root toolbar.config.json for client-repo tool overrides

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`bd7a9e7`](https://github.com/dfosco/storyboard/commit/bd7a9e77db104855bb59ea4e3d814988a6201fd4) Thanks [@dfosco](https://github.com/dfosco)! - Expandable widgets, split-screen, agent system, and command palette overhaul

    -   Expandable modals for markdown and GitHub embed widgets (matching prototype/figma behavior)
    -   Split-screen mode: connected widget pairs render side-by-side fullscreen with shared top bar, focus tracking, and x-coordinate ordering
    -   Agent widget system with canvas toolbar integration, add-agent menu, and config-driven visibility
    -   React Icon component supporting Primer Octicons, Feather, and Iconoir icon sources
    -   Command palette rebuilt with cmdk (React 19 compatible), with icons and improved search
    -   Terminal widget fixes: font-size scaling, non-resizable mode, viewport scroll prevention
    -   Undo/redo fix: HMR echo no longer resets the history stack

-   4.2.0 — Canvas agents, component sets, and image editing

    -   **AI agent integration** — Add Copilot, Claude, and Codex directly to canvases with persistent terminal sessions and hot-pooling for instant startup
    -   **ComponentSet widget** — Display story components in a resizable grid, flip layouts, and export compositions
    -   **Image crop & upload** — Crop and replace images directly on the canvas with a floating toolbar
    -   **Expanded pane** — Full-screen widget viewer now supports all widget types with a unified top bar
    -   **Branch deploys** — Static branch deploy support via branches.json; autosync pauses automatically on inactive branches
    -   **Canvas UX** — Categorized create menu, configurable zoom limits, improved connector hit areas, z-index stacking for dragged widgets
    -   **Config system** — Domain-specific configs (toolbar, command palette) now merge by id instead of replacing; priority order fixed so specific configs override general ones
    -   **Consumer compatibility** — Resolved singleton state splits, React externalization, and JSX runtime issues that prevented toolbars and command palettes from working in npm consumer apps

### Patch Changes

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`2897be6`](https://github.com/dfosco/storyboard/commit/2897be6616e90af00de072bf72fba53511df6bda) Thanks [@dfosco](https://github.com/dfosco)! - Fix client repo crash: make `ws` import graceful (try/catch like node-pty) and add as explicit dependency.

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`0f0021c`](https://github.com/dfosco/storyboard/commit/0f0021c1b3d0e222a76b2e7cbe269e970207c607) Thanks [@dfosco](https://github.com/dfosco)! - Add node-pty as optionalDependency so client repos get terminal widget support on `npm install`.

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`22f256b`](https://github.com/dfosco/storyboard/commit/22f256b64cea52550c4f37dd2b1aa28e0b6055e3) Thanks [@dfosco](https://github.com/dfosco)! - Fix ghostty-web import crash for consumers without the package

    -   Add @vite-ignore to dynamic import to prevent Vite pre-transform errors
    -   Catch import failures gracefully instead of crashing
    -   Declare ghostty-web as optional peerDependency

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`3ff3852`](https://github.com/dfosco/storyboard/commit/3ff3852481a157009a03818ca6c6b57ebd97655e) Thanks [@dfosco](https://github.com/dfosco)! - Fix command palette losing library-provided sections (like add-widget) when client overrides config

    -   Sections are now merged by `id` instead of replaced wholesale
    -   Client sections take priority, default sections not in client config are preserved

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`5ec5ee7`](https://github.com/dfosco/storyboard/commit/5ec5ee7b5089029a1192cdb86d0ebdd64c8435aa) Thanks [@dfosco](https://github.com/dfosco)! - Fix terminal widgets not connecting in client repos

    -   Move ghostty-web from optional peerDependency to regular dependency in @dfosco/storyboard-react
    -   Remove @vite-ignore from dynamic import so Vite resolves ghostty-web normally
    -   Terminal widgets now work out of the box without clients manually installing ghostty-web

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`3745ba2`](https://github.com/dfosco/storyboard/commit/3745ba2f340753bf569be6495dddb32f8b321c1f) Thanks [@dfosco](https://github.com/dfosco)! - Deterministic server URL for terminal agents and setup scaffolding

    -   Terminal server uses actual httpServer port instead of ports.json
    -   `storyboard setup` scaffolds .storyboard/terminals/ and .github/agents/
    -   ghostty-web moved from optional peer dep to regular dependency

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`7ec002f`](https://github.com/dfosco/storyboard/commit/7ec002f63a4656209621317738a7e1eb94c31d0b) Thanks [@dfosco](https://github.com/dfosco)! - Fix terminal crash on posix_spawnp failure

    -   Catch pty.spawn errors so they don't crash the dev server
    -   Auto-chmod node-pty spawn-helper at terminal server setup time

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`69d40ee`](https://github.com/dfosco/storyboard/commit/69d40ee79e6210d0edfa5741d831e1d43cb3cb70) Thanks [@dfosco](https://github.com/dfosco)! - Fix TDZ crash in terminal server — serverUrl was used before declaration

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`84624ec`](https://github.com/dfosco/storyboard/commit/84624ecf70b7b193c33d7e6a9be27ee724da60d0) Thanks [@dfosco](https://github.com/dfosco)! - Revert performance mode (broken), keep pause-embeds, terminal state machine, tmux mouse, scroll fix

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`5743b6b`](https://github.com/dfosco/storyboard/commit/5743b6b82e6a400201fff4477d6dfc6032675f0a) Thanks [@dfosco](https://github.com/dfosco)! - Fix blank terminal widget in consumer projects

    -   Show error message when ghostty-web is unavailable instead of blank screen
    -   Fix image paste on canvas now copies widget ID to clipboard

-   [`5e40eb8`](https://github.com/dfosco/storyboard/commit/5e40eb852b90011e3b36ea5bac1e3aa620237cb9) Thanks [@dfosco](https://github.com/dfosco)! - Canvas UX overhaul — tiles widget, image crop, configurable zoom, and expanded pane improvements

    -   Add tiles widget with randomizable decorative tile patterns
    -   Image crop and upload with drag-to-select crop region
    -   Configurable canvas zoom limits via storyboard.config.json (default 10–250%)
    -   Expanded pane widgetType support and top bar improvements
    -   Terminal session management with bulk cleanup API and CLI
    -   Autosync persistence to survive server restarts + branch-aware pausing
    -   BranchBar static deploy support via branches.json fallback
    -   Revamped canvas create menu with categorized widget sections
    -   Replace component icon with keyframes icons
    -   Skip interact gate overlay for read-only widgets

-   [`45788cc`](https://github.com/dfosco/storyboard/commit/45788cc1dc2fa25af58d3a8af35ce143e1f94587) Thanks [@dfosco](https://github.com/dfosco)! - Fix leaked monorepo imports in storyboard-react

    -   Replace relative `../../../core/` imports in `data-plugin.js` with proper `@dfosco/storyboard-core/*` package imports
    -   Add missing dependencies: `cmdk`, `@radix-ui/react-dialog`, `@radix-ui/react-visually-hidden`, `feather-icons`

-   [`800913c`](https://github.com/dfosco/storyboard/commit/800913cb9c769c517b4a7f4d508a3ac50b8e5c83) Thanks [@dfosco](https://github.com/dfosco)! - Externalize React from ui-runtime bundle

    -   Add `react`, `react-dom`, `react/jsx-runtime`, and `react/jsx-dev-runtime` to Rollup externals in `vite.ui.config.js`
    -   Fixes `Uncaught ReferenceError: React is not defined` when consuming `storyboard-ui.js` in Vite ESM dev server

-   [`d0b0bca`](https://github.com/dfosco/storyboard/commit/d0b0bca620d72ec5b5fbc2301fea88b33b6dc85d) Thanks [@dfosco](https://github.com/dfosco)! - Fix react-dom version mismatch in ui-runtime bundle

    -   Use regex patterns for React externals to catch all subpath imports (`react-dom/client`, `react/jsx-runtime`, etc.)
    -   Prevents react-dom internals from being bundled, which caused a version mismatch crash and prevented the toolbar from mounting
    -   Bundle size reduced by ~900KB (2.6MB → 1.7MB)

-   [`51628e6`](https://github.com/dfosco/storyboard/commit/51628e6a6a9ec0f3e8c064169df4495a9501f124) Thanks [@dfosco](https://github.com/dfosco)! - Fix React.createElement not defined in ui-runtime

    -   Remove obsolete Svelte plugin from ui build config
    -   Add `esbuild.jsx: 'automatic'` to use the React automatic JSX runtime
    -   Eliminates 647 `React.createElement` calls that referenced an undefined `React` global

-   [`a2a026a`](https://github.com/dfosco/storyboard/commit/a2a026a5fc20ef6b169e33cd5c72134de362f579) Thanks [@dfosco](https://github.com/dfosco)! - Fix singleton state split in tool handlers

    -   Tool handlers (canvasAgents, featureFlags, canvasToolbar, devtools, flows) now import from `@dfosco/storyboard-core` instead of relative paths
    -   Prevents Vite from creating separate module instances when pre-bundling, which caused configStore to appear empty in the toolbar (no agent tool, empty command palette)

-   [`4ba9461`](https://github.com/dfosco/storyboard/commit/4ba9461ff29794b55ce490393a1e589f6dab0e38) Thanks [@dfosco](https://github.com/dfosco)! - Fix singleton state split in dynamically-loaded components

    -   Convert relative imports in CanvasAgentsMenu, CanvasCreateMenu, ActionMenuButton, CreateMenuButton, ThemeMenuButton, and handler modules (comments, devtools, paletteTheme) to use `@dfosco/storyboard-core` self-reference
    -   Fixes agent tool button not rendering despite guard passing, and command palette showing empty results in consumer apps

-   [`e182d46`](https://github.com/dfosco/storyboard/commit/e182d4686937ca942aaf16fb4a74f7fa5a25735e) Thanks [@dfosco](https://github.com/dfosco)! - Fix command palette empty sections in consumer apps

    -   Convert mountStoryboardCore singleton imports to @dfosco/storyboard-core self-reference
    -   Export initCommandPaletteConfig and consumeClientToolbarOverrides from barrel
    -   Fixes command palette showing "No results found" due to singleton state split between prebundled and source module instances

-   [`77d30b8`](https://github.com/dfosco/storyboard/commit/77d30b8488b0945a5e3641a0058cd250ce7d2e9d) Thanks [@dfosco](https://github.com/dfosco)! - Add temporary devlogs to command palette config flow for debugging

-   [`8f88012`](https://github.com/dfosco/storyboard/commit/8f88012d579baf080eb96e495139c4eab3a53d87) Thanks [@dfosco](https://github.com/dfosco)! - Add devlogs to trace command palette config flow end-to-end

-   [`3b50b16`](https://github.com/dfosco/storyboard/commit/3b50b16278afaa849b6e0f42f326f729f0cdb298) Thanks [@dfosco](https://github.com/dfosco)! - Id-based array merge for config + remove scaffold config files

    -   `deepMergeBuild` now merges arrays of objects by `id` field instead of replacing wholesale
    -   Users can customize command palette sections by defining only the ones they want to add/override
    -   Removed `commandpalette.config.json` and `toolbar.config.json` from scaffold — they caused empty arrays to overwrite core defaults

## 4.2.0-beta.28

### Patch Changes

-   Id-based array merge for config + remove scaffold config files

    -   `deepMergeBuild` now merges arrays of objects by `id` field instead of replacing wholesale
    -   Users can customize command palette sections by defining only the ones they want to add/override
    -   Removed `commandpalette.config.json` and `toolbar.config.json` from scaffold — they caused empty arrays to overwrite core defaults

## 4.2.0-beta.27

### Patch Changes

-   Add devlogs to trace command palette config flow end-to-end

## 4.2.0-beta.26

### Patch Changes

-   Add temporary devlogs to command palette config flow for debugging

## 4.2.0-beta.25

### Patch Changes

-   Fix command palette empty sections in consumer apps

    -   Convert mountStoryboardCore singleton imports to @dfosco/storyboard-core self-reference
    -   Export initCommandPaletteConfig and consumeClientToolbarOverrides from barrel
    -   Fixes command palette showing "No results found" due to singleton state split between prebundled and source module instances

## 4.2.0-beta.24

### Patch Changes

-   Fix singleton state split in dynamically-loaded components

    -   Convert relative imports in CanvasAgentsMenu, CanvasCreateMenu, ActionMenuButton, CreateMenuButton, ThemeMenuButton, and handler modules (comments, devtools, paletteTheme) to use `@dfosco/storyboard-core` self-reference
    -   Fixes agent tool button not rendering despite guard passing, and command palette showing empty results in consumer apps

## 4.2.0-beta.23

### Patch Changes

-   Fix singleton state split in tool handlers

    -   Tool handlers (canvasAgents, featureFlags, canvasToolbar, devtools, flows) now import from `@dfosco/storyboard-core` instead of relative paths
    -   Prevents Vite from creating separate module instances when pre-bundling, which caused configStore to appear empty in the toolbar (no agent tool, empty command palette)

## 4.2.0-beta.22

### Patch Changes

-   Fix React.createElement not defined in ui-runtime

    -   Remove obsolete Svelte plugin from ui build config
    -   Add `esbuild.jsx: 'automatic'` to use the React automatic JSX runtime
    -   Eliminates 647 `React.createElement` calls that referenced an undefined `React` global

## 4.2.0-beta.21

### Patch Changes

-   Fix react-dom version mismatch in ui-runtime bundle

    -   Use regex patterns for React externals to catch all subpath imports (`react-dom/client`, `react/jsx-runtime`, etc.)
    -   Prevents react-dom internals from being bundled, which caused a version mismatch crash and prevented the toolbar from mounting
    -   Bundle size reduced by ~900KB (2.6MB → 1.7MB)

## 4.2.0-beta.20

### Patch Changes

-   Externalize React from ui-runtime bundle

    -   Add `react`, `react-dom`, `react/jsx-runtime`, and `react/jsx-dev-runtime` to Rollup externals in `vite.ui.config.js`
    -   Fixes `Uncaught ReferenceError: React is not defined` when consuming `storyboard-ui.js` in Vite ESM dev server

## 4.2.0-beta.19

### Patch Changes

-   Fix leaked monorepo imports in storyboard-react

    -   Replace relative `../../../core/` imports in `data-plugin.js` with proper `@dfosco/storyboard-core/*` package imports
    -   Add missing dependencies: `cmdk`, `@radix-ui/react-dialog`, `@radix-ui/react-visually-hidden`, `feather-icons`

## 4.2.0-beta.18

### Patch Changes

-   Canvas UX overhaul — tiles widget, image crop, configurable zoom, and expanded pane improvements

    -   Add tiles widget with randomizable decorative tile patterns
    -   Image crop and upload with drag-to-select crop region
    -   Configurable canvas zoom limits via storyboard.config.json (default 10–250%)
    -   Expanded pane widgetType support and top bar improvements
    -   Terminal session management with bulk cleanup API and CLI
    -   Autosync persistence to survive server restarts + branch-aware pausing
    -   BranchBar static deploy support via branches.json fallback
    -   Revamped canvas create menu with categorized widget sections
    -   Replace component icon with keyframes icons
    -   Skip interact gate overlay for read-only widgets

## 4.2.0-beta.17

### Minor Changes

-   Expandable widgets, split-screen, agent system, and command palette overhaul

    -   Expandable modals for markdown and GitHub embed widgets (matching prototype/figma behavior)
    -   Split-screen mode: connected widget pairs render side-by-side fullscreen with shared top bar, focus tracking, and x-coordinate ordering
    -   Agent widget system with canvas toolbar integration, add-agent menu, and config-driven visibility
    -   React Icon component supporting Primer Octicons, Feather, and Iconoir icon sources
    -   Command palette rebuilt with cmdk (React 19 compatible), with icons and improved search
    -   Terminal widget fixes: font-size scaling, non-resizable mode, viewport scroll prevention
    -   Undo/redo fix: HMR echo no longer resets the history stack

## 4.2.0-alpha.13

### Minor Changes

-   Terminal widget expand/collapse fixes and persistence

    -   Fix expand: always render xterm container to prevent black screen on expand/collapse
    -   Auto-focus terminal and set interactive mode on expand
    -   Persist expanded state across page refreshes (URL hash)
    -   Store terminal widget's own props in config (agents can read prettyName, etc.)
    -   Use tmux session name as stable config lookup key
    -   Refresh terminal config on every canvas mutation
    -   Persist hide-chrome setting across page reloads
    -   Improve toolbar tooltip shortcut labels
    -   Command palette fixes (resilient config loading, empty state fix)
    -   Rename surfaces: main-toolbar → command-toolbar, command-list → command-palette
    -   BranchBar: blue accent, show on main in dev
    -   Show both proxy and localhost URLs on dev server start
    -   Change private image prefix from underscore to tilde (~)
    -   Unified config store for all storyboard configuration
    -   Enable folder grouping in all viewfinder nav views
    -   Auto-discover root toolbar.config.json for client-repo tool overrides

## 4.2.0-alpha.12

### Patch Changes

-   Revert performance mode (broken), keep pause-embeds, terminal state machine, tmux mouse, scroll fix

## 4.2.0-alpha.11

## 4.2.0-alpha.10

### Minor Changes

-   Live canvas updates from CLI/API — no more page refresh needed

    Canvas API endpoints now push real-time updates to the browser via HMR after every write. Widget adds, updates, deletes, and connector changes all propagate instantly without requiring a page refresh.

## 4.2.0-alpha.9

### Patch Changes

-   Fix TDZ crash in terminal server — serverUrl was used before declaration

## 4.2.0-alpha.8

### Patch Changes

-   Fix terminal crash on posix_spawnp failure

    -   Catch pty.spawn errors so they don't crash the dev server
    -   Auto-chmod node-pty spawn-helper at terminal server setup time

## 4.2.0-alpha.7

### Patch Changes

-   Deterministic server URL for terminal agents and setup scaffolding

    -   Terminal server uses actual httpServer port instead of ports.json
    -   `storyboard setup` scaffolds .storyboard/terminals/ and .github/agents/
    -   ghostty-web moved from optional peer dep to regular dependency

## 4.2.0-alpha.6

### Patch Changes

-   Fix terminal widgets not connecting in client repos

    -   Move ghostty-web from optional peerDependency to regular dependency in @dfosco/storyboard-react
    -   Remove @vite-ignore from dynamic import so Vite resolves ghostty-web normally
    -   Terminal widgets now work out of the box without clients manually installing ghostty-web

## 4.2.0-alpha.5

### Minor Changes

-   Terminal agents: context awareness, auto-launch copilot, canvas update CLI

    -   Terminal agents with context awareness, signal bus, and action widgets
    -   Auto-launch copilot with agent instructions on new terminal sessions
    -   Canvas update CLI command and PATCH /widget API endpoint
    -   Inline full widget data in terminal config for zero-latency context
    -   Fix: prevent accidental canvas wipes from PUT /update endpoint
    -   Fix: reliable env var passing to terminal agents
    -   Several fixes for copilot launch flow (pre-type, agent flag, env vars)

## 4.2.0-beta.4

### Patch Changes

-   Fix command palette losing library-provided sections (like add-widget) when client overrides config

    -   Sections are now merged by `id` instead of replaced wholesale
    -   Client sections take priority, default sections not in client config are preserved

## 4.2.0-beta.3

### Patch Changes

-   Fix ghostty-web import crash for consumers without the package

    -   Add @vite-ignore to dynamic import to prevent Vite pre-transform errors
    -   Catch import failures gracefully instead of crashing
    -   Declare ghostty-web as optional peerDependency

## 4.2.0-beta.2

### Patch Changes

-   Add node-pty as optionalDependency so client repos get terminal widget support on `npm install`.

## 4.2.0-beta.1

### Patch Changes

-   Fix client repo crash: make `ws` import graceful (try/catch like node-pty) and add as explicit dependency.

## 4.2.0-beta.0

### Minor Changes

-   TMUX session management, terminal widget UX, interact gate system, and canvas page ordering.

    -   Terminal sessions scoped by branch/canvas with persistent registry, friendly names (color-bird), and graceful orphan handling
    -   `storyboard terminal` CLI: session browser, welcome prompt, close/open/remove subcommands
    -   Widget interact gate system: configurable "Click to interact" overlay in WidgetChrome, double-Escape to exit
    -   Terminal widget: title bar, zzz sleep animation, selection border radius, default size 800×450
    -   Canvas folder page ordering via .meta.json with drag-and-drop persistence
    -   Command palette focus fix (removed duplicate mount)
    -   Viewfinder page order fix
    -   Connector arrow endpoints (circle, arrow-in, arrow-out, none)

## 4.1.0

### Minor Changes

-   [`eaa140a`](https://github.com/dfosco/storyboard/commit/eaa140a17ea26b9fc71dd3e662bd963b5874c8c3) Thanks [@dfosco](https://github.com/dfosco)! - Fix canvas title bar and branch bar not rendering on client deployments

    -   Always show canvas title text regardless of sibling page count
    -   Mount Svelte BranchBar from CoreUIBar so branch indicator renders in production builds

-   [`eb1b084`](https://github.com/dfosco/storyboard/commit/eb1b084b577a69832eda08b6ae8c1a231cd8c65f) Thanks [@dfosco](https://github.com/dfosco)! - Remove Svelte BranchBar, auto-render React CommandPalette from StoryboardProvider

    -   Delete BranchBar.svelte — moving toward React-only architecture
    -   CommandPalette (including BranchBar) now auto-renders from StoryboardProvider
    -   Client repos no longer need to manually import BranchBar or CommandPalette

-   Canvas UI improvements, prod deployment fixes, and React-first architecture

    -   Always show canvas title bar on client deployments
    -   Auto-render BranchBar and CommandPalette from StoryboardProvider — client repos get them for free
    -   Remove Svelte BranchBar in favor of React-only implementation
    -   Fix prod 404s for fonts, canvas server API calls, and private images
    -   Instant widget updates when adding via CLI/API (use HMR metadata directly)
    -   Deduplicate consecutive separators in command palette
    -   Fix viewport persistence — saved zoom/scroll no longer gets clobbered by canvas data refresh

    ### Beta releases

    **beta.0** — Show canvas title bar and branch bar on client deployments

    **beta.1** — Re-release with corrected worktree

    **beta.2** — Remove Svelte BranchBar, auto-render React CommandPalette from StoryboardProvider so client repos don't need extra imports

    **beta.3** — Fix prod 404s: font paths, skip canvas server API in prod, hide private images in prod builds

### Patch Changes

-   [`bb07137`](https://github.com/dfosco/storyboard/commit/bb071379b888c793080b869679b0f405dd2a0cf3) Thanks [@dfosco](https://github.com/dfosco)! - Re-release of canvas title bar and branch bar fixes for client deployments

-   [`a51b237`](https://github.com/dfosco/storyboard/commit/a51b237037062bc6cb2502ef33dfc738b943155d) Thanks [@dfosco](https://github.com/dfosco)! - Fix prod 404s for fonts, canvas API, and private images

    -   Fix font paths to resolve from repo root assets/fonts/
    -   Skip canvas server API fetch in production builds
    -   Hide private images in prod (not included in dist)

## 4.1.0-beta.3

### Patch Changes

-   Fix prod 404s for fonts, canvas API, and private images

    -   Fix font paths to resolve from repo root assets/fonts/
    -   Skip canvas server API fetch in production builds
    -   Hide private images in prod (not included in dist)

## 4.1.0-beta.2

### Minor Changes

-   Remove Svelte BranchBar, auto-render React CommandPalette from StoryboardProvider

    -   Delete BranchBar.svelte — moving toward React-only architecture
    -   CommandPalette (including BranchBar) now auto-renders from StoryboardProvider
    -   Client repos no longer need to manually import BranchBar or CommandPalette

## 4.1.0-beta.1

### Patch Changes

-   Re-release of canvas title bar and branch bar fixes for client deployments

## 4.1.0-beta.0

### Minor Changes

-   Fix canvas title bar and branch bar not rendering on client deployments

    -   Always show canvas title text regardless of sibling page count
    -   Mount Svelte BranchBar from CoreUIBar so branch indicator renders in production builds

## 4.0.0

Storyboard 4.0.0 — canvas system, command palette, toolbar tools, and customer mode.

-   **Canvas system**: multi-page canvases, marquee multi-select, widget snap/alignment, paste rules, prototype embeds with zoom, canvas theme sync across all Primer themes
-   **Command palette**: ported to @dfosco/storyboard-react, config extracted to commandpalette.config.json, author search, tool sub-pages, frecency ranking
-   **Toolbar tools**: declarative config-driven system (toolbar.config.json), tool registry, tool state store, surface/handler architecture, per-prototype overrides
-   **Customer mode**: new config for hiding chrome, homepage, and setting a prototype homepage redirect
-   **BranchBar**: ported to React, hidden in embeds, branch switching UI
-   **AuthModal**: ported to React with Primer theme support, BaseUI Dialog
-   **Workshop**: create actions for prototypes, flows, canvases
-   **Selected widgets bridge** for Copilot context
-   **Smooth-corners** paint worklet support
-   **Inspector/highlighter** system
-   **Comments system** with GitHub Discussions

### Beta releases

#### beta.0

-   Storyboard CLI with Caddy proxy for clean dev URLs, worktree port registry, and project scaffolding
-   Canvas multi-select, drag, snap-to-grid, undo/redo, zoom-to-fit, and config-driven widget resize
-   Widget chrome with toolbar, image paste, Figma embed, viewport persistence, and HMR guard

#### beta.1–2

-   Paste non-URL text to create markdown widgets on canvas
-   Add `update`, `update:beta`, `update:alpha` CLI commands and `devDomain` config key

#### beta.3

-   Canvas skill with rename watcher for embed URL sync
-   Caddy admin API for multi-repo route isolation; CNAME from `customDomain` config

#### beta.4

-   Batch git calls and scope glob patterns for faster dev server startup

#### beta.5–6

-   Canvas read CLI with widget query docs; iframe-isolate component widgets
-   Prompt-based root-to-worktree conversion and `sb code` command
-   Use remark with GitHub Flavored Markdown for markdown widgets

#### beta.7–8

-   Copy widget URL/ID with keyboard shortcuts
-   Collision detection utility for widget positioning

#### beta.10–11

-   Add image drag-and-drop from Finder to canvas
-   Embed click-to-interact overlay; fix multi-select and space-pan conflicts

#### beta.12

-   Fix canvas image emission in production builds
-   Fix widget menu/toolbar alignment and HMR metadata merge

#### beta.13

-   Advanced copy-paste with `canvasName/widgetId` clipboard format
-   Add `{ optional }` flag for `useFlowData`

#### beta.15

-   Story widget system with multi-page canvas and page selector
-   Config-driven paste rule engine, Figma embed, and snapshot lazy-loading
-   Markdown code blocks with syntax highlighting; canvas folder `.meta.json` support

#### beta.16–18

-   Fix highlight.js ESM/CJS compatibility for Vite builds

#### beta.19

-   Mobile experience — toolbar in command menu, PWA install, pull-to-refresh prevention
-   Storyboard snapshots CLI for batch preview generation
-   Canvas viewport persistence with zoom-to-fit fallback

#### beta.21–22

-   Server-side widget filtering for canvas read
-   CI-based snapshot generation with stable naming and dirty detection

#### beta.25

-   In-browser iframe snapshot capture with dual-theme support
-   Gate iframe mounts behind interaction (load on click)
-   Migrate canvas identity to canonical path-based `canvasId`

#### beta.26

-   Eliminate zoom re-render cascade and optimize snapshot capture

#### beta.28–29

-   GitHub embed widget — issue/PR/discussion cards with full markdown, signed images, and videos
-   CodePen embed widget with header bar showing pen title and author
-   Canvas embed snapshot wave-refresh with theme-aware captures

#### beta.30

-   JSONL compaction command and auto-compact on dev start

#### beta.35–36

-   Remove entire snapshot system from prototype embeds — iframes load directly

#### beta.37

-   Viewfinder redesign — SaaS homescreen with cards, folders, Base UI type scale
-   Standalone storyboard server with branch switching API
-   Command palette ported from Svelte to React with react-cmdk

#### beta.38

-   Multi-repo dev server support scoped by `devDomain`
-   Link-preview card redesign with editable title and OG image

#### beta.40

-   Multi-widget copy/paste on canvas
-   Consolidate PAT auth into single React modal
-   Scaffold agent-browser, ship, and canvas skills

#### beta.41–42

-   Fully config-driven command palette with tool sub-pages, author search, and Primer theming
-   Hide-toolbars inline action and `hideInCommandPalette` property

#### beta.44

-   Port CommandPalette to `@dfosco/storyboard-react` (auto-renders for all consumers)
-   Marquee multi-select drag on canvas background
-   Selected widgets bridge for Copilot context

#### beta.45

-   Port AuthModal and BranchBar to `@dfosco/storyboard-react`

#### beta.47

-   Extract command palette config to `commandpalette.config.json`
-   Add `customerMode` config and canvas theme vars for all Primer themes including high contrast
-   Fix command palette dark mode; migrate AuthModal to BaseUI Dialog

#### beta.48

-   Hide React BranchBar in embeds via `_sb_embed` and `_sb_hide_branch_bar` params

## 3.11.0

### Minor Changes

-   [`3715731`](https://github.com/dfosco/storyboard/commit/3715731be4e7559b958af9e0f550f895ae759d85) Thanks [@dfosco](https://github.com/dfosco)! - Config-driven dropdown menus and image widget actions

    -   New `dropdown` feature type — renders a chevron button with a menu of actions, fully config-driven
    -   Image widget dropdown: Download image, Copy as PNG, Copy file path
    -   Component widgets now have "Copy link to widget" in overflow menu
    -   Widget URL centering supports JSX source widgets (jsx-\* IDs)

-   [`542d59d`](https://github.com/dfosco/storyboard/commit/542d59d5cb3028ea77d7b8a55b888cf19f7bbd7b) Thanks [@dfosco](https://github.com/dfosco)! - Canvas editing improvements and image paste support

    -   Paste images directly onto the canvas — retina-aware sizing, privacy toggle, aspect-ratio-correct rendering
    -   Figma embed widget for pasted Figma URLs
    -   Persist viewport position (scroll x/y) and zoom across sessions via localStorage
    -   Per-client HMR guard — canvas pages suppress reloads while editing, other tabs unaffected
    -   Color picker renders below trigger with seamless hover bridge
    -   Widget toolbar improvements: Primer Tooltips, Octicon icons, ESC to deselect, open-in-new-tab for prototype embeds
    -   Fix: use relative imports for Vite plugins so worktrees load their own source

-   [`917bd74`](https://github.com/dfosco/storyboard/commit/917bd74fdbc20ea29b4cf1ff73350056934f111a) Thanks [@dfosco](https://github.com/dfosco)! - Canvas tooling: zoom-to-fit, copy widget, undo/redo, and embed navigation

    -   Zoom to objects button frames all widgets in the viewport
    -   Copy widget tool duplicates any widget at cascading +40px offsets
    -   Full undo/redo system for canvas operations (⌘Z / ⌘⇧Z)
    -   Prototype embed navigation is now persisted and undoable
    -   Canvas toolbar moved to Svelte CoreUIBar (zoom, undo/redo, zoom-to-objects)
    -   Default sizes: sticky note 270×170, markdown 530×240
    -   Tooltip delay reduced to 50ms

-   [`709917c`](https://github.com/dfosco/storyboard/commit/709917c4d85fec150515882e4992e3b27034a18b) Thanks [@dfosco](https://github.com/dfosco)! - Config-driven widget resize and dark mode fix

    -   Widget resize is now controlled via `resize: { enabled, prod }` in widgets.config.json
    -   New `isResizable(type)` helper respects config + build environment + mutability
    -   Fix: select handle now shows correct accent color in dark mode

-   Storyboard 3.11.0

    Canvas

    -   Multi-select: shift+click widgets, group drag with animated peer transitions
    -   Undo/redo for widget moves, resizes, and component widgets
    -   Snap-to-grid toggle for widget positions and resize
    -   Zoom-to-fit button, viewport persistence across sessions
    -   Figma embed widget for pasted Figma URLs
    -   Paste images directly on canvas
    -   Widget URLs, copy widget, open-in-new-tab actions
    -   Config-driven widget resize, dropdown menus, and feature flags
    -   Expand modal for prototype and figma embed widgets
    -   Drag surface and improved widget selection
    -   Canvas route 404 fallback
    -   gridSize edge padding on canvas boundary
    -   Suppress HMR full-reloads while canvas is active

    Production mode

    -   ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Canvas title renders as static h1 in prod
    -   Default cursor on all widgets in locked/prod mode
    -   Markdown text selection and copy in prod, edit mode disabled
    -   Prod flag system for toolbar tools and widget chrome features

    Autosync

    -   Automatic commit and push tool
    -   Scope modes (all/branch), hide main branch from relay list
    -   Isolate sync in branch worktree
    -   Stash external edits during sync

    Canvas polish

    -   Faster multi-drag peer transition (150ms + 50ms delay)
    -   Accent color select handle in dark mode
    -   Solid outline for multi-selected widgets
    -   Drag boundary flicker fix with transform callback

-   [`3800568`](https://github.com/dfosco/storyboard/commit/3800568a0585ce61a7811d00b6c26c82aebab07c) Thanks [@dfosco](https://github.com/dfosco)! - Snap-to-grid and viewfinder tab persistence

    -   Snap-to-grid toggle in canvas toolbar — snaps widget positions and resize to grid (default 40px)
    -   Persisted as snapToGrid in canvas settings, configurable via gridSize
    -   Viewfinder canvas/prototype tab now stored in localStorage instead of URL hash

-   [`e97a4de`](https://github.com/dfosco/storyboard/commit/e97a4def7fc4cd1412aa3700ea727bfd99cb69b9) Thanks [@dfosco](https://github.com/dfosco)! - Widget URLs, overflow menu, and config-driven widget tools

    -   Each widget has a unique URL (?widget=id) that centers the viewport on load
    -   Widget toolbar "..." overflow menu with "Copy link to widget" and "Delete widget"
    -   Widget tools (icons, labels, menu placement) fully driven by widgets.config.json
    -   Config variables system ($label:duplicate, etc.) for shared text
    -   Fix: comment deep links (?comment=id) now open the comment box on cache hit
    -   Prototype embed navigation persisted with undo/redo support

### Patch Changes

-   [`62538dd`](https://github.com/dfosco/storyboard/commit/62538dd30dc7052a386be4729f214a5664758869) Thanks [@dfosco](https://github.com/dfosco)! - Add autosync tool entry to toolbar.config.json so the AutoSync button renders in the main toolbar (dev-only).

-   [`79b55bf`](https://github.com/dfosco/storyboard/commit/79b55bfe4ada902df569afbf2753d3cd6ebae276) Thanks [@dfosco](https://github.com/dfosco)! - Canvas expand modal, multi-select, and drag improvements

    -   feat: expand modal for prototype and figma embed widgets — iframe reparenting via moveBefore() for instant expand without reload
    -   feat: multi-select for canvas widgets with shift-click support
    -   feat: drag surface and improved widget selection UX
    -   feat: prod flag system for toolbar tool features
    -   fix: viewfinder FOUC from duplicate async CSS loading paths
    -   fix: drag boundary flicker eliminated via neodrag transform callback
    -   fix: canvas stuck on loading in production builds
    -   fix: drag handle detection supports multi-handle selectors
    -   fix: select handle uses onClick, better drag/select distinction
    -   fix: solid outline for multi-selected widgets

-   [`0bb755e`](https://github.com/dfosco/storyboard/commit/0bb755e23cd9d797ce2e09d5b55c148737732d43) Thanks [@dfosco](https://github.com/dfosco)! - Fix multi-select drag on canvas

    -   Any selected widget can now serve as the drag handler for the entire group
    -   Peers animate to new positions on drag end via delayed CSS transition
    -   Selection is preserved during and after drag (no longer collapses on click)
    -   Mixed selections of JSON + JSX component widgets now move together

-   [`c781179`](https://github.com/dfosco/storyboard/commit/c781179eb51ce0efed1f68af2265d82633a56740) Thanks [@dfosco](https://github.com/dfosco)! - Fix multi-select drag not applying to component widgets

    -   Pass multiSelected prop to component widget WidgetChrome so they participate in group drag operations

-   [`7994b34`](https://github.com/dfosco/storyboard/commit/7994b343bf2bc9a6160f3442c1b9944bdc55ca0b) Thanks [@dfosco](https://github.com/dfosco)! - Production mode simulation and canvas polish

    -   Add ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Add gridSize edge padding to canvas boundary
    -   Faster multi-drag peer transition (150ms duration + 50ms delay)
    -   Canvas title renders as static h1 in prod (no hover/edit)
    -   Default cursor on all widgets in prod/locked mode
    -   Markdown widgets: text selection and copy works in prod, edit mode disabled

-   [`444e732`](https://github.com/dfosco/storyboard/commit/444e73206abc444295d00e9a40cd682d92d8ac98) Thanks [@dfosco](https://github.com/dfosco)! - Autosync scope modes, canvas fallback, and polish

    -   Autosync: add scope modes (all/branch) and hide main branch from relay list
    -   Autosync: isolate sync in branch worktree, stash external edits during sync
    -   Autosync: refine enabled-state menu actions, show single relay last-sync time
    -   Add canvas route 404 fallback for unknown canvas names
    -   Fix border radius on embed widgets
    -   Update canvas and toolbar configs

## 3.11.0-beta.12

### Patch Changes

-   Autosync scope modes, canvas fallback, and polish

    -   Autosync: add scope modes (all/branch) and hide main branch from relay list
    -   Autosync: isolate sync in branch worktree, stash external edits during sync
    -   Autosync: refine enabled-state menu actions, show single relay last-sync time
    -   Add canvas route 404 fallback for unknown canvas names
    -   Fix border radius on embed widgets
    -   Update canvas and toolbar configs

## 3.11.0-beta.11

### Patch Changes

-   Production mode simulation and canvas polish

    -   Add ?prodMode URL param and devtools toggle to simulate production rendering in dev
    -   Add gridSize edge padding to canvas boundary
    -   Faster multi-drag peer transition (150ms duration + 50ms delay)
    -   Canvas title renders as static h1 in prod (no hover/edit)
    -   Default cursor on all widgets in prod/locked mode
    -   Markdown widgets: text selection and copy works in prod, edit mode disabled

## 3.11.0-beta.10

### Patch Changes

-   Fix multi-select drag not applying to component widgets

    -   Pass multiSelected prop to component widget WidgetChrome so they participate in group drag operations

## 3.11.0-beta.9

### Patch Changes

-   Fix multi-select drag on canvas

    -   Any selected widget can now serve as the drag handler for the entire group
    -   Peers animate to new positions on drag end via delayed CSS transition
    -   Selection is preserved during and after drag (no longer collapses on click)
    -   Mixed selections of JSON + JSX component widgets now move together

## 3.11.0-beta.8

### Minor Changes

-   Config-driven widget resize and dark mode fix

    -   Widget resize is now controlled via `resize: { enabled, prod }` in widgets.config.json
    -   New `isResizable(type)` helper respects config + build environment + mutability
    -   Fix: select handle now shows correct accent color in dark mode

## 3.11.0-beta.7

### Patch Changes

-   Canvas expand modal, multi-select, and drag improvements

    -   feat: expand modal for prototype and figma embed widgets — iframe reparenting via moveBefore() for instant expand without reload
    -   feat: multi-select for canvas widgets with shift-click support
    -   feat: drag surface and improved widget selection UX
    -   feat: prod flag system for toolbar tool features
    -   fix: viewfinder FOUC from duplicate async CSS loading paths
    -   fix: drag boundary flicker eliminated via neodrag transform callback
    -   fix: canvas stuck on loading in production builds
    -   fix: drag handle detection supports multi-handle selectors
    -   fix: select handle uses onClick, better drag/select distinction
    -   fix: solid outline for multi-selected widgets

## 3.11.0-beta.6

### Patch Changes

-   Add autosync tool entry to toolbar.config.json so the AutoSync button renders in the main toolbar (dev-only).

## 3.11.0-beta.4

### Minor Changes

-   Snap-to-grid and viewfinder tab persistence

    -   Snap-to-grid toggle in canvas toolbar — snaps widget positions and resize to grid (default 40px)
    -   Persisted as snapToGrid in canvas settings, configurable via gridSize
    -   Viewfinder canvas/prototype tab now stored in localStorage instead of URL hash

## 3.11.0-beta.3

### Minor Changes

-   Config-driven dropdown menus and image widget actions

    -   New `dropdown` feature type — renders a chevron button with a menu of actions, fully config-driven
    -   Image widget dropdown: Download image, Copy as PNG, Copy file path
    -   Component widgets now have "Copy link to widget" in overflow menu
    -   Widget URL centering supports JSX source widgets (jsx-\* IDs)

## 3.11.0-beta.2

### Minor Changes

-   Widget URLs, overflow menu, and config-driven widget tools

    -   Each widget has a unique URL (?widget=id) that centers the viewport on load
    -   Widget toolbar "..." overflow menu with "Copy link to widget" and "Delete widget"
    -   Widget tools (icons, labels, menu placement) fully driven by widgets.config.json
    -   Config variables system ($label:duplicate, etc.) for shared text
    -   Fix: comment deep links (?comment=id) now open the comment box on cache hit
    -   Prototype embed navigation persisted with undo/redo support

## 3.11.0-beta.1

### Minor Changes

-   Canvas tooling: zoom-to-fit, copy widget, undo/redo, and embed navigation

    -   Zoom to objects button frames all widgets in the viewport
    -   Copy widget tool duplicates any widget at cascading +40px offsets
    -   Full undo/redo system for canvas operations (⌘Z / ⌘⇧Z)
    -   Prototype embed navigation is now persisted and undoable
    -   Canvas toolbar moved to Svelte CoreUIBar (zoom, undo/redo, zoom-to-objects)
    -   Default sizes: sticky note 270×170, markdown 530×240
    -   Tooltip delay reduced to 50ms

## 3.11.0-beta.0

### Minor Changes

-   Canvas editing improvements and image paste support

    -   Paste images directly onto the canvas — retina-aware sizing, privacy toggle, aspect-ratio-correct rendering
    -   Figma embed widget for pasted Figma URLs
    -   Persist viewport position (scroll x/y) and zoom across sessions via localStorage
    -   Per-client HMR guard — canvas pages suppress reloads while editing, other tabs unaffected
    -   Color picker renders below trigger with seamless hover bridge
    -   Widget toolbar improvements: Primer Tooltips, Octicon icons, ESC to deselect, open-in-new-tab for prototype embeds
    -   Fix: use relative imports for Vite plugins so worktrees load their own source

## 3.10.0

### Minor Changes

-   [#62](https://github.com/dfosco/storyboard/pull/62) [`092c28c`](https://github.com/dfosco/storyboard/commit/092c28ca0a07bf49e1b55b546b248888af259c60) Thanks [@dfosco](https://github.com/dfosco)! - Widget Chrome API & Canvas Interaction Overhaul

    -   Config-driven widget chrome toolbar with hover trigger dot, feature buttons, and select handle
    -   Select handle is the only drag source — click/double-click never triggers drag
    -   Drag gate with 150ms delay + 8px distance threshold (bypasses neodrag's broken distance calc for positioned elements)
    -   StickyNote color picker and PrototypeEmbed zoom/edit controls extracted into chrome toolbar
    -   JSX source blocks wrapped in Component widget chrome with resize support
    -   ComponentWidget double-click-to-interact overlay for stateful markup
    -   Prototype embed URL matching supports branch deploy prefixes
    -   Vite alias for tiny-canvas source resolution
    -   widgets.config.json as single source of truth for widget definitions

-   Canvas zoom and widget placement improvements

    -   Cursor-anchored zoom — wheel/pinch keeps the canvas point under the cursor fixed
    -   Viewport-centered zoom — toolbar zoom buttons center on the current viewport
    -   Widget placement centered on viewport, aligned to widget visual center
    -   Zero-delay zoom via flushSync rendering

### Patch Changes

-   [#62](https://github.com/dfosco/storyboard/pull/62) [`8e0bd21`](https://github.com/dfosco/storyboard/commit/8e0bd21841db2fd0c231eed82c71f8e3cb7dbf1b) Thanks [@dfosco](https://github.com/dfosco)! - Widget Chrome beta.1: drag gate fix, ComponentWidget interactive overlay

## 3.10.0-beta.1

### Patch Changes

-   Widget Chrome beta.1: drag gate fix, ComponentWidget interactive overlay

## 3.10.0-beta.0

### Minor Changes

-   Widget Chrome API & Canvas Interaction Overhaul

    -   Config-driven widget chrome toolbar with hover trigger dot, feature buttons, and select handle
    -   Select handle is the only drag source — click/double-click never triggers drag
    -   Drag gate with 150ms delay + 8px distance threshold (bypasses neodrag's broken distance calc for positioned elements)
    -   StickyNote color picker and PrototypeEmbed zoom/edit controls extracted into chrome toolbar
    -   JSX source blocks wrapped in Component widget chrome with resize support
    -   ComponentWidget double-click-to-interact overlay for stateful markup
    -   Prototype embed URL matching supports branch deploy prefixes
    -   Vite alias for tiny-canvas source resolution
    -   widgets.config.json as single source of truth for widget definitions

## 3.9.1

### Patch Changes

-   Unify @dfosco/tiny-canvas into fixed version group — all storyboard packages now version together
-   Pin storyboard-react → tiny-canvas dependency to exact version (was ^1.1.0)

## 3.9.0

### Minor Changes

-   OIDC Trusted Publishing: CI publishes to npm without tokens or 2FA, with provenance attestation
-   New release skill for agent-driven releases
-   New ship skill for end-to-end feature shipping workflow
-   Canvas: lock widgets to non-negative positions and prevent drag during pan ([#53](https://github.com/dfosco/storyboard/pull/53))

### Patch Changes

-   Fix repository URLs in package.json for provenance validation
-   Bump @dfosco/tiny-canvas to 1.2.0

## 3.8.2

### Patch Changes

-   Fix canvas x,y position serving on prod, theme inconsistencies

## 3.8.1

### Patch Changes

-   Fix branch-deploy URL for canvases and canvas assets

## 3.8.0

### Minor Changes

-   Significant theme and canvas improvements and bugfixes

## 3.7.0

### Minor Changes

-   Large fixes across themes, style isolation, and canvas behavior

## 3.6.1

### Patch Changes

-   Fix hosting of JSON file for inspector on branch deploys
-   Comments auth UX: route token-related failures (invalid/expired token, missing token, insufficient access/scope, repository access mismatch) to the sign-in modal with a specific top alert and exit comment mode.

## 3.6.0

### Minor Changes

-   Fix flow tool on branch deploys, fix theme application targets

## 3.5.0

### Minor Changes

-   Fix inspector and sidepanel bugs

## 3.4.0

### Minor Changes

-   Surface-based tool system, canvas toolbar, theme sync targets, highlight.js migration, and deployed docs panel support.

## 3.3.2

### Patch Changes

-   Bug fixes for package <-> client interaction

## 3.3.1

### Patch Changes

-   Fixes consumer build errors introduced in 3.3.0 where client repos without `svelte` or `shiki` installed would fail during Vite dependency optimization.

## 3.3.0

### Minor Changes

-   Restores original client architecture overhaul. Ships a pre-compiled Svelte UI bundle so consumer repos need zero Svelte toolchain — just call `mountStoryboardCore()`. On 3.3.0 specifically: Client integration fixes, theme switching, inspector improvements, and canvas polish. This release makes the pre-compiled UI bundle fully functional in consumer repos and adds several new features.

## 3.2.0

### Minor Changes

-   Restores original client architecture overhaul. Ships a pre-compiled Svelte UI bundle so consumer repos need zero Svelte toolchain — just call `mountStoryboardCore()`. On 3.3.0 specifically: Client integration fixes, theme switching, inspector improvements, and canvas polish. This release makes the pre-compiled UI bundle fully functional in consumer repos and adds several new features.

## 3.1.2

### Patch Changes

-   Add `@lucide/svelte` and `marked` to package dependencies (were only declared in monorepo root, causing "Could not resolve" errors in consumers). Inline the `smooth-corners` paint worklet to avoid Vite-specific `?url` import that breaks when source is consumed from `node_modules`. Removes `smooth-corners` as a dependency.

## 3.1.2

### Patch Changes

-   Add `@lucide/svelte` and `marked` to package dependencies (were only declared in monorepo root, causing "Could not resolve" errors in consumers).
-   Inline the `smooth-corners` paint worklet to avoid Vite-specific `?url` import that breaks when source is consumed from `node_modules`. Removes `smooth-corners` as a dependency.

## 3.1.1

### Patch Changes

-   Fixes package resolution errors when consuming `@dfosco/storyboard-core` and `@dfosco/tiny-canvas` from npm.

## 3.1.0

### Minor Changes

-   3.1.0 -- Canvas, external prototypes, and polish. This release adds the full canvas system — an infinite, zoomable workspace for arranging widgets and embedding prototypes — along with external prototype support for linking to apps hosted elsewhere. Includes a wave of bug fixes across comments, inspector, and accessibility.

## 3.0.0

### Major Changes

-   Introduces Core UI with commands and menus for storyboard
-   a00140e: # Core UI Release — v3.0.0

    ## ✨ New Features

    ### Config-Driven Menu System

    -   **Command menu with structured action types** — actions support `toggle`, `link`, `separator`, `header`, and `footer` types with per-action mode visibility.
    -   **Config-driven menus** — all CoreUIBar menu buttons are declared in `core-ui.config.json` under the `menus` key, supporting sidepanel buttons and custom Svelte components.
    -   **Create Menu** — replaces the old Workshop menu with config-driven items and icon/character support.
    -   **Flow Switcher button** — new CoreUIBar button that lists all flows for the current prototype and allows switching between them.
    -   **Devtools submenu** — inspector deep-links, mode locking, and `ui.hide` config support.
    -   **Link action type** — URL-based menu items that navigate via `window.location.href`.

    ### Panel Component

    -   **New `Panel` UI component** — anchored side panel replacing modal dialogs, with proper portal handling so nested `DropdownMenu` components work correctly.
    -   **SidePanel system** — `sidePanelStore` manages panel state; panels for docs and inspector are included.
    -   **Inspector Panel** — component inspector with fiber walker and mouse-mode selection.
    -   **Doc Panel** — embedded documentation viewer via `docs-handler.js`.

    ### Icon System

    -   **Multi-source icon system** — supports Primer Octicons, Iconoir, and custom SVG icons through a unified `Icon` component.
    -   **Icon `meta` config** — menu config supports `meta` object for `strokeWeight`, `scale`, `rotate` props.
    -   **Iconoir support** — fill-based and stroke-based Iconoir icons registered as sources.

    ### Storyboard React

    -   **`useFlows()` hook** — lists all flows for the current prototype with `switchFlow()` navigation. Exported from `@dfosco/storyboard-react`.
    -   **`getFlowsForPrototype()` and `getFlowMeta()`** — new core loader utilities for flow discovery.

    ### Other

    -   **Ioskeley Mono font** — custom monospace font for core UI menus and mode selector.
    -   **Comment draft persistence** — composer saves drafts, repositions correctly, and autofocuses.
    -   **Mode hue colors** — modes now support a `hue` property for theming.
    -   **`ui.hide` config** — hide CoreUIBar and mode switcher via `storyboard.config.json`.
    -   **Toggle mode switcher with `Cmd+.`** alongside CoreUIBar.
    -   **`excludeRoutes` base path stripping** — route exclusion patterns are now portable across different base paths.

    ## 🐛 Bug Fixes

    -   Template dropdown placeholder is no longer a selectable option
    -   DropdownMenu z-index raised above Panel (`z-50` → `z-[10000]`)
    -   Panel no longer dismisses when clicking portaled children
    -   Focus trap disabled on Panel so nested portaled menus work
    -   Toggle actions execute correctly while keeping menu open
    -   Workshop features detected from registry, not DOM attribute
    -   Action menu visibility re-evaluated on SPA navigation
    -   `menuWidth` config properly applied to ActionMenuButton dropdown
    -   Button `wrapperVariants` and wrapper-aware sizing restored
    -   Viewfinder template errors repaired

    ## 📝 Documentation

    -   Renamed `scene` → `flow` across README and AGENTS.md
    -   Added storyboard-core skill for CoreUIBar menu buttons
    -   Documented new features (flow switcher, config-driven menus, panel system)

## 2.7.1

### Patch Changes

-   Change accordion defaults to closed

## 2.7.0

### Minor Changes

-   Persists open/closed state of accordions on /viewfinder in localStorage

## 2.6.0

### Minor Changes

-   Adds prototype-scoping by default for objects and improves 404 handling for missing flows.

## 2.5.0

### Minor Changes

-   Merged flow-route-inference to fix v 2.4.0

## 2.4.0

### Minor Changes

-   Add automatic flow routing per directory

## 2.3.0

### Minor Changes

-   Add folder-based separation of prototypes in viewfinder

## 2.2.0

### Minor Changes

-   Fix bug in applying recordOverrides. Add proper `?flow=` url param. Fix small issues with Viewfinder component.

## 2.1.0

### Minor Changes

-   Update storyboard internal structure to enable modes, plugins, and tools. Updates prototype folder and metadata structure to live under /prototypes. Renames scenes into flows.

## 2.0.0

### Major Changes

-   fd0a4a9: Add modes API in preparation for large breaking change refactor
-   Update storyboard internal structure to enable modes, plugins, and tools. Updates prototype folder and metadata structure to live under /prototypes. Renames scenes into flows

### Minor Changes

-   7861e32: Add prototype and flow restructure for 2.0 (breaking change)

## 2.0.0-beta.1

### Minor Changes

-   Add prototype and flow restructure for 2.0 (breaking change)

## 2.0.0-beta.0

### Major Changes

-   Add modes API in preparation for large breaking change refactor

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactice for now)

## 1.22.0

### Minor Changes

-   Iterate FF system and add dedicated `sb-ff-name` class on body

## 1.21.0

### Minor Changes

-   Add useRecord hooks

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

## 1.19.0

### Minor Changes

-   Add devtools on/off config flag

## 1.18.0

### Minor Changes

-   Add feature-flag module

## 1.17.3

### Patch Changes

-   Fix comment overlay and optimistic submission, fix link to PAT generation

## 1.17.2

### Patch Changes

-   Fixup title case on scene names in Viewfinder

## 1.17.1

### Patch Changes

-   Fix and improve viewfinder design

## 1.17.0

### Minor Changes

-   Update Storyboard index page customization

## 1.16.0

### Minor Changes

-   Improve design and customization on viewfinder home

## 1.15.2

### Patch Changes

-   Update release pipeline

## 1.15.1

### Patch Changes

-   Fix bug in hide mode, add dark-mode comment cursor

## 1.15.0

### Minor Changes

-   -   Fix bug in comment mode
    -   Improve and increase test surface
    -   Improve release script
    -   Adjust linter

## 1.14.0

### Minor Changes

-   Fix state class being added to body

## 1.13.0

### Minor Changes

-   Change viewfinder to display branches as a dropdown

## 1.12.0

### Minor Changes

-   States represented via classes on DOM

## 1.11.3

### Patch Changes

-   Republish: body class sync for overrides and scenes (v1.11.2 was a partial publish).

## 1.11.2

### Patch Changes

-   7a24fd0: Add body class sync: mirrors active overrides as `sb-{key}--{value}` and scene as `sb-scene--{name}` CSS classes on `<body>`. Classes update reactively on hash/storage changes and scene switches. Use `:global(.sb-theme--dark)` in CSS Modules to conditionally style components based on storyboard state.
-   8f3c8bc: Add state-based classes to body tag

## 1.11.1

### Patch Changes

-   Update auth modal PAT guidance: recommend fine-grained tokens with Discussions read/write permission, show minimum classic scope (repo), drop unnecessary read:user, pre-fill classic token creation form.

## 1.11.0

### Minor Changes

-   Comments UI refactor and improvements

    -   Refactor comments UI to Alpine.js templates, drop inline styles
    -   Make comment pins draggable to reposition
    -   Cache comments in localStorage with lazy-load and 2-min TTL
    -   Unify reaction trigger and indicator pill styles
    -   Add Tachyons-scale gap utility classes
    -   Move reply Edit/Delete inline with author heading
    -   Hide browser scrollbar in comment window
    -   Make window drag temporary, not persistent
    -   Add worktree skill

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

## 1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

## 1.1.0

### Minor Changes

-   f7061c5: feat: add comments system with GitHub Discussions backend

    Storyboard now includes an optional comments system backed by GitHub Discussions. Collaborators can place contextual comments pinned to specific positions on any page.

    Features:

    -   Press C to enter comment mode — click anywhere to place a comment
    -   Comments stored as GitHub Discussions (one discussion per route)
    -   Position-aware pins that appear where comments were placed
    -   Threaded replies, reactions, resolve/unresolve, drag-to-move
    -   Comments drawer listing all comments for the current page
    -   GitHub personal access token authentication
    -   DevTools integration with comment menu items

    Configure via `storyboard.config.json` with a `comments` key pointing to your GitHub repo and discussions category.

    New exports from `@dfosco/storyboard-core/comments`:

    -   `initCommentsConfig()`, `mountComments()`, `isCommentsEnabled()`
    -   `toggleCommentMode()`, `fetchRouteDiscussion()`, `createComment()`
    -   `replyToComment()`, `resolveComment()`, `moveComment()`, `deleteComment()`
    -   `addReaction()`, `removeReaction()`
    -   `openCommentsDrawer()`, `closeCommentsDrawer()`

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
