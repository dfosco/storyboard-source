# @dfosco/storyboard

## 0.6.0-beta.10

### Patch Changes

-   Copilot agents: switch to native `--allow-all` flag (same shape as Claude's `--dangerously-skip-permissions`) and use the `sessionStart` hook to signal true agent readiness. Eliminates the send-keys `/allow-all on` race that was typing into Copilot mid-boot, and replaces the unreliable pre-agent shell echo with a marker file touched the instant Copilot's prompt becomes interactive. Identity, role, and broadcast bind now land the moment the agent is actually usable.

## 0.6.0-beta.9

### Patch Changes

-   Eliminate the ~30 s context-delivery delay for Copilot CLI agents (cold and warm). Three layered fixes: skip the redundant readiness re-poll on hot-pool warm handoff (the pool already verified readiness); write a `.ready` marker file from the env script and poll `existsSync` (terminal-state-independent, immune to TUI repaints / alt-screen / clears); switch all `tmux capture-pane` readiness polls from `-p` to `-p -S -200` so the echo survives Copilot's full-screen TUI repaint. Claude was never affected because its readiness signal lives in a persistent status bar.

## 0.6.0-beta.8

### Patch Changes

-   Fix agent-launch lag (round 2). The env-source send-keys was `clear && source <env.sh> && clear` — the trailing `clear` wiped the `Environment loaded:` readiness echo from the pane ~10 ms after it printed, so `tmux capture-pane` never saw it and the post-startup poller fell through to its 30 s timeout fallback. Result on fresh client machines: `/allow-all`, canvas context, role/broadcast bind, and identity all arrive ~30 s late, often into Copilot's first-launch trust dialog or the input prompt mid-render. Drop the trailing clear — the welcome wrapper clears the pane itself before launching the agent.

## 0.6.0-beta.7

### Patch Changes

-   Several setup + agent-launch reliability fixes.

    -   `.storyboard/.user.json` per-user state file (gitignored) tracks the version setup last ran against. `storyboard dev` now auto-runs `storyboard setup --skip-branch` on first boot and on version drift, so scaffolding reaches users who upgrade via plain `npm install`.
    -   First-time setup asks via multiselect which coding agents to install (Copilot CLI, Claude Code, Codex CLI). Selection is persisted and reinstalled only when missing on subsequent runs.
    -   Mascot now renders above Vite output on `storyboard dev`, with the dev URL beside it.
    -   Fix: env script now ends with `echo "Environment loaded:"` again. Without it the readiness poller fell through to a 30s timeout fallback, delaying `/allow-all`, canvas-context injection, role/broadcast bind, and identity for every fresh agent launch.

## 0.6.0-beta.6

### Minor Changes

-   [`37d60f1`](https://github.com/dfosco/storyboard/commit/37d60f180df38d944eee1d07856191373112bd14) Thanks [@dfosco](https://github.com/dfosco)! - Reliability fixes for canvas/story creation and proxy startup

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

-   [`e332d43`](https://github.com/dfosco/storyboard/commit/e332d434676f4addb78f1314c6d6d63952b433d6) Thanks [@dfosco](https://github.com/dfosco)! - Add `sb proxy restart` command

    After upgrading `@dfosco/storyboard`, the long-lived runtime daemon may hold stale code from the previous version, masking CLI fixes that shipped in newer alphas. `sb proxy restart` kills the daemon (via `~/.storyboard/runtime.pid`) and verifies the fresh daemon is healthy. Run this once after every `sb update:alpha`/`update:version` until automatic version-based respawn lands.

-   [`3cc9c1f`](https://github.com/dfosco/storyboard/commit/3cc9c1f6c9433f5b3e57b7e473edc064e941a335) Thanks [@dfosco](https://github.com/dfosco)! - Auto-respawn runtime daemon on package version mismatch

    The runtime daemon is a long-lived process shared across worktrees. After upgrading `@dfosco/storyboard`, the in-memory daemon previously kept serving stale code until you ran `sb proxy restart`. Now `RuntimeClient.health()` compares the client's package.json version against the daemon's `/health` response and SIGTERMs + respawns automatically on mismatch. Source-tree dev (`0.0.0`) is exempt.

-   [`823fa70`](https://github.com/dfosco/storyboard/commit/823fa7010b949f59bd92b38a3f924119ff421fc8) Thanks [@dfosco](https://github.com/dfosco)! - Runtime hardening + simplification, plus a one-shot upgrade tool.

    -   **fix(runtime):** evict reused ports from sibling devDomain routes — fixes the "Wrong domain (421 Misdirected)" page that appeared on one server when a second `sb run` reused its port under a different devDomain.
    -   **refactor(runtime):** trim the daemon (~435 lines deleted). HotPool removed, lease TTL/`/devserver/renew` removed, FSM simplified to `spawning → ready → stopped`, `dev.js`'s worktree-conversion prompt deleted.
    -   **feat(cli):** `sb dev` is now an alias for `sb run` (proxy + runtime + dev). One command for new users.
    -   **feat(cli):** new `sb reset` command nukes the daemon, clears Caddy routes (including pre-runtime Caddyfile-reload leftovers), kills orphan `vite` processes, and respawns a fresh daemon. Use after upgrading from `main`.
    -   **feat(runtime):** `acquire()` now force-checks daemon version before binding, so `sb run` always respawns a stale daemon after a package upgrade.
    -   **fix(inspector):** scroll the restored `?inspect=` selection into the viewport before pinning the highlight.
    -   **docs(readme):** document the upgrade path for users coming from pre-0.5.0.

-   [`c363a85`](https://github.com/dfosco/storyboard/commit/c363a852249cfbaf87ccf30891aa2762eb0d1aa0) Thanks [@dfosco](https://github.com/dfosco)! - Auto-resume Copilot CLI agent widgets across `tmux kill-server`, dev-server restarts, and machine reboots — plus several reliability and DX fixes.

    -   **Auto-resume Copilot agent widgets.** Captures each widget's Copilot session id via the user-level `~/.copilot/hooks/storyboard-capture.json` hook (installed once on dev-server boot, idempotent). On cold restart, the widget relaunches with `copilot --resume=<id> --agent terminal-agent` so the prior conversation history is restored. Pre-flight UUID + `~/.copilot/session-state/<id>/` check guarantees a clean fresh-session fallback if the captured id is no longer valid (e.g. cleared history, machine swap).
    -   **Hot-pool capture support.** Pool-warmed Copilot sessions also capture their session id via a pool-keyed file; at handoff, terminal-server reads or watches the file (handles the async hook race) and persists it onto the widget config.
    -   **Unified `resumeCommand`** field — single full launch template with `{id}` placeholder (e.g. `"copilot --resume={id} --agent terminal-agent"`). Replaces the previous split of `resumeCommand` (browse) + `resumeArgsTemplate` (auto-resume).
    -   **Cold-path readiness fallback.** Adds a 30s safety timeout to the post-readiness flow so identity / role / broadcast / hub `bindWidget` always run, even when the readiness signal never matches (e.g. Copilot resume mode prints different early output).
    -   **Hide env-export soup.** Cold-path env exports are now wrapped with leading + trailing `clear` so the multi-KB env blob no longer flashes between Enter and the welcome command.
    -   Various smaller fixes: snap component-set width + height to content on resize end; drop `--strictPort` so Vite rolls forward when a port is taken; re-add `/branch--<name>` suffix to deployed-branch link; wire `customerMode` config to actually apply effects; add fixed-port config; replace `devDomain` with `repository.name`.

-   [`c3a42a2`](https://github.com/dfosco/storyboard/commit/c3a42a24ec3fd45a85d39699f03b2498d9c8761f) Thanks [@dfosco](https://github.com/dfosco)! - New `terminal.config.json` + `.storyboard/scaffold/` mechanism — terminal and canvas-agent config now live in their own dedicated, optional file with full library defaults available as a living reference.

    -   **New file: `terminal.config.json`** (project root). Owns `terminal` widget settings and the `agents` map (copilot/claude/codex). The library ships defaults at `node_modules/@dfosco/storyboard/terminal.config.json`. Most users won't need to create the file at all — defaults already cover Copilot/Claude/Codex with auto-resume.
    -   **Auto-scaffolded `.storyboard/scaffold/`** — on every dev-server boot, the data plugin syncs `.storyboard/scaffold/` with copies of every library config file (terminal, toolbar, commandpalette, paste, widgets) plus a README. Server NEVER reads from this directory; it's pure copy-source for customizations. Always overwritten so users get up-to-date references on every version bump.
    -   **Leaf-level merge** preserved: only the specific keys you set are overridden, everything else inherits library defaults — so future agent additions or readinessSignal tweaks reach you automatically.
    -   **Legacy back-compat**: existing `canvas.terminal` / `canvas.agents` blocks under `storyboard.config.json` continue to work; `terminal.config.json` wins on overlap with a warning logged.
    -   **Graceful resume fallback**: when a captured sessionId passes pre-flight validation but the agent CLI rejects it at runtime (corrupt session, etc.), the launch command falls through to a fresh session via shell `||` chain.

### Patch Changes

-   [`f9a99a0`](https://github.com/dfosco/storyboard/commit/f9a99a085d816d4b13f5fe4ac99300d842d48044) Thanks [@dfosco](https://github.com/dfosco)! - fix(build): include dist/runtime/ in published tarball

    alpha.21 was published without `dist/runtime/`, so consumers hit
    `Cannot find module '.../dist/runtime/client/index.js'` as soon as the
    CLI tried to talk to the runtime daemon. `prepublishOnly` now also
    runs `build:runtime`.

-   [`824aa8b`](https://github.com/dfosco/storyboard/commit/824aa8b5732caa83cd3aad914286d0b5b959d07d) Thanks [@dfosco](https://github.com/dfosco)! - Test suite cleanup — full suite green (100/100 files, 1395/1395 tests)

    -   Guard `import.meta.hot.off` calls (Vite 5+) so older test mocks don't crash unmount cleanup
    -   Update multi-delete test to match current per-widget removeWidget impl
    -   Drop three test files that were broken since 0.5.0's package unification (mocked nonexistent exports / imported functions that never landed)

-   [`5f4e398`](https://github.com/dfosco/storyboard/commit/5f4e398fc8133a36e3c479a8454d37d19e9ab00f) Thanks [@dfosco](https://github.com/dfosco)! - fix(dev): allow explicit `devDomain: "storyboard"`

    The runtime's FORBIDDEN_DEFAULT_DOMAIN guard was rejecting projects that legitimately picked "storyboard" as their devDomain (e.g. the canonical storyboard repo). The CLI now passes `allowDefaultDomain=true` when the field is explicitly set in `storyboard.config.json`. The guard still catches missing fields with a helpful suggestion.

-   [`0b0cabb`](https://github.com/dfosco/storyboard/commit/0b0cabb47f06af75083bacf8a37ca51244925e1b) Thanks [@dfosco](https://github.com/dfosco)! - fix(runtime): correct daemon binary path + drop legacy setup proxy calls

    `RuntimeClient.spawnDaemon` was looking for `bin/runtime.js` (which doesn't exist; the real file is `bin/storyboard-runtime.js`) and was off by one `..` in the resolve path. With `stdio: 'ignore'` no error surfaced — health polling just timed out at 5s. `sb setup` was also calling the deprecated `generateCaddyfile`/`reloadCaddy` stubs (visible as "deprecated" warnings in the output). Both fixed.

-   [`cceb015`](https://github.com/dfosco/storyboard/commit/cceb015158bbfd9dc2f45bb9fb883b84deb5b15e) Thanks [@dfosco](https://github.com/dfosco)! - fix(runtime): set Origin header on Caddy admin API requests

    Caddy v2.11+ rejects Node fetch() requests with HTTP 403 unless Origin matches an allowed origin. The runtime daemon's CaddyAdminClient was sending no Origin, so every admin call failed silently — `caddyReachable` was always false, no proxy routes were ever pushed, and consumers got a white-screen-of-death because Caddy answered with empty 200 responses (no upstream configured for the host).

-   [`9bb7cf3`](https://github.com/dfosco/storyboard/commit/9bb7cf36d4f6476cad4287097a7ce4851d21f1b8) Thanks [@dfosco](https://github.com/dfosco)! - Fix three canvas/toolbar issues found in 0.5.0-alpha.28.

    -   fix(artifact): canvas creation now writes a proper `canvas_created` event so dot grid, title, and other settings render on canvases created via the Workshop / Viewfinder.
    -   fix(branch-bar): default dev domain label to the project directory name when no devDomain is configured.
    -   fix(toolbar): use the `sync` icon (instead of an unresolvable `iconoir/view-grid`) for the cycle-layout action so the button renders an icon instead of fallback text.

-   [`4380074`](https://github.com/dfosco/storyboard/commit/4380074067f3d0e95084c0ec6005dcf8a37805d7) Thanks [@dfosco](https://github.com/dfosco)! - Polish across CLI, canvas, and widgets.

    -   Every fullscreen/split-screen widget view now persists to the URL hash (deep-linkable)
    -   AgentsReadyTrigger uses the agents icon and swaps to a spinner while agents are working
    -   Canvas: new "refresh frame" action; component menu simplified; canvas-add labels stories as "Component" and auto-picks component-set for multi-export stories
    -   BranchBar: shows the actual project devDomain in worktrees (not the branch name twice) with a stable font-size
    -   CLI: `sb run` reliably starts the runtime daemon; agent-signal retries transient 404/5xx; spinner messages no longer render double ellipsis
    -   Workshop: ArtifactForm flash for unknown types is now a warning, not danger; prototype form sends 'partial' instead of 'recipe'
    -   Component sets: cells fill the widget and respect user resize / cell content size

-   [`96fea47`](https://github.com/dfosco/storyboard/commit/96fea479fe096330f07cb1fde9b94a5ea20ff9af) Thanks [@dfosco](https://github.com/dfosco)! - Fix workspace list staying stale after canvas removal — viewfinder now refreshes when the canvas index changes via HMR.

-   [`f1692b7`](https://github.com/dfosco/storyboard/commit/f1692b73f0a35c3bd0f326b010c5d16eb86854ee) Thanks [@dfosco](https://github.com/dfosco)! - Fix lint config to include packages/storyboard/bin under Node globals (unblocks publish CI).

-   [`9679052`](https://github.com/dfosco/storyboard/commit/96790525029bd6d2b2ead0fd57870218c9bd0cb5) Thanks [@dfosco](https://github.com/dfosco)! - Hot-pool leak fix and Agents-ready zoom

    -   fix(hot-pool): canvas widget POST and batch create-widget no longer leak warm pool slots — `peek()` probes webgl-readiness without claiming
    -   feat(canvas): clicking "Agents ready" now zooms to at least 100% before panning to the next done agent

-   [`781352c`](https://github.com/dfosco/storyboard/commit/781352cb962bc662571216524d90e24b4d7cfc7b) Thanks [@dfosco](https://github.com/dfosco)! - Fix deletion rollbacks on canvas

    -   fix(canvas): don't re-add locally deleted widgets via HMR merge — pending deletions are tracked and skipped during reconcile, eliminating the visible rollback when deleting multiple widgets in quick succession

-   [`859a4d6`](https://github.com/dfosco/storyboard/commit/859a4d6e36071a9b40fd30e5008cf796aaa5a8d3) Thanks [@dfosco](https://github.com/dfosco)! - Terminal font-loading fix

    -   fix(terminal): await `document.fonts.ready` before initializing the ghostty atlas, so glyphs render with correct metrics instead of falling back when web fonts swap in

-   [`e6e4473`](https://github.com/dfosco/storyboard/commit/e6e44738fa53da0fb867925d2b21e76a30474b8c) Thanks [@dfosco](https://github.com/dfosco)! - Fix agent spawn PATH and tidy hub UI.

    -   Fix `command not found: claude` (and other shim-installed agent CLIs) when launching agents from terminal widgets — agent spawn now uses `zsh -ilc` so `~/.zshrc` is sourced.
    -   Hide the Hub role selector on terminal/agent widgets when there are no connected terminal/agent peers.
    -   Add regression guard test for the agent spawn shell flags.

-   [`57d7d72`](https://github.com/dfosco/storyboard/commit/57d7d720f570ff3f1df9dc53026d0207c4b60185) Thanks [@dfosco](https://github.com/dfosco)! - Story/StorySet immersive expand + inspector precision.

    -   Alt + click the expand button on Story and StorySet widgets to open in immersive fullscreen (no chrome). Plain click still opens the modal variant.
    -   Inspector now uses the clicked element's `_debugSource` for jump-to-line, so it lands on the exact JSX line you clicked instead of the enclosing component definition. Also fixes a scroll-to-line offset bug in the inspector code panel.

-   [`8566814`](https://github.com/dfosco/storyboard/commit/8566814e2eb4ff13d55d59f75d35d952db15c478) Thanks [@dfosco](https://github.com/dfosco)! - Fix 404 after renaming or duplicating canvas pages.

    -   Canvas route map now reads `canvases` live (mirrors the existing story-route pattern), so HMR rename/duplicate are reflected without a stale-snapshot 404.
    -   Canvas route detection and page-selector siblings re-evaluate on `storyboard:canvas-index-changed`.
    -   PageSelector navigates immediately on rename/duplicate/create instead of waiting for a `vite:beforeFullReload` event that never fires for canvas HMR. Rename also updates the page list optimistically.

-   [`df7e498`](https://github.com/dfosco/storyboard/commit/df7e498ecabeb849e5ab33642c3678193202616f) Thanks [@dfosco](https://github.com/dfosco)! - Fix lint errors blocking the beta.39 publish (no functional change).

-   [`70ff181`](https://github.com/dfosco/storyboard/commit/70ff1814da524d874251a63ed2280cb60d842406) Thanks [@dfosco](https://github.com/dfosco)! - Jumping to a ready agent (via the "Agents ready" toolbar button) now pans instantly instead of smooth-scrolling. The smooth animation combined with a mid-scroll zoom change felt sluggish and dizzying.

-   [`18c45cb`](https://github.com/dfosco/storyboard/commit/18c45cbeebde2eafbfe2b6d8048f7a9bcc5eb96b) Thanks [@dfosco](https://github.com/dfosco)! - **feat(data): tilde-prefixed canvases & prototypes are now dev-only, not hidden.** `~name.canvas.jsonl`, `~ProtoName/` folders, and `~name.{flow,object,record,prototype,folder}.json` files are loaded by the dev server (visible in viewfinder, accessible via routes) but excluded from `npm run build`. They're also added to `.gitignore` by `npx storyboard setup` so they don't get committed. Use this for local-only experiments and scratch canvases that you don't want to push.

-   [`47421f4`](https://github.com/dfosco/storyboard/commit/47421f428d0c41deecc128637d367f43f0c04814) Thanks [@dfosco](https://github.com/dfosco)! - **feat(prototype): wire template/recipe picker into Viewfinder + Command Palette create forms.** Both the simple Viewfinder modal and the schema-driven Command Palette dialog now fetch `/_storyboard/workshop/prototypes` and render an optgrouped Template/Recipe select alongside the existing fields. The artifact endpoint (`POST /_storyboard/artifact/`) now honors `partial` for prototypes — previously it was silently ignored, so only the Workshop sidebar form could actually create a templated prototype. The Workshop form's UI is unchanged.

-   [`18d683c`](https://github.com/dfosco/storyboard/commit/18d683c2a27d4f085d14939beb4aebcd011e3708) Thanks [@dfosco](https://github.com/dfosco)! - **feat(artifact-form): basic/advanced field tiers with a collapsible toggle.** The Command Palette / `ArtifactForm` create dialog now shows only essential fields by default (name, title, description, URL, template/recipe for prototypes) and tucks the rest behind a "+ Advanced fields" toggle. Each field in `artifactSchemas.js` is annotated `tier: 'basic' | 'advanced'`; fields without `tier` default to basic for back-compat. Validation still runs against all fields regardless of visibility.

-   [`c48ec7e`](https://github.com/dfosco/storyboard/commit/c48ec7ec72805e602c5e71f330e25fd581b11346) Thanks [@dfosco](https://github.com/dfosco)! - Preserve runtime daemon when starting a second `sb dev` from a repo with a different installed `@dfosco/storyboard` version.

    -   Fix: `RuntimeClient.health()` no longer SIGTERMs the shared daemon on version mismatch when other dev servers are active. Multi-repo coexistence is the whole point of the daemon — killing it tore down every Vite child it owned, including unrelated repos.

-   [`b878aa5`](https://github.com/dfosco/storyboard/commit/b878aa5effa3607e7614724ba82744ff352629ed) Thanks [@dfosco](https://github.com/dfosco)! - Hide the branch switcher in local dev, surface a clear error when Octicon is imported from @primer/react, and require agents to load connected widgets into context on every prompt.

    -   Viewfinder no longer shows the branch switcher in local dev
    -   Importing `Octicon` from `@primer/react` now throws an explicit error pointing at `@primer/octicons-react`
    -   Agents must read `.storyboard/terminals/$STORYBOARD_WIDGET_ID.json` and treat `connectedWidgets[]` as always-on, per-turn context

-   [`12d01ea`](https://github.com/dfosco/storyboard/commit/12d01ea5e0cc75db176f12191007ac6175969cde) Thanks [@dfosco](https://github.com/dfosco)! - Fix prompt widget getting stuck on "pending" when the agent-status WS event is missed (background tab, page navigation, HMR reconnect, page reload). PromptWidget now polls the persisted agent status from `.storyboard/terminals/{id}.json` on mount and every 5s while pending, applying terminal states (done/error/cancelled) as a safety net behind the live WS event.

-   [`58e5a47`](https://github.com/dfosco/storyboard/commit/58e5a479fd9263affa52367992f1e9c63089960b) Thanks [@dfosco](https://github.com/dfosco)! - Fix prompt widget stuck on "Processing…" when its canvas-page id contains a slash (nested canvas, e.g. `folder/page`). PromptWidget now resolves the full canvas id from the canvas bridge state, includes `canvasId` on the status poll URL, and the `/agent/status` server handler falls back to the widget-id-named symlink so a missing or stale `canvasId` no longer hides the persisted `done` status. Newly-spawned prompts also persist the correct nested `canvasId`.

-   [`d7133f6`](https://github.com/dfosco/storyboard/commit/d7133f6843ae36098ccef4dae1f71df53c2898d5) Thanks [@dfosco](https://github.com/dfosco)! - Pre-bundle @primer/react and react-compiler-runtime in Vite optimizeDeps so the CJS named export `c` resolves correctly in the browser (fixes "does not provide an export named 'c'" runtime error in consumer apps).

-   [`d7133f6`](https://github.com/dfosco/storyboard/commit/d7133f6843ae36098ccef4dae1f71df53c2898d5) Thanks [@dfosco](https://github.com/dfosco)! - Pre-bundle @primer/react and react-compiler-runtime in Vite optimizeDeps so the CJS named export `c` resolves correctly in consumer browsers (fixes "does not provide an export named 'c'" runtime error).

-   [`23ccaaa`](https://github.com/dfosco/storyboard/commit/23ccaaad202b5cfa3b6ebcb6accfef0aa3dc2cff) Thanks [@dfosco](https://github.com/dfosco)! - - data-plugin: ignore nested `worktrees/**` directories (in addition to `.worktrees/**`) so git worktrees inside the project root no longer cause "Duplicate object" build errors

    -   dev CLI: surface vite stderr when the dev server exits before becoming ready, instead of swallowing it behind a generic "exited (code 1)" message

-   [`87e4add`](https://github.com/dfosco/storyboard/commit/87e4addd90127cdf736b0c5d6911f02d7d28669d) Thanks [@dfosco](https://github.com/dfosco)! - Pre-bundle `react-is` so @primer/react's named imports resolve correctly in consumer apps.

-   [`8fed9f7`](https://github.com/dfosco/storyboard/commit/8fed9f7ac07b01ce423c7b5901ccbbf1ae76f002) Thanks [@dfosco](https://github.com/dfosco)! - Claude Code session capture + auto-resume (parity with Copilot from beta.1) and CI lint fixes.

    -   **Claude Code auto-resume.** Mirror the Copilot capture mechanism: install a `SessionStart` hook in `~/.claude/settings.json` (merged into existing settings, marked with `# storyboard-capture` for idempotent replace) that writes the captured session id to `<root>/.storyboard/agent-sessions/<widgetId>.session-id` using `STORYBOARD_WIDGET_ID` and `STORYBOARD_PROJECT_ROOT` from env. Shared bash script handles both `sessionId` (Copilot) and `session_id` (Claude) payload shapes. Pre-flight resume validation supports per-project session dirs via the new `sessionStateGlob` agent-config option (Claude pattern: `~/.claude/projects/*/{id}.jsonl`).
    -   **storyboard.config.json defaults** for Claude updated: `resumeCommand` is now `claude --resume {id} --agent terminal-agent --dangerously-skip-permissions`, `sessionIdEnv: "CLAUDE_SESSION_ID"`, `sessionStateGlob: "~/.claude/projects/*/{id}.jsonl"`.
    -   Fix CI lint errors in `RadialMenu` (unused vars) that were blocking the publish workflow.

-   [`ca6e156`](https://github.com/dfosco/storyboard/commit/ca6e1569a335614587492db10623c06e298ed659) Thanks [@dfosco](https://github.com/dfosco)! - Codex CLI session capture + auto-resume — round out the auto-resume trio (Copilot + Claude + Codex).

    -   `ensureCodexCaptureHookInstalled()` writes a `SessionStart` hook to `~/.codex/hooks.json` using the same shared capture script. Codex's hook format is JSON like Claude's; payload uses `session_id` (already handled).
    -   Codex resume syntax is a subcommand: `resumeCommand: "codex resume {id}"`.
    -   Codex sessions are nested under `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<id>.jsonl`. `isResumableSessionId` now supports a recursive `**` glob form (uses `find -name -print -quit` under the hood) for `sessionStateGlob`.
    -   `terminal-server` boot installs all three hooks (Copilot, Claude, Codex).
    -   One-time trust prompt: Codex requires non-managed hooks to be approved via `/hooks` UI on first run. Documented in the migrate skill.

-   [`c051b37`](https://github.com/dfosco/storyboard/commit/c051b37021f3e51edf7c0ce31596b0c7f93f5c34) Thanks [@dfosco](https://github.com/dfosco)! - Scaffold now includes `canvas.agents` defaults so freshly-scaffolded projects get Copilot/Claude/Codex auto-resume wiring out of the box (with `resumeCommand` + `{id}`, `sessionIdEnv`, `sessionStateGlob`). Existing projects still migrate via the migrate skill.

-   Fix `npx storyboard setup` blockers on fresh machines.

    -   Animate install spinners — previously `npm install` and brew installs ran via `execSync`, which blocked Node's event loop and prevented the `@clack` spinner from ever appearing, making setup look stuck.
    -   Add network probe (HEAD against `api.github.com`) that warns up front when GitHub is unreachable (VPN/proxy/DNS).
    -   Install `tmux` automatically (required for headless agent sessions).
    -   Run `gh auth status` after installing `gh` — prompt the user to `gh auth login` when not authed.
    -   Tell users that Copilot CLI auth is separate from `gh` — they must run `copilot` then `/login`.
    -   Drop dead Caddy plumbing (Caddy was removed in 0.6).

-   [`f4a50eb`](https://github.com/dfosco/storyboard/commit/f4a50eb83bec7b70f9ca57b67482da9487155235) Thanks [@dfosco](https://github.com/dfosco)! - Exclude tilde-prefixed (`~name.canvas.jsonl`) canvas files from generated routes and workspace listings, matching the existing private-file convention used for directory walking.

## 0.6.0-beta.5

### Minor Changes

-   New `terminal.config.json` + `.storyboard/scaffold/` mechanism — terminal and canvas-agent config now live in their own dedicated, optional file with full library defaults available as a living reference.

    -   **New file: `terminal.config.json`** (project root). Owns `terminal` widget settings and the `agents` map (copilot/claude/codex). The library ships defaults at `node_modules/@dfosco/storyboard/terminal.config.json`. Most users won't need to create the file at all — defaults already cover Copilot/Claude/Codex with auto-resume.
    -   **Auto-scaffolded `.storyboard/scaffold/`** — on every dev-server boot, the data plugin syncs `.storyboard/scaffold/` with copies of every library config file (terminal, toolbar, commandpalette, paste, widgets) plus a README. Server NEVER reads from this directory; it's pure copy-source for customizations. Always overwritten so users get up-to-date references on every version bump.
    -   **Leaf-level merge** preserved: only the specific keys you set are overridden, everything else inherits library defaults — so future agent additions or readinessSignal tweaks reach you automatically.
    -   **Legacy back-compat**: existing `canvas.terminal` / `canvas.agents` blocks under `storyboard.config.json` continue to work; `terminal.config.json` wins on overlap with a warning logged.
    -   **Graceful resume fallback**: when a captured sessionId passes pre-flight validation but the agent CLI rejects it at runtime (corrupt session, etc.), the launch command falls through to a fresh session via shell `||` chain.

## 0.6.0-beta.4

### Patch Changes

-   Scaffold now includes `canvas.agents` defaults so freshly-scaffolded projects get Copilot/Claude/Codex auto-resume wiring out of the box (with `resumeCommand` + `{id}`, `sessionIdEnv`, `sessionStateGlob`). Existing projects still migrate via the migrate skill.

## 0.6.0-beta.3

### Patch Changes

-   Codex CLI session capture + auto-resume — round out the auto-resume trio (Copilot + Claude + Codex).

    -   `ensureCodexCaptureHookInstalled()` writes a `SessionStart` hook to `~/.codex/hooks.json` using the same shared capture script. Codex's hook format is JSON like Claude's; payload uses `session_id` (already handled).
    -   Codex resume syntax is a subcommand: `resumeCommand: "codex resume {id}"`.
    -   Codex sessions are nested under `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<id>.jsonl`. `isResumableSessionId` now supports a recursive `**` glob form (uses `find -name -print -quit` under the hood) for `sessionStateGlob`.
    -   `terminal-server` boot installs all three hooks (Copilot, Claude, Codex).
    -   One-time trust prompt: Codex requires non-managed hooks to be approved via `/hooks` UI on first run. Documented in the migrate skill.

## 0.6.0-beta.2

### Patch Changes

-   Claude Code session capture + auto-resume (parity with Copilot from beta.1) and CI lint fixes.

    -   **Claude Code auto-resume.** Mirror the Copilot capture mechanism: install a `SessionStart` hook in `~/.claude/settings.json` (merged into existing settings, marked with `# storyboard-capture` for idempotent replace) that writes the captured session id to `<root>/.storyboard/agent-sessions/<widgetId>.session-id` using `STORYBOARD_WIDGET_ID` and `STORYBOARD_PROJECT_ROOT` from env. Shared bash script handles both `sessionId` (Copilot) and `session_id` (Claude) payload shapes. Pre-flight resume validation supports per-project session dirs via the new `sessionStateGlob` agent-config option (Claude pattern: `~/.claude/projects/*/{id}.jsonl`).
    -   **storyboard.config.json defaults** for Claude updated: `resumeCommand` is now `claude --resume {id} --agent terminal-agent --dangerously-skip-permissions`, `sessionIdEnv: "CLAUDE_SESSION_ID"`, `sessionStateGlob: "~/.claude/projects/*/{id}.jsonl"`.
    -   Fix CI lint errors in `RadialMenu` (unused vars) that were blocking the publish workflow.

## 0.6.0-beta.1

### Minor Changes

-   Auto-resume Copilot CLI agent widgets across `tmux kill-server`, dev-server restarts, and machine reboots — plus several reliability and DX fixes.

    -   **Auto-resume Copilot agent widgets.** Captures each widget's Copilot session id via the user-level `~/.copilot/hooks/storyboard-capture.json` hook (installed once on dev-server boot, idempotent). On cold restart, the widget relaunches with `copilot --resume=<id> --agent terminal-agent` so the prior conversation history is restored. Pre-flight UUID + `~/.copilot/session-state/<id>/` check guarantees a clean fresh-session fallback if the captured id is no longer valid (e.g. cleared history, machine swap).
    -   **Hot-pool capture support.** Pool-warmed Copilot sessions also capture their session id via a pool-keyed file; at handoff, terminal-server reads or watches the file (handles the async hook race) and persists it onto the widget config.
    -   **Unified `resumeCommand`** field — single full launch template with `{id}` placeholder (e.g. `"copilot --resume={id} --agent terminal-agent"`). Replaces the previous split of `resumeCommand` (browse) + `resumeArgsTemplate` (auto-resume).
    -   **Cold-path readiness fallback.** Adds a 30s safety timeout to the post-readiness flow so identity / role / broadcast / hub `bindWidget` always run, even when the readiness signal never matches (e.g. Copilot resume mode prints different early output).
    -   **Hide env-export soup.** Cold-path env exports are now wrapped with leading + trailing `clear` so the multi-KB env blob no longer flashes between Enter and the welcome command.
    -   Various smaller fixes: snap component-set width + height to content on resize end; drop `--strictPort` so Vite rolls forward when a port is taken; re-add `/branch--<name>` suffix to deployed-branch link; wire `customerMode` config to actually apply effects; add fixed-port config; replace `devDomain` with `repository.name`.

## 0.6.0-beta.0

### Minor Changes

-   0.6.0 simplifies the dev-server stack and tightens agent workflows.

-   Simplified server stack: removed Caddy, runtime daemon, and persistent server in favor of plain per-worktree Vite dev servers.
-   Multi-worktree dev servers restored without a daemon — each worktree runs its own server independently.
-   App shell stays mounted across HMR and internal navigation, eliminating full-page reloads on most edits.
-   Stopped terminal-driven reload loops by unwatching `.storyboard/` and fixing an Octicon guard self-match in the data plugin.
-   `BranchBar` now reads the current branch from git instead of inferring it from the URL.
-   HMR biased toward React Fast Refresh in `src/{prototypes,components,templates}`.
-   New `tag` prop on command-palette items for fine-grained search ranking, split from visual labels via `index_tags`.
-   Added `.agents/data/primer-octicons.json` (368 valid icon exports) and a regenerator script so agents stop importing icons that don't exist.
-   Role docs: forbid >2s poll sleeps and clarify the cluster-token ordered fan-out for hub conversations.

## 0.5.0-beta.52

### Patch Changes

-   Pre-bundle `react-is` so @primer/react's named imports resolve correctly in consumer apps.

## 0.5.0-beta.51

### Patch Changes

-   [`23ccaaa`](https://github.com/dfosco/storyboard/commit/23ccaaad202b5cfa3b6ebcb6accfef0aa3dc2cff) Thanks [@dfosco](https://github.com/dfosco)! - - data-plugin: ignore nested `worktrees/**` directories (in addition to `.worktrees/**`) so git worktrees inside the project root no longer cause "Duplicate object" build errors
    -   dev CLI: surface vite stderr when the dev server exits before becoming ready, instead of swallowing it behind a generic "exited (code 1)" message

## 0.5.0-beta.50

### Patch Changes

-   Pre-bundle @primer/react and react-compiler-runtime in Vite optimizeDeps so the CJS named export `c` resolves correctly in the browser (fixes "does not provide an export named 'c'" runtime error in consumer apps).

-   Pre-bundle @primer/react and react-compiler-runtime in Vite optimizeDeps so the CJS named export `c` resolves correctly in consumer browsers (fixes "does not provide an export named 'c'" runtime error).

## 0.5.0-beta.49

### Patch Changes

-   Fix prompt widget stuck on "Processing…" when its canvas-page id contains a slash (nested canvas, e.g. `folder/page`). PromptWidget now resolves the full canvas id from the canvas bridge state, includes `canvasId` on the status poll URL, and the `/agent/status` server handler falls back to the widget-id-named symlink so a missing or stale `canvasId` no longer hides the persisted `done` status. Newly-spawned prompts also persist the correct nested `canvasId`.

## 0.5.0-beta.48

### Patch Changes

-   Fix prompt widget getting stuck on "pending" when the agent-status WS event is missed (background tab, page navigation, HMR reconnect, page reload). PromptWidget now polls the persisted agent status from `.storyboard/terminals/{id}.json` on mount and every 5s while pending, applying terminal states (done/error/cancelled) as a safety net behind the live WS event.

## 0.5.0-beta.47

### Patch Changes

-   Hide the branch switcher in local dev, surface a clear error when Octicon is imported from @primer/react, and require agents to load connected widgets into context on every prompt.

    -   Viewfinder no longer shows the branch switcher in local dev
    -   Importing `Octicon` from `@primer/react` now throws an explicit error pointing at `@primer/octicons-react`
    -   Agents must read `.storyboard/terminals/$STORYBOARD_WIDGET_ID.json` and treat `connectedWidgets[]` as always-on, per-turn context

## 0.5.0-beta.46

### Patch Changes

-   Preserve runtime daemon when starting a second `sb dev` from a repo with a different installed `@dfosco/storyboard` version.

    -   Fix: `RuntimeClient.health()` no longer SIGTERMs the shared daemon on version mismatch when other dev servers are active. Multi-repo coexistence is the whole point of the daemon — killing it tore down every Vite child it owned, including unrelated repos.

## 0.5.0-beta.45

### Patch Changes

-   **feat(artifact-form): basic/advanced field tiers with a collapsible toggle.** The Command Palette / `ArtifactForm` create dialog now shows only essential fields by default (name, title, description, URL, template/recipe for prototypes) and tucks the rest behind a "+ Advanced fields" toggle. Each field in `artifactSchemas.js` is annotated `tier: 'basic' | 'advanced'`; fields without `tier` default to basic for back-compat. Validation still runs against all fields regardless of visibility.

## 0.5.0-beta.44

### Patch Changes

-   **feat(prototype): wire template/recipe picker into Viewfinder + Command Palette create forms.** Both the simple Viewfinder modal and the schema-driven Command Palette dialog now fetch `/_storyboard/workshop/prototypes` and render an optgrouped Template/Recipe select alongside the existing fields. The artifact endpoint (`POST /_storyboard/artifact/`) now honors `partial` for prototypes — previously it was silently ignored, so only the Workshop sidebar form could actually create a templated prototype. The Workshop form's UI is unchanged.

## 0.5.0-beta.43

### Patch Changes

-   **feat(data): tilde-prefixed canvases & prototypes are now dev-only, not hidden.** `~name.canvas.jsonl`, `~ProtoName/` folders, and `~name.{flow,object,record,prototype,folder}.json` files are loaded by the dev server (visible in viewfinder, accessible via routes) but excluded from `npm run build`. They're also added to `.gitignore` by `npx storyboard setup` so they don't get committed. Use this for local-only experiments and scratch canvases that you don't want to push.

## 0.5.0-beta.42

### Minor Changes

-   Runtime hardening + simplification, plus a one-shot upgrade tool.

    -   **fix(runtime):** evict reused ports from sibling devDomain routes — fixes the "Wrong domain (421 Misdirected)" page that appeared on one server when a second `sb run` reused its port under a different devDomain.
    -   **refactor(runtime):** trim the daemon (~435 lines deleted). HotPool removed, lease TTL/`/devserver/renew` removed, FSM simplified to `spawning → ready → stopped`, `dev.js`'s worktree-conversion prompt deleted.
    -   **feat(cli):** `sb dev` is now an alias for `sb run` (proxy + runtime + dev). One command for new users.
    -   **feat(cli):** new `sb reset` command nukes the daemon, clears Caddy routes (including pre-runtime Caddyfile-reload leftovers), kills orphan `vite` processes, and respawns a fresh daemon. Use after upgrading from `main`.
    -   **feat(runtime):** `acquire()` now force-checks daemon version before binding, so `sb run` always respawns a stale daemon after a package upgrade.
    -   **fix(inspector):** scroll the restored `?inspect=` selection into the viewport before pinning the highlight.
    -   **docs(readme):** document the upgrade path for users coming from pre-0.5.0.

## 0.5.0-beta.41

### Patch Changes

-   Jumping to a ready agent (via the "Agents ready" toolbar button) now pans instantly instead of smooth-scrolling. The smooth animation combined with a mid-scroll zoom change felt sluggish and dizzying.

## 0.5.0-beta.40

### Patch Changes

-   Fix lint errors blocking the beta.39 publish (no functional change).

## 0.5.0-beta.39

### Patch Changes

-   Fix 404 after renaming or duplicating canvas pages.

    -   Canvas route map now reads `canvases` live (mirrors the existing story-route pattern), so HMR rename/duplicate are reflected without a stale-snapshot 404.
    -   Canvas route detection and page-selector siblings re-evaluate on `storyboard:canvas-index-changed`.
    -   PageSelector navigates immediately on rename/duplicate/create instead of waiting for a `vite:beforeFullReload` event that never fires for canvas HMR. Rename also updates the page list optimistically.

## 0.5.0-beta.38

### Patch Changes

-   Story/StorySet immersive expand + inspector precision.

    -   Alt + click the expand button on Story and StorySet widgets to open in immersive fullscreen (no chrome). Plain click still opens the modal variant.
    -   Inspector now uses the clicked element's `_debugSource` for jump-to-line, so it lands on the exact JSX line you clicked instead of the enclosing component definition. Also fixes a scroll-to-line offset bug in the inspector code panel.

## 0.5.0-beta.37

### Patch Changes

-   Fix agent spawn PATH and tidy hub UI.

    -   Fix `command not found: claude` (and other shim-installed agent CLIs) when launching agents from terminal widgets — agent spawn now uses `zsh -ilc` so `~/.zshrc` is sourced.
    -   Hide the Hub role selector on terminal/agent widgets when there are no connected terminal/agent peers.
    -   Add regression guard test for the agent spawn shell flags.

## 0.5.0-beta.36

### Patch Changes

-   Terminal font-loading fix

    -   fix(terminal): await `document.fonts.ready` before initializing the ghostty atlas, so glyphs render with correct metrics instead of falling back when web fonts swap in

## 0.5.0-beta.35

### Patch Changes

-   Fix deletion rollbacks on canvas

    -   fix(canvas): don't re-add locally deleted widgets via HMR merge — pending deletions are tracked and skipped during reconcile, eliminating the visible rollback when deleting multiple widgets in quick succession

## 0.5.0-beta.34

### Patch Changes

-   Hot-pool leak fix and Agents-ready zoom

    -   fix(hot-pool): canvas widget POST and batch create-widget no longer leak warm pool slots — `peek()` probes webgl-readiness without claiming
    -   feat(canvas): clicking "Agents ready" now zooms to at least 100% before panning to the next done agent

## 0.5.0-beta.33

### Patch Changes

-   Exclude tilde-prefixed (`~name.canvas.jsonl`) canvas files from generated routes and workspace listings, matching the existing private-file convention used for directory walking.

## 0.5.0-beta.32

### Patch Changes

-   Fix lint config to include packages/storyboard/bin under Node globals (unblocks publish CI).

## 0.5.0-beta.31

### Patch Changes

-   Fix workspace list staying stale after canvas removal — viewfinder now refreshes when the canvas index changes via HMR.

## 0.5.0-alpha.30

### Patch Changes

-   Polish across CLI, canvas, and widgets.

    -   Every fullscreen/split-screen widget view now persists to the URL hash (deep-linkable)
    -   AgentsReadyTrigger uses the agents icon and swaps to a spinner while agents are working
    -   Canvas: new "refresh frame" action; component menu simplified; canvas-add labels stories as "Component" and auto-picks component-set for multi-export stories
    -   BranchBar: shows the actual project devDomain in worktrees (not the branch name twice) with a stable font-size
    -   CLI: `sb run` reliably starts the runtime daemon; agent-signal retries transient 404/5xx; spinner messages no longer render double ellipsis
    -   Workshop: ArtifactForm flash for unknown types is now a warning, not danger; prototype form sends 'partial' instead of 'recipe'
    -   Component sets: cells fill the widget and respect user resize / cell content size

## 0.5.0-alpha.29

### Patch Changes

-   Fix three canvas/toolbar issues found in 0.5.0-alpha.28.

    -   fix(artifact): canvas creation now writes a proper `canvas_created` event so dot grid, title, and other settings render on canvases created via the Workshop / Viewfinder.
    -   fix(branch-bar): default dev domain label to the project directory name when no devDomain is configured.
    -   fix(toolbar): use the `sync` icon (instead of an unresolvable `iconoir/view-grid`) for the cycle-layout action so the button renders an icon instead of fallback text.

## 0.5.0-alpha.28

### Minor Changes

-   Auto-respawn runtime daemon on package version mismatch

    The runtime daemon is a long-lived process shared across worktrees. After upgrading `@dfosco/storyboard`, the in-memory daemon previously kept serving stale code until you ran `sb proxy restart`. Now `RuntimeClient.health()` compares the client's package.json version against the daemon's `/health` response and SIGTERMs + respawns automatically on mismatch. Source-tree dev (`0.0.0`) is exempt.

## 0.5.0-alpha.27

### Patch Changes

-   fix(runtime): set Origin header on Caddy admin API requests

    Caddy v2.11+ rejects Node fetch() requests with HTTP 403 unless Origin matches an allowed origin. The runtime daemon's CaddyAdminClient was sending no Origin, so every admin call failed silently — `caddyReachable` was always false, no proxy routes were ever pushed, and consumers got a white-screen-of-death because Caddy answered with empty 200 responses (no upstream configured for the host).

## 0.5.0-alpha.26

### Patch Changes

-   fix(runtime): correct daemon binary path + drop legacy setup proxy calls

    `RuntimeClient.spawnDaemon` was looking for `bin/runtime.js` (which doesn't exist; the real file is `bin/storyboard-runtime.js`) and was off by one `..` in the resolve path. With `stdio: 'ignore'` no error surfaced — health polling just timed out at 5s. `sb setup` was also calling the deprecated `generateCaddyfile`/`reloadCaddy` stubs (visible as "deprecated" warnings in the output). Both fixed.

## 0.5.0-alpha.25

### Minor Changes

-   Add `sb proxy restart` command

    After upgrading `@dfosco/storyboard`, the long-lived runtime daemon may hold stale code from the previous version, masking CLI fixes that shipped in newer alphas. `sb proxy restart` kills the daemon (via `~/.storyboard/runtime.pid`) and verifies the fresh daemon is healthy. Run this once after every `sb update:alpha`/`update:version` until automatic version-based respawn lands.

## 0.5.0-alpha.24

### Patch Changes

-   fix(dev): allow explicit `devDomain: "storyboard"`

    The runtime's FORBIDDEN_DEFAULT_DOMAIN guard was rejecting projects that legitimately picked "storyboard" as their devDomain (e.g. the canonical storyboard repo). The CLI now passes `allowDefaultDomain=true` when the field is explicitly set in `storyboard.config.json`. The guard still catches missing fields with a helpful suggestion.

## 0.5.0-alpha.23

### Patch Changes

-   Test suite cleanup — full suite green (100/100 files, 1395/1395 tests)

    -   Guard `import.meta.hot.off` calls (Vite 5+) so older test mocks don't crash unmount cleanup
    -   Update multi-delete test to match current per-widget removeWidget impl
    -   Drop three test files that were broken since 0.5.0's package unification (mocked nonexistent exports / imported functions that never landed)

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
