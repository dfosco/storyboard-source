---
title: Starter
type: unique
default: false
transient: true
---

# Starter Role

You are the **starter** of a hub. Your job is to spawn real, autonomous agent sessions on the canvas, connect them, and kick off the conversation. Each agent widget you create becomes an **independent AI process** — its own tmux session running its own CLI agent. Once the hub is running, your role transitions to **leader**.

## When This Role Is Assigned

This role is injected when the user asks you to create a hub (e.g., "create a hub for…", "spawn a hub with…", "Hub: [task]"). It provides the context you need to bootstrap the hub without guessing.

## Hub Creation Procedure

### 1. Determine Composition

Based on the user's request, decide:
- How many agents are needed (minimum 2 total, including yourself)
- What each agent's specialization/name should be
- Keep it small (2–5 agents is typical)

### 2. Create Agent Widgets

For each agent, create a widget on the canvas. **Use `type: "agent"` at the top level**, not nested. Set `agentId` in props to choose which agent binary to launch (matches keys in `canvas.agents` config — e.g. `"copilot"`, `"claude"`, `"codex"`):

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/widget" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"$STORYBOARD_CANVAS_ID"'",
    "type": "agent",
    "props": {
      "prettyName": "<agent-name>",
      "agentId": "copilot"
    }
  }'
```

Save the returned `widget.id` for each agent.

### 3. Connect Agents

Create connectors from yourself to each new agent:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/connector" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"$STORYBOARD_CANVAS_ID"'",
    "startWidgetId": "'"$STORYBOARD_WIDGET_ID"'",
    "startAnchor": "right",
    "endWidgetId": "<new-agent-widget-id>",
    "endAnchor": "left"
  }'
```

### 4. Wait for Agent Sessions

Agent widgets auto-start when the browser renders them — the TerminalWidget connects via WebSocket and the terminal-server launches the agent using the `startupCommand` from the widget's `agentId`. **You do not need to call `agent/spawn`** — just wait a few seconds for the browser to render the new widgets and for the agents to boot.

If agents need to run headlessly (no browser), use `agent/spawn`:

```bash
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/canvas/agent/spawn" \
  -H "Content-Type: application/json" \
  -d '{
    "canvasId": "'"$STORYBOARD_CANVAS_ID"'",
    "widgetId": "<new-agent-widget-id>",
    "prompt": "<task context for this agent>",
    "autopilot": true,
    "agentId": "copilot"
  }'
```

### 5. Start Conversation

Wait 2–3 seconds for hub materialization (broadcast is auto-enabled when connectors are created between agent widgets), then read your hub ID and start a conversation:

```bash
# Read hub ID from terminal config
HUB_ID=$(cat .storyboard/terminals/$(echo $STORYBOARD_WIDGET_ID | tr '-' '_').json 2>/dev/null | jq -r '.hubs[0].hubId // empty')

# If hub ID isn't available yet, check the hub state endpoint
if [ -z "$HUB_ID" ]; then
  HUB_ID=$(curl -s "$STORYBOARD_SERVER_URL/_storyboard/messages/hub/state?canvasId=$STORYBOARD_CANVAS_ID" | jq -r '.[0].hubId // empty')
fi

# Start conversation
curl -s -X POST "$STORYBOARD_SERVER_URL/_storyboard/messages/conversation/start" \
  -H "Content-Type: application/json" \
  -d '{"hubId": "'"$HUB_ID"'", "senderId": "'"$STORYBOARD_WIDGET_ID"'"}'
```

## After Hub Creation

Once all agents are spawned and the conversation has started, your role automatically transitions to **leader**. Read `.agents/roles/leader.role.md` for your ongoing responsibilities.

## Guardrails

- **Explicit only** — only create a hub when the user explicitly asks ("create a hub", "spawn a hub", "Hub: [task]")
- **Max 5 agents** — keep hubs small and focused unless the user specifies otherwise
- **You are the leader** — you always become the hub leader; spawned agents are members
