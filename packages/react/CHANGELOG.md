# @dfosco/storyboard-react

## 4.2.7

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.7
    -   @dfosco/tiny-canvas@4.2.7

## 4.2.6

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.6
    -   @dfosco/tiny-canvas@4.2.6

## 4.2.5

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.5
    -   @dfosco/tiny-canvas@4.2.5

## 4.2.4

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.4
    -   @dfosco/tiny-canvas@4.2.4

## 4.2.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.3
    -   @dfosco/tiny-canvas@4.2.3

## 4.2.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.2
    -   @dfosco/tiny-canvas@4.2.2

## 4.2.1

### Patch Changes

-   Updated dependencies [[`ab1db0e`](https://github.com/dfosco/storyboard/commit/ab1db0e2a85fd76630b6709995872547fc99e2d6)]:
    -   @dfosco/storyboard-core@4.2.1
    -   @dfosco/tiny-canvas@4.2.1

## 4.2.0

### Patch Changes

-   [#179](https://github.com/dfosco/storyboard/pull/179) [`1043b32`](https://github.com/dfosco/storyboard/commit/1043b32a2e7300087f9b7b04304abecac43d33d8) Thanks [@dfosco](https://github.com/dfosco)! - Fix live canvas updates — HMR handler was silently dropping all events due to wrong destructuring

-   [`77d30b8`](https://github.com/dfosco/storyboard/commit/77d30b8488b0945a5e3641a0058cd250ce7d2e9d) Thanks [@dfosco](https://github.com/dfosco)! - Add temporary devlogs to command palette config flow for debugging

-   [`8f88012`](https://github.com/dfosco/storyboard/commit/8f88012d579baf080eb96e495139c4eab3a53d87) Thanks [@dfosco](https://github.com/dfosco)! - Add devlogs to trace command palette config flow end-to-end

-   [`3b50b16`](https://github.com/dfosco/storyboard/commit/3b50b16278afaa849b6e0f42f326f729f0cdb298) Thanks [@dfosco](https://github.com/dfosco)! - Id-based array merge for config + remove scaffold config files

    -   `deepMergeBuild` now merges arrays of objects by `id` field instead of replacing wholesale
    -   Users can customize command palette sections by defining only the ones they want to add/override
    -   Removed `commandpalette.config.json` and `toolbar.config.json` from scaffold — they caused empty arrays to overwrite core defaults

-   Updated dependencies [[`6fb27ac`](https://github.com/dfosco/storyboard/commit/6fb27ac747c541e0221f7588a0ff2a61a6306bcd), [`2897be6`](https://github.com/dfosco/storyboard/commit/2897be6616e90af00de072bf72fba53511df6bda), [`0f0021c`](https://github.com/dfosco/storyboard/commit/0f0021c1b3d0e222a76b2e7cbe269e970207c607), [`22f256b`](https://github.com/dfosco/storyboard/commit/22f256b64cea52550c4f37dd2b1aa28e0b6055e3), [`3ff3852`](https://github.com/dfosco/storyboard/commit/3ff3852481a157009a03818ca6c6b57ebd97655e), [`a9c8163`](https://github.com/dfosco/storyboard/commit/a9c8163bf228d5fd34e74ec8a5bc8be66433b4a7), [`5ec5ee7`](https://github.com/dfosco/storyboard/commit/5ec5ee7b5089029a1192cdb86d0ebdd64c8435aa), [`3745ba2`](https://github.com/dfosco/storyboard/commit/3745ba2f340753bf569be6495dddb32f8b321c1f), [`7ec002f`](https://github.com/dfosco/storyboard/commit/7ec002f63a4656209621317738a7e1eb94c31d0b), [`69d40ee`](https://github.com/dfosco/storyboard/commit/69d40ee79e6210d0edfa5741d831e1d43cb3cb70), [`237829b`](https://github.com/dfosco/storyboard/commit/237829b14083b14bd30c91fadb50cbda101de726), [`84624ec`](https://github.com/dfosco/storyboard/commit/84624ecf70b7b193c33d7e6a9be27ee724da60d0), [`d6f3e02`](https://github.com/dfosco/storyboard/commit/d6f3e02e2b8e750ebae2953496d657f906742930), [`5743b6b`](https://github.com/dfosco/storyboard/commit/5743b6b82e6a400201fff4477d6dfc6032675f0a), [`bd7a9e7`](https://github.com/dfosco/storyboard/commit/bd7a9e77db104855bb59ea4e3d814988a6201fd4), [`5e40eb8`](https://github.com/dfosco/storyboard/commit/5e40eb852b90011e3b36ea5bac1e3aa620237cb9), [`45788cc`](https://github.com/dfosco/storyboard/commit/45788cc1dc2fa25af58d3a8af35ce143e1f94587), [`800913c`](https://github.com/dfosco/storyboard/commit/800913cb9c769c517b4a7f4d508a3ac50b8e5c83), [`d0b0bca`](https://github.com/dfosco/storyboard/commit/d0b0bca620d72ec5b5fbc2301fea88b33b6dc85d), [`51628e6`](https://github.com/dfosco/storyboard/commit/51628e6a6a9ec0f3e8c064169df4495a9501f124), [`a2a026a`](https://github.com/dfosco/storyboard/commit/a2a026a5fc20ef6b169e33cd5c72134de362f579), [`4ba9461`](https://github.com/dfosco/storyboard/commit/4ba9461ff29794b55ce490393a1e589f6dab0e38), [`e182d46`](https://github.com/dfosco/storyboard/commit/e182d4686937ca942aaf16fb4a74f7fa5a25735e), [`77d30b8`](https://github.com/dfosco/storyboard/commit/77d30b8488b0945a5e3641a0058cd250ce7d2e9d), [`8f88012`](https://github.com/dfosco/storyboard/commit/8f88012d579baf080eb96e495139c4eab3a53d87), [`3b50b16`](https://github.com/dfosco/storyboard/commit/3b50b16278afaa849b6e0f42f326f729f0cdb298)]:
    -   @dfosco/storyboard-core@4.2.0
    -   @dfosco/tiny-canvas@4.2.0

## 4.2.0-beta.28

### Patch Changes

-   Id-based array merge for config + remove scaffold config files

    -   `deepMergeBuild` now merges arrays of objects by `id` field instead of replacing wholesale
    -   Users can customize command palette sections by defining only the ones they want to add/override
    -   Removed `commandpalette.config.json` and `toolbar.config.json` from scaffold — they caused empty arrays to overwrite core defaults

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.28
    -   @dfosco/tiny-canvas@4.2.0-beta.28

## 4.2.0-beta.27

### Patch Changes

-   Add devlogs to trace command palette config flow end-to-end

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.27
    -   @dfosco/tiny-canvas@4.2.0-beta.27

## 4.2.0-beta.26

### Patch Changes

-   Add temporary devlogs to command palette config flow for debugging

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.26
    -   @dfosco/tiny-canvas@4.2.0-beta.26

## 4.2.0-beta.25

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.25
    -   @dfosco/tiny-canvas@4.2.0-beta.25

## 4.2.0-beta.24

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.24
    -   @dfosco/tiny-canvas@4.2.0-beta.24

## 4.2.0-beta.23

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.23
    -   @dfosco/tiny-canvas@4.2.0-beta.23

## 4.2.0-beta.22

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.22
    -   @dfosco/tiny-canvas@4.2.0-beta.22

## 4.2.0-beta.21

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.21
    -   @dfosco/tiny-canvas@4.2.0-beta.21

## 4.2.0-beta.20

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.20
    -   @dfosco/tiny-canvas@4.2.0-beta.20

## 4.2.0-beta.19

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.19
    -   @dfosco/tiny-canvas@4.2.0-beta.19

## 4.2.0-beta.18

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.18
    -   @dfosco/tiny-canvas@4.2.0-beta.18

## 4.2.0-beta.17

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.17
    -   @dfosco/tiny-canvas@4.2.0-beta.17

## 4.2.0-alpha.13

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.13
    -   @dfosco/tiny-canvas@4.2.0-alpha.13

## 4.2.0-alpha.12

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.12
    -   @dfosco/tiny-canvas@4.2.0-alpha.12

## 4.2.0-alpha.11

### Patch Changes

-   Fix live canvas updates — HMR handler was silently dropping all events due to wrong destructuring

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.11
    -   @dfosco/tiny-canvas@4.2.0-alpha.11

## 4.2.0-alpha.10

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.10
    -   @dfosco/tiny-canvas@4.2.0-alpha.10

## 4.2.0-alpha.9

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.9
    -   @dfosco/tiny-canvas@4.2.0-alpha.9

## 4.2.0-alpha.8

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.8
    -   @dfosco/tiny-canvas@4.2.0-alpha.8

## 4.2.0-alpha.7

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.7
    -   @dfosco/tiny-canvas@4.2.0-alpha.7

## 4.2.0-alpha.6

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.6
    -   @dfosco/tiny-canvas@4.2.0-alpha.6

## 4.2.0-alpha.5

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-alpha.5
    -   @dfosco/tiny-canvas@4.2.0-alpha.5

## 4.2.0-beta.4

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.4
    -   @dfosco/tiny-canvas@4.2.0-beta.4

## 4.2.0-beta.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.3
    -   @dfosco/tiny-canvas@4.2.0-beta.3

## 4.2.0-beta.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.2
    -   @dfosco/tiny-canvas@4.2.0-beta.2

## 4.2.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.1
    -   @dfosco/tiny-canvas@4.2.0-beta.1

## 4.2.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.2.0-beta.0
    -   @dfosco/tiny-canvas@4.2.0-beta.0

## 4.1.0

### Patch Changes

-   Updated dependencies [[`eaa140a`](https://github.com/dfosco/storyboard/commit/eaa140a17ea26b9fc71dd3e662bd963b5874c8c3), [`bb07137`](https://github.com/dfosco/storyboard/commit/bb071379b888c793080b869679b0f405dd2a0cf3), [`eb1b084`](https://github.com/dfosco/storyboard/commit/eb1b084b577a69832eda08b6ae8c1a231cd8c65f), [`a51b237`](https://github.com/dfosco/storyboard/commit/a51b237037062bc6cb2502ef33dfc738b943155d)]:
    -   @dfosco/storyboard-core@4.1.0
    -   @dfosco/tiny-canvas@4.1.0

## 4.1.0-beta.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.1.0-beta.3
    -   @dfosco/tiny-canvas@4.1.0-beta.3

## 4.1.0-beta.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.1.0-beta.2
    -   @dfosco/tiny-canvas@4.1.0-beta.2

## 4.1.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.1.0-beta.1
    -   @dfosco/tiny-canvas@4.1.0-beta.1

## 4.1.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@4.1.0-beta.0
    -   @dfosco/tiny-canvas@4.1.0-beta.0

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

### Patch Changes

-   Updated dependencies [[`62538dd`](https://github.com/dfosco/storyboard/commit/62538dd30dc7052a386be4729f214a5664758869), [`3715731`](https://github.com/dfosco/storyboard/commit/3715731be4e7559b958af9e0f550f895ae759d85), [`542d59d`](https://github.com/dfosco/storyboard/commit/542d59d5cb3028ea77d7b8a55b888cf19f7bbd7b), [`917bd74`](https://github.com/dfosco/storyboard/commit/917bd74fdbc20ea29b4cf1ff73350056934f111a), [`79b55bf`](https://github.com/dfosco/storyboard/commit/79b55bfe4ada902df569afbf2753d3cd6ebae276), [`709917c`](https://github.com/dfosco/storyboard/commit/709917c4d85fec150515882e4992e3b27034a18b), [`0bb755e`](https://github.com/dfosco/storyboard/commit/0bb755e23cd9d797ce2e09d5b55c148737732d43), [`c781179`](https://github.com/dfosco/storyboard/commit/c781179eb51ce0efed1f68af2265d82633a56740), [`7994b34`](https://github.com/dfosco/storyboard/commit/7994b343bf2bc9a6160f3442c1b9944bdc55ca0b), [`444e732`](https://github.com/dfosco/storyboard/commit/444e73206abc444295d00e9a40cd682d92d8ac98), [`3800568`](https://github.com/dfosco/storyboard/commit/3800568a0585ce61a7811d00b6c26c82aebab07c), [`e97a4de`](https://github.com/dfosco/storyboard/commit/e97a4def7fc4cd1412aa3700ea727bfd99cb69b9)]:
    -   @dfosco/storyboard-core@3.11.0
    -   @dfosco/tiny-canvas@3.11.0

## 3.11.0-beta.12

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.12
    -   @dfosco/tiny-canvas@3.11.0-beta.12

## 3.11.0-beta.11

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.11
    -   @dfosco/tiny-canvas@3.11.0-beta.11

## 3.11.0-beta.10

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.10
    -   @dfosco/tiny-canvas@3.11.0-beta.10

## 3.11.0-beta.9

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.9
    -   @dfosco/tiny-canvas@3.11.0-beta.9

## 3.11.0-beta.8

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.8
    -   @dfosco/tiny-canvas@3.11.0-beta.8

## 3.11.0-beta.7

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.7
    -   @dfosco/tiny-canvas@3.11.0-beta.7

## 3.11.0-beta.6

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.6
    -   @dfosco/tiny-canvas@3.11.0-beta.6

## 3.11.0-beta.4

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.4
    -   @dfosco/tiny-canvas@3.11.0-beta.4

## 3.11.0-beta.3

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.3
    -   @dfosco/tiny-canvas@3.11.0-beta.3

## 3.11.0-beta.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.2
    -   @dfosco/tiny-canvas@3.11.0-beta.2

## 3.11.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.1
    -   @dfosco/tiny-canvas@3.11.0-beta.1

## 3.11.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.11.0-beta.0
    -   @dfosco/tiny-canvas@3.11.0-beta.0

## 3.10.0

### Patch Changes

-   Updated dependencies [[`8e0bd21`](https://github.com/dfosco/storyboard/commit/8e0bd21841db2fd0c231eed82c71f8e3cb7dbf1b), [`092c28c`](https://github.com/dfosco/storyboard/commit/092c28ca0a07bf49e1b55b546b248888af259c60)]:
    -   @dfosco/storyboard-core@3.10.0
    -   @dfosco/tiny-canvas@3.10.0

## 3.10.0-beta.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.1
    -   @dfosco/tiny-canvas@3.10.0-beta.1

## 3.10.0-beta.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.10.0-beta.0
    -   @dfosco/tiny-canvas@3.10.0-beta.0

## 3.9.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.1
    -   @dfosco/tiny-canvas@3.9.1

## 3.9.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.9.0

## 3.8.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.2

## 3.8.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.1

## 3.8.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.8.0

## 3.7.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.7.0

## 3.6.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.1

## 3.6.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.6.0

## 3.5.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.5.0

## 3.4.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.4.0

## 3.3.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.2

## 3.3.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.1

## 3.3.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.3.0

## 3.2.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.2.0

## 3.1.2

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.2

## 3.1.1

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.1

## 3.1.0

### Patch Changes

-   Updated dependencies []:
    -   @dfosco/storyboard-core@3.1.0

## 3.0.0

### Major Changes

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

### Patch Changes

-   Updated dependencies
-   Updated dependencies [a00140e]
    -   @dfosco/storyboard-core@3.0.0

## 2.7.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.1

## 2.7.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.7.0

## 2.6.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.6.0

## 2.5.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.5.0

## 2.4.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.4.0

## 2.3.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.3.0

## 2.2.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.2.0

## 2.1.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.1.0

## 2.0.0

### Patch Changes

-   Updated dependencies [fd0a4a9]
-   Updated dependencies [7861e32]
-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0

## 2.0.0-beta.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@2.0.0-beta.0

## 1.24.0

### Minor Changes

-   Add alpha/beta enabled release process

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.24.0

## 1.23.0

### Minor Changes

-   Add workshop dev-server under the hood (inactice for now)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.23.0

## 1.22.0

### Minor Changes

-   Iterate FF system and add dedicated `sb-ff-name` class on body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.22.0

## 1.21.0

### Minor Changes

-   Add useRecord hooks

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.21.0

## 1.20.0

### Minor Changes

-   Fix config for devtool plugin

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.20.0

## 1.19.0

### Minor Changes

-   Add devtools on/off config flag

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.19.0

## 1.18.0

### Minor Changes

-   Add feature-flag module

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.18.0

## 1.17.3

### Patch Changes

-   Fix comment overlay and optimistic submission, fix link to PAT generation
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.3

## 1.17.2

### Patch Changes

-   Fixup title case on scene names in Viewfinder
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.2

## 1.17.1

### Patch Changes

-   Fix and improve viewfinder design
-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.1

## 1.17.0

### Minor Changes

-   Update Storyboard index page customization

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.17.0

## 1.16.0

### Minor Changes

-   Improve design and customization on viewfinder home

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.16.0

## 1.15.2

### Patch Changes

-   Update release pipeline
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.2

## 1.15.1

### Patch Changes

-   Fix bug in hide mode, add dark-mode comment cursor
-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.1

## 1.15.0

### Minor Changes

-   -   Fix bug in comment mode
    -   Improve and increase test surface
    -   Improve release script
    -   Adjust linter

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.15.0

## 1.14.0

### Minor Changes

-   Fix state class being added to body

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.14.0

## 1.13.0

### Minor Changes

-   Change viewfinder to display branches as a dropdown

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.13.0

## 1.12.0

### Minor Changes

-   States represented via classes on DOM

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.12.0

## 1.11.3

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.3

## 1.11.2

### Patch Changes

-   8f3c8bc: Add state-based classes to body tag
-   Updated dependencies [7a24fd0]
-   Updated dependencies [8f3c8bc]
    -   @dfosco/storyboard-core@1.11.2

## 1.11.1

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.1

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

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.11.0

## 1.10.0

### Minor Changes

-   Fix branch previews not showing on main deployment viewfinder, move repository config to top-level and derive vite base path, and fix router.ts formatting.

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.10.0

## 1.9.0

### Minor Changes

-   Comments system, theme sync, and navigation fixes

    -   Revamp comments UI with Alpine.js, Primer tokens, and light/dark mode support
    -   Replace injected CSS with Tachyons and sb-\* custom classes
    -   Add edit/delete replies, edit/resolve/unresolve comments, viewport clamping
    -   Fix devtools click blocking, add hide/show mode toggle
    -   Theme sync: data-sb-theme attribute, localStorage persistence, basePath filter
    -   Fix SPA navigation: double-back bug, $ref resolution, scene matching

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.9.0

## 1.8.0

### Minor Changes

-   Add Viewfinder component, sceneMeta support (route + author), getSceneMeta utility, Viewfinder as index page, optimizeDeps auto-exclude fix

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.8.0

## 1.7.1

### Patch Changes

-   Fix Vite optimizeDeps error by auto-excluding @dfosco/storyboard-react from esbuild pre-bundling
    -   @dfosco/storyboard-core@1.7.1

## 1.7.0

### Minor Changes

-   Extract Viewfinder into reusable component, add sceneMeta support (route, author), auto-populate author via pre-commit hook

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.7.0

## 1.6.0

### Minor Changes

-   Update all references for storyboard-source repo rename (base paths, workflow URLs, package metadata)

### Patch Changes

-   Updated dependencies
    -   @dfosco/storyboard-core@1.6.0

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

### Patch Changes

-   Updated dependencies [f7061c5]
    -   @dfosco/storyboard-core@1.1.0

## 1.0.1

### Patch Changes

-   chore: release v1.2.1
-   Updated dependencies
    -   @dfosco/storyboard-core@1.0.1
