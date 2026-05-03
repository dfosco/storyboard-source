---
name: create-hub
description: Creates a multi-agent hub on the canvas — spawns agents, connects them, assigns roles, and opens broadcast. Use when asked to "create a hub", "spawn a hub", "set up a hub", or "Hub: [task]".
---

# Create Hub

> Triggered by: "create a hub", "spawn a hub", "set up a hub", "Hub:", "create a hub for", "spawn a hub with", "set up a hub to"

## What This Does

Creates a multi-agent hub on the current canvas: determines which agent roles are needed, spawns agent widgets, connects them to the requesting agent (leader), assigns roles, and opens broadcast so messaging can begin.

## First Step

**Read `.agents/roles/starter.role.md`** — it contains the full step-by-step procedure with copy-pasteable curl commands using your env vars. The starter role is a transient role that transitions to leader once the hub is running.

## Prerequisites

- The requesting agent must be on a canvas (needs `STORYBOARD_CANVAS_ID` and `STORYBOARD_WIDGET_ID` env vars)
- The canvas server must be running (needs `STORYBOARD_SERVER_URL`)
- tmux must be available for agent session creation

## Procedure

### Step 1: Determine the hub composition

Based on the user's request, decide which agents are needed. Consider:
- What distinct roles/specializations does the task require?
- How many agents are needed? (minimum 2 including the leader)
- What agent type should each be? (use the canvas agent configs from `storyboard.config.json`)

Default agent type is the first entry in `canvas.agents` config (typically "copilot").

### Step 2: Create agent widgets

For each additional agent needed, call the canvas server. Set `agentId` in props to choose which agent binary to launch (keys from `canvas.agents` in `storyboard.config.json`):

```bash
# Create widget — type and props are top-level fields
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<canvasName>",
    "type": "agent",
    "props": {
      "prettyName": "<descriptive name for this agent>",
      "agentId": "copilot"
    }
  }'
```

The response includes the created widget's `id` in `result.widget.id`.

### Step 3: Connect agents to the leader

For each spawned agent, create a connector from the leader to the new agent:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/connector" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<canvasName>",
    "startWidgetId": "<leaderWidgetId>",
    "startAnchor": "right",
    "endWidgetId": "<newAgentWidgetId>",
    "endAnchor": "left"
  }'
```

### Step 4: Wait for agent sessions

Agent widgets auto-start when the browser renders them. The TerminalWidget connects via WebSocket and the terminal-server launches the correct agent binary using the `startupCommand` resolved from the widget's `agentId` prop. **No additional API call is needed** — just wait a few seconds for the browser to render the widgets and for agents to boot.

Role injection happens automatically when the hub is materialized from connectors.

For headless agents (no browser), use `agent/spawn`:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/agent/spawn" \
  -H "Content-Type: application/json" \
  -d '{
    "canvasId": "<canvasId>",
    "widgetId": "<newAgentWidgetId>",
    "prompt": "<initial task context for this agent>",
    "autopilot": true,
    "agentId": "copilot"
  }'
```

### Step 5: Open broadcast

Enable messaging across the entire hub using the existing broadcast endpoint:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/broadcast" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<canvasName>",
    "widgetId": "<leaderWidgetId>",
    "mode": "two-way",
    "passThrough": true
  }'
```

`passThrough: true` ensures all connected agents in the hub get messaging enabled, not just direct neighbors.

### Step 6: Start a conversation

Once broadcast is active, start a conversation on the hub:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/messages/conversation/start" \
  -H "Content-Type: application/json" \
  -d '{
    "hubId": "<hubId>",
    "senderId": "<leaderWidgetId>"
  }'
```

The `hubId` can be read from the leader's terminal config (`.storyboard/terminals/<widgetId>.json` → `hubs[0].hubId`) after broadcast is opened and hub materialization completes.

### Step 7: Return hub context

After all agents are spawned and broadcast is open, output the hub summary:

```
Hub created with <N> agents:
- <leaderName> (leader) — <role description>
- <agent1Name> (member) — <role description>
- <agent2Name> (member) — <role description>

Hub ID: <hubId>
Broadcast: active
Conversation: <conversationId>

The hub is ready. Use hub/send to delegate work to members.
```

## Guardrails

- **Max hub size**: Respect `canvas.messaging.maxHubSize` from config (default: no limit, but be sensible — 2-5 agents is typical)
- **Leader stays**: The requesting agent always becomes the leader. Spawned agents are always members.
- **Explicit only**: This skill is only triggered by explicit user intent ("create a hub"). Agents do not autonomously decide to create hubs.
- **One hub at a time**: If the requesting agent is already in a hub, warn the user before creating additional agents.

## Environment Variables

These are available in the agent's tmux session:

| Variable | Description |
|----------|-------------|
| `STORYBOARD_WIDGET_ID` | This agent's widget ID |
| `STORYBOARD_CANVAS_ID` | Current canvas ID |
| `STORYBOARD_BRANCH` | Current git branch |
| `STORYBOARD_SERVER_URL` | Server URL for API calls |
