# Terminal & Agent Widget Integration Tests

## Problem

There are zero tests for terminal and agent widget functionality. These are complex, stateful features involving tmux, WebSockets, canvas connectors, and live agent processes (Copilot, Claude). We need integration tests that verify the full pipeline works — from widget creation in the browser through to terminal/agent behavior.

## Approach

**Vitest integration tests** that run against a **live dev server**. Tests use three verification layers:

1. **Canvas HTTP API** — create/read/update/delete widgets and connectors programmatically
2. **tmux commands** — verify terminal sessions exist, capture pane output, send keystrokes
3. **agent-browser CLI** — verify browser rendering (widgets visible, content correct)

Tests are tagged with a custom `integration` pool/filter so they only run when explicitly invoked (they need a running dev server + tmux).

### Test Canvas

Each test run creates a fresh `.canvas.jsonl` file at `src/canvas/__test__-terminal.canvas.jsonl` and cleans it up afterward. This isolates tests from user canvases.

### File Structure

```
packages/core/src/canvas/__tests__/
  terminal-integration.test.js       — terminal widget + shell tests (Group 1)
  agent-integration.test.js          — per-agent: startup, Q&A, context, connected widgets (Groups 2-4)
  helpers/
    canvas-api.js     — HTTP helpers: createWidget, readCanvas, addConnector, etc.
    tmux.js           — tmux helpers: capturePane, sendKeys, listSessions, waitForOutput
    transcript.js     — session transcript recording: stdin/stdout logging, flush to disk
    browser.js        — agent-browser helpers: openCanvas, snapshot, assertVisible
    setup.js          — test canvas creation/teardown, server URL resolution
    perf.js           — performance timing, thresholds, and reporting
```

### npm script

```json
"test:integration": "vitest run --config vitest.integration.config.js"
```

With a `vitest.integration.config.js` that includes only `**/__tests__/*-integration.test.js` files.

---

## Execution Model: Per-Agent Parallelism

**Group 1** (terminal/shell) runs first as a baseline — it validates the core tmux/canvas infrastructure before agents are involved.

**Groups 2–4** run **in parallel per agent**. For each configured agent (Copilot, Claude, etc.), the full lifecycle (startup → Q&A → context awareness → connected widget CRUD) runs as a single sequential chain. But all agent chains run concurrently:

```
Group 1 (terminal/shell) — sequential
  ↓ (once passed)
┌──────────────────────────────────────────────────┐
│  Copilot chain (Groups 2→3→4) — sequential       │
│  Claude chain  (Groups 2→3→4) — sequential        │  ← in parallel
│  [future agent chains...]                         │
└──────────────────────────────────────────────────┘
```

This mirrors real usage — a canvas will have multiple agents running simultaneously. If concurrent tmux sessions cause problems, that's a real bug we want to catch.

Each agent chain gets its own:
- Agent widget (unique ID)
- tmux session (unique `sb-*` name)
- Connected test widgets (unique IDs)
- Browser session name (e.g. `test-copilot`, `test-claude`)

---

## Failure Handling: Non-Blocking with Diagnostics

Test failures — especially agent response assertions — must **not block** the rest of the chain. When a test fails:

1. **Capture full context**: The actual agent output (tmux pane capture), expected pattern, and any browser snapshot are logged to the test report.
2. **Continue execution**: Use `test.soft()` for agent response assertions so failures are recorded but don't abort the describe block. Hard failures (widget creation, tmux session missing) can still abort since they indicate infra problems.
3. **Rich failure output**: On assertion failure, log:
   - The full tmux pane capture (raw text)
   - The expected pattern
   - A timestamp and elapsed time
   - A `[REVIEW]` marker so failures are easy to grep for manual review
4. **False positive awareness**: Agent responses are non-deterministic. A response like "The sky is blue" should pass even if we only matched for the word "blue". Matching is always case-insensitive, substring-based, and can have multiple acceptable patterns.

Example failure output:
```
[REVIEW] T2.7 — Copilot answers a simple question
  Expected: output to match /blue/i
  Actual tmux capture (last 20 lines):
    > What color is the sky during the day? Answer in one word.
    The sky is azure.
  Elapsed: 34.2s
  → Likely false positive — "azure" is a valid answer. Consider adding to accepted patterns.
```

---

## Performance Observability

Every operation is timed. The test suite produces a performance report at the end of each run.

### What gets timed

| Operation | Metric name | Notes |
|-----------|-------------|-------|
| Widget creation (API) | `widget.create` | Should be <500ms |
| Canvas read (API) | `canvas.read` | Should be <500ms |
| Connector add (API) | `connector.add` | Should be <500ms |
| Widget update (API) | `widget.update` | Should be <500ms |
| Widget delete (API) | `widget.delete` | Should be <500ms |
| tmux session start | `tmux.session.start` | Time from widget click to `tmux has-session` success |
| Welcome menu render | `tmux.welcome.render` | Time from session start to menu text visible |
| Agent startup | `agent.{id}.startup` | Time from session start to agent ready prompt |
| Agent response | `agent.{id}.response` | Time from question sent to answer received |
| Browser widget render | `browser.widget.render` | Time from canvas open to widget visible in snapshot |
| Full agent chain | `agent.{id}.full_chain` | Total time for Groups 2→3→4 per agent |

### Reporting

- **Per-test timing**: Each test logs its duration in the vitest output
- **Summary table**: `afterAll` hook prints a table of all timed operations with min/avg/max/p95
- **Threshold warnings**: Operations exceeding expected thresholds emit `[SLOW]` warnings (not failures — no benchmarks yet)
- **JSON report**: Optionally write `test-results/integration-perf.json` for trend tracking

### `perf.js` helper

```js
// Usage in tests:
const timer = perf.start('agent.copilot.startup')
// ... do work ...
timer.end()  // records duration

// In afterAll:
perf.report()  // prints summary table
perf.toJSON()  // returns { metrics: [...] } for file output
```

Initial threshold warnings (informational, not blocking):

| Metric | Warning threshold |
|--------|-------------------|
| API operations | > 1s |
| tmux session start | > 5s |
| Agent startup | > 60s |
| Agent response | > 45s |
| Full agent chain | > 5min |

These thresholds are starting points. Once we have baseline data, we'll tighten them and optionally make them failure criteria.

---

## Terminal Output Recording (Session Transcripts)

**Every tmux operation is recorded, always — pass or fail.** Each test run produces a full transcript per terminal/agent session. This is the primary tool for reviewing what users would actually see in the terminal UX.

### Design principle

The transcript is not a debugging afterthought — it's a **first-class artifact of every test run**. Even when all tests pass, you should be able to open any transcript and audit the full terminal experience: Did the startup sequence look clean? Were there any stray error messages or warnings? Did the agent produce any unexpected output before or after the response?

### How it works

The `transcript.js` helper wraps every tmux interaction:

1. **Every `sendKeys()` call** logs the input with a `[stdin]` label, timestamp, and test ID.
2. **Every `capturePane()` call** diffs against the previous capture and logs only new lines with a `[stdout]` label. The full cumulative pane is also stored for context.
3. **Every `waitForOutput()` call** logs each poll attempt (with interval) and the final match/timeout result.
4. **On test completion** (pass or fail), the full transcript is flushed to `test-results/transcripts/{session-name}-{timestamp}.log`.

The transcript helper is injected into the `tmux.js` module — all tmux operations are recorded transparently without extra code in test files.

### Transcript format

```
=== Session: sb-a1b2c3d4 (Copilot · test-canvas) ===
Started: 2026-04-23T15:00:00Z
Widget ID: agent-xyz789
Canvas: __test__-terminal

--- [T2.2] Agent startup ---
[00:00.0] [stdout] Welcome to Storyboard Terminal
[00:00.0] [stdout] ? Choose a workload:
[00:00.0] [stdout]   ❯ Copilot CLI
[00:00.0] [stdout]     Claude Code  
[00:00.0] [stdout]     Shell
[00:00.0] [stdout]     Browse sessions
[00:01.2] [stdin]  Enter (select Copilot)
[00:01.4] [stdout] Starting Copilot CLI...
[00:14.3] [stdout] Copilot is ready.
[00:14.5] [stdout] /allow-all on
[00:14.5] [stdout] >

--- [T2.4] Agent Q&A ---
[00:14.5] [stdin]  What color is the sky during the day? Answer in one word.
[00:14.5] [stdin]  Enter
[00:48.7] [stdout] > What color is the sky during the day? Answer in one word.
[00:48.7] [stdout] Blue.
[00:48.7] [stdout] >

--- [T3.3] Env var check ---
[01:02.1] [stdin]  echo $STORYBOARD_WIDGET_ID
[01:02.1] [stdin]  Enter
[01:02.4] [stdout] agent-xyz789

=== Session ended: 2026-04-23T15:05:12Z (total: 312.4s) ===
=== Result: 11/12 passed, 1 soft failure (T4.2) ===
```

### What this catches

- **UX issues on success**: Error messages, warnings, stack traces, deprecation notices, or ugly output that don't cause functional failures but shouldn't be shown to users. These are invisible to pass/fail assertions but obvious in the transcript.
- **Startup sequence validation**: The exact sequence of output during agent initialization — did it flash errors? Did the welcome menu render correctly? Was there unexpected output between the menu and the agent prompt?
- **Agent stdin → stdout pipe**: Full record of what was sent into the terminal and what came back. Validates the agent is receiving input cleanly and responding through the expected channel.
- **Stray output detection**: Output that appears between operations (background processes, cron output, tmux messages) is captured and timestamped — easy to spot in review.
- **Regression detection**: Compare transcripts across runs to spot new output. Even if tests pass, a diff between today's transcript and yesterday's reveals changes in the UX.

### File locations

```
test-results/
  transcripts/
    sb-{hash1}-2026-04-23T150000.log    # timestamped per-session transcript
    sb-{hash2}-2026-04-23T150000.log
  integration-perf.json                  # performance metrics
  summary.txt                            # pass/fail summary with transcript paths
```

- `test-results/` is gitignored — these are ephemeral local artifacts
- Transcripts are timestamped so multiple runs don't overwrite each other
- A `--clean-transcripts` flag (or afterAll hook) removes transcripts older than 7 days
- The summary file lists every transcript path so you don't have to hunt for them

### `transcript.js` helper

```js
// Automatically wraps tmux.js — no manual calls needed in tests
createTranscript(sessionName, metadata)  // init transcript for a session
logStdin(sessionName, input, testId)     // record input sent via sendKeys
logStdout(sessionName, output, testId)   // record captured output (auto-diffed)
logEvent(sessionName, event, testId)     // record non-IO events (session start, resize, etc.)
flush(sessionName)                       // write transcript to disk
flushAll()                               // write all open transcripts (called in afterAll)
getTranscript(sessionName)               // return in-memory transcript (for inline assertions)
```

---

## Test Cases

### Group 1: Terminal Widget — Shell Session

**T1.1 — Create terminal widget via API**
- POST a `terminal` widget to the test canvas
- Verify API returns `{ success: true, widget }` with correct type and auto-generated `prettyName`
- Verify widget appears in canvas read (GET)

**T1.2 — Terminal session starts in tmux**
- After widget creation, open the canvas in the browser (agent-browser)
- Click the terminal widget to start the session
- Wait for tmux session to appear (`tmux list-sessions`)
- Verify session name matches expected `sb-*` pattern

**T1.3 — Welcome menu appears**
- Capture tmux pane output
- Verify the welcome menu text is visible (e.g. "Shell", agent labels)

**T1.4 — Select Shell from welcome menu**
- Send keystrokes to select "Shell" option via tmux (`tmux send-keys`)
- Wait for shell prompt to appear

**T1.5 — Run basic shell command**
- Send `echo STORYBOARD_TEST_MARKER` via tmux
- Capture pane output, verify `STORYBOARD_TEST_MARKER` appears
- Verify via agent-browser that the terminal widget in the browser shows the output

**T1.6 — Terminal session appears in session list**
- Call `GET /_storyboard/terminal/sessions`
- Verify the test terminal's session is listed with correct canvas/widget metadata

### Group 2: Agent Widget — Startup & Basic Interaction (per agent)

_Runs in parallel for each configured agent (Copilot, Claude, etc.)_

**T2.1 — Create agent widget via API**
- POST an `agent` widget with the agent's `startupCommand` from config
- Verify widget is created with correct type and props

**T2.2 — Agent starts and loads startup sequence**
- Open canvas in browser, interact with the agent widget
- Verify tmux session starts
- Capture pane output — verify agent startup indicators
- **Validate startup output is clean**: transcript should show the welcome menu → agent selection → agent ready prompt with no error messages, stack traces, or unexpected output between steps
- Time the startup duration (`agent.{id}.startup`)

**T2.3 — Agent terminal output flows correctly**
- After agent is ready, verify the tmux pane contains only expected output (no stray stderr, no broken escape sequences)
- Send a known-output command through the agent (e.g. ask it to run `echo AGENT_IO_CHECK`)
- Verify the command appears in stdin transcript and the output appears in stdout transcript
- This validates the stdin→agent→stdout pipe is clean end-to-end

**T2.4 — Select agent from welcome menu (terminal widget)**
- Create a `terminal` widget (no startup command)
- Open in browser, start session
- Select the agent from welcome menu via tmux keystrokes
- Verify agent starts in tmux pane

**T2.5 — Agent answers a simple question**
- After agent is ready, send via tmux: "What color is the sky during the day? Answer in one word."
- Wait for response (timeout 90s)
- Capture pane output — **soft assert** response matches `/blue|azure|cerulean/i`
- On failure: log full pane capture with `[REVIEW]` marker
- Verify response is visible in browser via agent-browser snapshot
- Time the response duration (`agent.{id}.response`)

### Group 3: Agent Context Awareness (per agent)

_Continues in the same agent session from Group 2_

**T3.1 — Terminal config exists and is valid**
- Read the agent's terminal config from `.storyboard/terminals/{hash}.json`
- Verify config contains: `canvasId`, `widgetId`, `displayName`, `branch`, `serverUrl`

**T3.2 — Agent can identify itself**
- Ask: "Read your terminal config and tell me your widget ID, canvas ID, display name, and which canvas page you're on."
- Capture response — **soft assert** it contains the correct widget ID, canvas ID, and display name
- On failure: log full response with `[REVIEW]` marker and the expected values

**T3.3 — Environment variables are injected**
- In the agent's tmux session: send `echo $STORYBOARD_WIDGET_ID`
- Capture output, verify it matches the widget ID
- Repeat for `STORYBOARD_CANVAS_ID`, `STORYBOARD_BRANCH`, `STORYBOARD_SERVER_URL`

### Group 4: Connected Widget — CRUD via Agent (per agent)

_Continues in the same agent session from Group 3_

**T4.1 — Create sticky note and connect to agent**
- POST a `sticky-note` widget with `{ text: "banana", color: "yellow" }`
- POST a connector: sticky-note → agent widget
- Verify connector is created (canvas read shows connector)
- Verify agent's terminal config `connectedWidgets` includes the sticky note

**T4.2 — Agent sees connected widget**
- Ask: "What widgets are connected to you? Tell me the widget type and its text content."
- **Soft assert** response mentions "sticky-note" and "banana"
- On failure: log full response with `[REVIEW]` marker

**T4.3 — Edit connected widget text**
- PATCH the sticky note: change text from "banana" to "apple"
- Verify canvas read shows updated text
- Ask agent: "What does your connected sticky note say now?"
- **Soft assert** response contains "apple"

**T4.4 — Edit connected widget color**
- PATCH the sticky note: change color from "yellow" to "red"
- Verify canvas read shows updated color
- Verify in browser via agent-browser that the widget renders with the new color

**T4.5 — Delete connected widget**
- DELETE the sticky note widget
- Verify canvas read no longer includes it
- Verify connector is orphaned/removed

**T4.6 — Connected markdown block (variant)**
- POST a `markdown` widget with `{ content: "# Hello World" }`
- Connect to agent
- Ask agent about connected widget — **soft assert** it sees the markdown content
- Update content to "# Goodbye World"
- Ask again — **soft assert** updated content
- Delete the markdown block

---

## Helper Modules

### `canvas-api.js`
```js
// Wraps fetch calls to /_storyboard/canvas/*
// Every call is automatically timed via perf.js
createWidget(canvasName, type, props, position)
readCanvas(canvasName)
readWidget(canvasName, widgetId) 
updateWidget(canvasName, widgetId, props, position)
deleteWidget(canvasName, widgetId)
addConnector(canvasName, startId, startAnchor, endId, endAnchor)
removeConnector(canvasName, connectorId)
listSessions()
```

### `tmux.js`
```js
// Wraps tmux CLI commands
// Every call is automatically timed via perf.js
// Every call is automatically recorded via transcript.js (stdin/stdout logging)
listSessions()                        // tmux list-sessions
hasSession(name)                      // tmux has-session -t ...
capturePane(sessionName)              // tmux capture-pane -t ... -p (auto-logged to transcript)
sendKeys(sessionName, keys)           // tmux send-keys -t ... (auto-logged as stdin)
waitForOutput(sessionName, pattern, timeoutMs)  // poll capturePane until match (polls logged)
killSession(sessionName)              // tmux kill-session -t ...
```

### `browser.js`
```js
// Wraps agent-browser CLI
// Each agent chain gets its own browser session name
openCanvas(url, sessionName)
snapshot(sessionName, options)
screenshot(sessionName, path)
isVisible(sessionName, selector)
getText(sessionName, selector)
click(sessionName, selectorOrRef)
close(sessionName)
```

### `setup.js`
```js
// Test canvas lifecycle
resolveServerUrl()                    // check ports.json or default to localhost:1234
createTestCanvas(name)                // create empty .canvas.jsonl file
deleteTestCanvas(name)                // remove the file
cleanupTerminalSessions(canvasName)   // kill tmux sessions for test canvas
loadConfiguredAgents()                // read canvas.agents from storyboard.config.json
checkAgentAvailability(agentId)       // which copilot / which claude — skip if missing
```

### `perf.js`
```js
// Performance timing and reporting
start(metricName)                     // returns { end() } timer
record(metricName, durationMs)        // manual record
report()                              // prints summary table to console
toJSON()                              // returns metrics for file output
getWarnings()                         // returns metrics exceeding thresholds
```

---

## Considerations

- **Timeouts**: Agent startup (Copilot/Claude) can take 30-90 seconds. Tests need generous timeouts — vitest default 5s won't work. Use `{ timeout: 120_000 }` per test or per describe block.
- **Parallel agent chains**: Groups 2–4 run concurrently per agent. Each chain is independent (own widget, tmux session, browser session). This catches concurrency bugs.
- **Agent availability**: Copilot and Claude must be installed and authenticated. Tests skip gracefully if a binary is not found (`which copilot`, `which claude`) — no failures, just skipped.
- **Dev server must be running**: The test runner should fail fast with a clear message if the dev server isn't available.
- **Cleanup**: afterAll hooks must kill tmux sessions and delete the test canvas. Cleanup runs even on failure. Transcripts are always flushed before cleanup.
- **Non-blocking failures**: Agent response assertions use `expect.soft()` so failures are recorded but don't abort the chain. Full tmux output is logged for manual review.
- **Transcripts always written**: Every test run produces transcripts, even when 100% passing. Review transcripts to catch UX issues (ugly messages, stray errors) that don't trigger functional failures.
- **Performance warnings**: Slow operations are flagged with `[SLOW]` in the output. Not failures yet — but visible for future benchmarking.
- **Canvas file**: Creating a `.canvas.jsonl` file directly — just needs an initial `{ "event": "canvas_created", "timestamp": "..." }` line.
