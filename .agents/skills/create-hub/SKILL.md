---
name: create-hub
description: Creates a multi-agent hub on the canvas — spawns agents, connects them, enables broadcast, and starts a conversation. Use when asked to "create a hub", "spawn a hub", "set up a hub", or "Hub: [task]".
---

# Create Hub

> Triggered by: "create a hub", "spawn a hub", "set up a hub", "Hub:", "create a hub for", "spawn a hub with", "set up a hub to"

## What This Does

Creates a multi-agent hub on the current canvas. Each agent you create is a **real, autonomous AI session** — an independent process running its own Copilot/Claude/Codex CLI instance in its own tmux session. They are NOT simulations or stubs. They boot up, receive role instructions, read the codebase, run tools, and produce real work.

## Prerequisites

- You must be on a canvas (`$STORYBOARD_CANVAS_ID` and `$STORYBOARD_WIDGET_ID` env vars set)
- Canvas server must be running (`$STORYBOARD_SERVER_URL`)

## Procedure

### Step 1: Determine the hub composition

Based on the user's request, decide:
- How many agents are needed (minimum 2 total, including yourself)
- What each agent's name/specialization should be
- What agent type each should be (keys from `canvas.agents` in `storyboard.config.json` — typically `"copilot"`, `"claude"`, `"codex"`)

Default agent type is `"copilot"`. Keep hubs small (2–5 agents is typical).

### Step 2: Create agent widgets and connectors

Use `storyboard canvas batch` to create all agent widgets and connectors in a single call. Use `$0`, `$1`, etc. to reference widget IDs from earlier create ops. The `alias` prop gives agents a human-readable nickname; their auto-generated `prettyName` (e.g. `ivory-avocet`) serves as a unique fallback.

**Layout:** Agents fan out from the leader in a `<` pattern — the leader is on the left, peers spread to the upper-right and lower-right. Use diagonal directions (`above-right`, `below-right`) and `gap: 10` (grid spaces) so connectors render cleanly between widgets.

For **2 peers** (most common):
```bash
storyboard canvas batch --canvas "$STORYBOARD_CANVAS_ID" --ops '[
  { "op": "create-widget", "type": "agent", "near": "'"$STORYBOARD_WIDGET_ID"'", "direction": "above-right", "gap": 10, "props": { "alias": "Research Agent", "agentId": "copilot" } },
  { "op": "create-widget", "type": "agent", "near": "'"$STORYBOARD_WIDGET_ID"'", "direction": "below-right", "gap": 10, "props": { "alias": "Review Agent", "agentId": "copilot" } },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$0", "endAnchor": "left" },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$1", "endAnchor": "left" }
]'
```

For **3 peers**, add a `right` (center) agent:
```bash
storyboard canvas batch --canvas "$STORYBOARD_CANVAS_ID" --ops '[
  { "op": "create-widget", "type": "agent", "near": "'"$STORYBOARD_WIDGET_ID"'", "direction": "above-right", "gap": 10, "props": { "alias": "Agent A", "agentId": "copilot" } },
  { "op": "create-widget", "type": "agent", "near": "'"$STORYBOARD_WIDGET_ID"'", "direction": "right", "gap": 10, "props": { "alias": "Agent B", "agentId": "copilot" } },
  { "op": "create-widget", "type": "agent", "near": "'"$STORYBOARD_WIDGET_ID"'", "direction": "below-right", "gap": 10, "props": { "alias": "Agent C", "agentId": "copilot" } },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$0", "endAnchor": "left" },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$1", "endAnchor": "left" },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$2", "endAnchor": "left" }
]'
```

For **4 peers**, use all four: `above-right`, `right` (×2 stacked), `below-right`. For a single peer, use `right` with `gap: 10`.

**Connector anchors:** Since the fan always places peers to the right of the leader, use `startAnchor: "right"` on the leader and `endAnchor: "left"` on each peer. This matches the 9-cell orientation table (leader is `center-left` relative to all peers).

The output contains an array of results. Each `create-widget` result has a `widgetId` field.

For a single agent, you can use `storyboard canvas add` instead:

```bash
storyboard canvas add agent --canvas "$STORYBOARD_CANVAS_ID" --json \
  --name "Research Agent" --near "$STORYBOARD_WIDGET_ID" --gap 10 --props '{"agentId": "copilot"}'
```

### Step 3: Enable broadcast (optional)

Broadcast is **automatically enabled** for all agent↔agent connectors when a hub forms. This step is only needed to override the default (e.g. set `mode: 'one-way'` or `mode: 'none'` on specific connections):

```bash
storyboard canvas broadcast \
  --canvas "$STORYBOARD_CANVAS_ID" \
  --widget "$STORYBOARD_WIDGET_ID" \
  --mode two-way \
  --pass-through
```

### Step 4: Wait for agents to boot

Agent widgets auto-start when the browser renders them — the terminal-server launches the agent binary from the widget's `agentId` config. **No `agent/spawn` call needed.** Wait ~5 seconds for agents to boot.

### Step 5: Start a conversation

Read the hub ID from your terminal config and send the first message:

```bash
HUB_ID=$(cat .storyboard/terminals/${STORYBOARD_WIDGET_ID}.json 2>/dev/null | jq -r '.hubs[0].hubId // empty')

# Fallback if config hasn't updated yet
if [ -z "$HUB_ID" ]; then
  HUB_ID=$(storyboard hub state --canvas "$STORYBOARD_CANVAS_ID" 2>/dev/null | jq -r '.hubs[0].hubId // empty')
fi

storyboard hub conversation start --hub "$HUB_ID" --sender "$STORYBOARD_WIDGET_ID"
```

### Step 6: Report

Output the hub summary:

```
Hub created with <N> agents:
- <leaderName> (leader) — <role description>
- <agent1Name> (member) — <role description>
- <agent2Name> (member) — <role description>

Hub ID: <hubId>
Broadcast: active
```

## Guardrails

- **Max 5 agents** — keep hubs focused unless the user specifies otherwise
- **You are the leader** — you always become the hub leader; spawned agents are members
- **Explicit only** — only create a hub when the user explicitly asks
- **One hub at a time** — if you're already in a hub, warn the user before creating more agents
- **Iterate, don't duplicate** — when incorporating feedback from peers, update the existing canvas widget (`storyboard canvas update <id>`) instead of creating a new one. Only create additional widgets when the output is genuinely a separate deliverable. The final canvas should have clean outputs, not a trail of drafts.
