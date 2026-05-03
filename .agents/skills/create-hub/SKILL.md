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

Use `storyboard canvas batch` to create all agent widgets and connectors in a single call. Use `$0`, `$1`, etc. to reference widget IDs from earlier create ops.

```bash
storyboard canvas batch --canvas "$STORYBOARD_CANVAS_ID" --ops '[
  { "op": "create-widget", "type": "agent", "props": { "prettyName": "Research Agent", "agentId": "copilot" } },
  { "op": "create-widget", "type": "agent", "props": { "prettyName": "Review Agent", "agentId": "copilot" } },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$0", "endAnchor": "left" },
  { "op": "create-connector", "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'", "startAnchor": "right", "endWidgetId": "$1", "endAnchor": "left" }
]'
```

The output contains an array of results. Each `create-widget` result has a `widgetId` field.

For a single agent, you can use `storyboard canvas add` instead:

```bash
storyboard canvas add agent --canvas "$STORYBOARD_CANVAS_ID" --json \
  --props '{"prettyName": "Research Agent", "agentId": "copilot"}'
```

### Step 3: Enable broadcast

Turn on messaging across the full hub. `--pass-through` traverses the entire connected component:

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
  HUB_ID=$(curl -s "$STORYBOARD_SERVER_URL/_storyboard/messages/hub/state?canvasId=$STORYBOARD_CANVAS_ID" | jq -r '.[0].hubId // empty')
fi

curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/messages/conversation/start" \
  -H "Content-Type: application/json" \
  -d '{"hubId": "'"$HUB_ID"'", "senderId": "'"$STORYBOARD_WIDGET_ID"'"}'
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
