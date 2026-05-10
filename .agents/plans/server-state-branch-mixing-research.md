# Session Handoff: Deep-research storyboard.localhost branch-mixing bug

## Original user request

> Deep-research why `http://storyboard.localhost/branch--0.5.0/branch--dfosco` server/proxy puts me in this impossible state with branches from two different servers/devDomains getting mixed up in the browser URL. Here I was trying to open `storyboard/branch--dfosco` but `storyboard-core/branch--0.5.0` was already running after a long session (with laptop going to sleep). I've tried to fix this bug many times but was never able to. Do a root-cause analysis aided by 5 whys methodology. For each hypothesis for the problem, choose a selection of 1-3 solutions prioritized by likelihood of success. Then implement in worktree `0.5.0--server-state`.

## Mode

Session was started under a **research orchestrator constraint**: only `task` (research subagent), `create`, `view` (temp files only), and `report_intent` are allowed. No bash, grep, glob, web, GitHub MCP, or ask_user. Sync dispatches only.

The implementation step ("Then implement in worktree `0.5.0--server-state`") cannot be executed under the orchestrator constraint — it would need a follow-up session without the constraint, or the user must lift the constraint.

## Output target

Final report should be saved to:
`/Users/dfosco/.copilot/session-state/ffacc6b8-fd12-443c-8086-88f4bb8ceede/research/deep-research-why-http-storyboard-localhost-branch.md`

The parent dir already exists.

## Current state

- Created a research plan with **4 parallel research subagent dispatches** (see below).
- Dispatched all 4 in a single tool batch.
- **The user interrupted the dispatch before any subagent returned results.** All four `task` calls returned `"The execution of this tool, or a previous tool was interrupted."`
- No findings yet. No report written. Worktree `0.5.0--server-state` not created.

## Planned research dispatches (ready to re-issue)

All four were drafted and should be re-dispatched as parallel sync `task` calls with `agent_type: "research"`:

### Dispatch 1 — `caddy-proxy-routing`
Investigate Caddyfile generator, branch-name slugification, port mapping, whether the Caddy registry is shared across repos, Caddyfile reload (overwrite vs append), Vite base-path handling when browser requests `/branch--A/branch--B/...`, and any client code that prepends `BASE_URL` to an already-prefixed path. Search `packages/storyboard/src/cli/`, `packages/core/src/cli/`, `packages/storyboard/src/core/`. Look for `Caddyfile`, `generateCaddyfile`, `proxy`.

### Dispatch 2 — `browser-state-persistence`
Investigate browser-side state that survives across two dev servers sharing the `storyboard.localhost` origin: service workers (top suspect — SW from one repo intercepts the other's requests), localStorage/sessionStorage with branch/path keys, cookies, HMR/Vite WS reconnection after laptop sleep, the URL-hash session system (`subscribeToHash`, `useOverride`), router base-path computation, redirect logic. Search `serviceWorker`, `sw.js`, `workbox`, `localStorage.setItem`, `import.meta.hot`, `BASE_URL`, `branch--`.

### Dispatch 3 — `worktree-port-registry`
Investigate per-worktree port allocation, the proxy state/registry file location (`~/.storyboard/`, repo `.storyboard/`, `/tmp/`), branch-name normalization, whether registry tracks repo identity or only branch name (collision risk if two repos both have branch `main`), Caddyfile overwrite vs append on reload, `VITE_BASE_PATH` plumbing, dev URL construction at startup.

### Dispatch 4 — `router-base-path-bugs`
Find every client-side code path that could produce `/branch--A/branch--B/...`: `@generouted/react-router` setup, `basename`, `createBrowserRouter`, all reads of `import.meta.env.BASE_URL`, every `navigate`/`pushState`/`<Link>` that concatenates BASE_URL with paths, branch-switcher UI, service-worker fetch rewrites. Specifically grep the literal `branch--` across the repo and report each occurrence with context.

## After dispatches return

1. Evaluate findings, identify gaps, possibly dispatch follow-ups (target ≥6 dispatches total, 10+ for thoroughness).
2. Pre-synthesis quality gate: components identified, code fetched (not just READMEs), integration examples, ≥6 dispatches.
3. Synthesize report with:
   - Executive summary
   - **5 Whys analysis** (per user request)
   - Hypotheses, each with 1–3 prioritized candidate solutions
   - Footnoted citations (prefer GitHub HREFs with commit SHA)
   - Mermaid architecture diagrams of proxy + browser-origin flow
   - Confidence assessment
4. Save report to the path above using `create`.
5. Summarize key findings + report path to the user.
6. **Then** (separate phase, not under orchestrator constraint) implement chosen fix in worktree `0.5.0--server-state`.

## Key context for the next session

- Repo: `dfosco/storyboard`. CWD: `/Users/dfosco/workspace/storyboard-core/worktrees/0.5.0`. Repo root is `dfosco/storyboard` per environment_context.
- The user has TWO related project trees: `storyboard` and `storyboard-core` — both apparently produce dev servers under the same `storyboard.localhost` origin via Caddy.
- Observed pathological URL: `http://storyboard.localhost/branch--0.5.0/branch--dfosco`. Two `branch--` segments stacked. User intended to open `storyboard/branch--dfosco` but `storyboard-core/branch--0.5.0` was already running.
- Trigger: long session, laptop sleep, then opening the second repo's worktree URL.
- Relevant memories already loaded: `branch policy` (never switch branches without permission), `worktree creation` rule, AGENTS.md describes Caddy proxy with `storyboard.localhost` and `branch--{name}` pattern, dev URL session-state convention.
