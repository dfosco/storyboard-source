# Plan: Multi-Agent Messaging Bus

## Problem

The current messaging system is point-to-point and terminal-centric. When widget A sends a message to partners B and C, it writes to each target's `pendingMessages` in their terminal config and injects text into their tmux session. There's no shared message log, no ordering guarantees, no concept of "who responds next," and no way for an agent to see their partner's responses to the same message. The system breaks when multiple connections exist because it was designed for 1:1 delivery, not multi-party conversation.

## Proposed Solution

A **shared JSONL message log** per canvas page, with **cluster-based orchestration** using two token types:

- **Message tokens** — embedded per-message, define which peers respond and in what order
- **Cluster token** — defines which widget "has the mic" for the next turn in the ongoing conversation
- **Cluster priority** — permanent role for the widget that initiated the cluster; responsible for goal-setting and finality. The priority holder also designates a **successor** after each message round, so the cluster can self-heal if the holder is removed.

All messages from all clusters on a canvas page live in a single `.storyboard/messages/{canvasId}.jsonl` file. Widgets only read messages relevant to their cluster. Think of it as a party room — multiple conversations happening, but you only listen to yours.

---

## Core Concepts

### Priority Succession

Cluster priority is permanent *unless* the priority holder is removed from the cluster. To handle this gracefully, the priority holder **proactively designates a successor** as part of their normal reasoning:

- After each message round (after hearing all responses), the priority holder includes a `successor` field in their cluster-level events (e.g., `cluster:finality`, `cluster:token:assign`)
- The successor is the agent the priority holder considers the best fallback — based on response quality, relevance, or role
- This designation lives in the JSONL log as metadata on the event — no extra API call needed

```jsonc
{
  "type": "cluster:finality",
  "senderId": "widget-a-id",
  "clusterId": "cluster_abc123",
  "successor": "widget-c-id",        // <-- proactive succession
  "summary": "Planning ideas collected from B and C"
}
```

**When the priority holder disappears** (disconnect, delete, or leaves the cluster):

1. Server reads the JSONL log for the most recent `successor` designation from the departed priority holder
2. If a valid successor exists and is still an **active agent** in the cluster → they become the new priority holder via a `cluster:priority:transfer` event
3. If the designated successor is also gone → fall back to the oldest remaining agent member in the cluster
4. If no agents remain → the cluster becomes **compute-less** (passive-only). It's valid but inert — no tokens circulate. If an agent is later connected to the cluster, they automatically receive priority.

**Compute-less clusters are valid.** A cluster of three markdown blocks and an image is a legitimate cluster — it just can't do anything until an agent joins. When an agent does join, they get cluster priority automatically since they're the only compute member.

### Clusters

A **cluster** is a connected component in the canvas connector graph. It forms automatically when connectors link widgets. The widget from which the *first* connection was dragged holds **cluster priority**.

- Clusters persist as long as at least one connection in the component remains
- Adding a widget to an existing cluster doesn't change the priority holder
- Removing all connections dissolves the cluster
- Cluster state is tracked in the JSONL log via lifecycle events

### Message Tokens (per-message turn order)

When widget A sends a message to its cluster, the message includes an ordered list of **message tokens** — one per peer that should respond. Peers respond sequentially in that order. Later respondents can read earlier responses (they see the full log).

Example: A sends "Give me planning ideas" → tokens: `[C, B]`
1. C gets the first message token → responds
2. B gets the second message token → can read C's response before responding
3. A receives both responses

The priority holder (A) decides token order using its own judgment.

### Cluster Token (conversation-level turn)

After a message round completes (all message tokens resolved), the **cluster token** determines who speaks next. The priority holder assigns it based on the conversation so far — e.g., if C gave a better answer, C might get the cluster token to continue driving the discussion.

The priority holder can also keep the cluster token themselves to ask follow-up questions.

### Cluster Finality

The priority holder signals **finality** when a **conversation** is complete — the user's request has been fulfilled. This doesn't remove connections or dissolve the cluster. It closes the current conversation. The cluster remains active for future conversations.

### Conversations

A **conversation** is the unit of goal-driven work within a cluster. It starts when the priority holder is activated (by a user message or by receiving the cluster token) and ends when the priority holder signals finality.

- Every conversation has a unique ID (`conv_01HXYZ...` — ULID, same as messages)
- Every message in the JSONL includes a `conversationId` field
- A conversation has a **status**: `active`, `finalized`, `timed_out`, `reopened`
- A conversation has a **goal** (set by the priority holder at the start)
- Multiple conversations can exist within a cluster over time, but only one is `active` at a time

**Lifecycle:**

1. **Start:** Priority holder receives a user message or decides to initiate → emits `conversation:start` with a goal
2. **Active:** Messages, tokens, and responses flow within this conversation. New members who join the cluster mid-conversation can read the full conversation history (all events with this `conversationId`)
3. **Finality:** Priority holder emits `conversation:finality` → conversation status becomes `finalized`
4. **Reopen:** A finalized conversation can be reopened via `conversation:reopen` — e.g., "actually, let's revisit that planning discussion". The original goal and full history are preserved. New messages append to the same conversation.
5. **Timeout:** If a conversation exceeds the configured timeout, the server emits `conversation:timeout` and the conversation is auto-finalized.

**Why conversations matter:**

- **Context boundaries:** When agent C joins the cluster mid-way, it can be told "read conversation `conv_01HXYZ` to catch up" — a clean, bounded context window
- **History:** The cluster accumulates a list of conversations over time. An agent can reference past conversations: "In our last conversation, we decided X"
- **Reopening:** If the user says "go back to that planning discussion," the agent can reopen the specific conversation rather than starting fresh
- **Metrics/debugging:** Each conversation is a traceable unit of work with a clear start, goal, and end

### Timeouts

Configurable cap (default 30 minutes) via `storyboard.config.json` → `canvas.messaging.conversationTimeoutMinutes`. Conversations that exceed this are auto-finalized.

---

## Data Design

### Storage Location

```
.storyboard/messages/
  viewfinder-redesign.jsonl    # canvasId = "viewfinder-redesign"
  design/overview.jsonl        # canvasId = "design/overview" → nested dirs
  proto:Main/board.jsonl       # canvasId = "proto:Main/board"
```

Canvas IDs come from the existing `toCanvasId()` in `packages/core/src/canvas/identity.js`. For IDs with `/`, create subdirectories. Replace `:` with `--` for filesystem safety.

### Message Envelope Schema

Every line in the JSONL is a **message event** with this envelope:

```jsonc
{
  // Identity
  "id": "msg_01HXYZ...",           // ULID — sortable, unique, embeds timestamp
  "timestamp": "2026-04-23T18:04:13.510Z",  // ISO 8601, millisecond precision
  "canvasId": "viewfinder-redesign",
  "clusterId": "cluster_abc123",
  "conversationId": "conv_01HABC...",  // which conversation this event belongs to

  // Sender
  "senderId": "widget-a-id",
  "senderName": "Agent A",

  // Message type
  "type": "message:send",          // see Event Types below

  // Content (for message types)
  "body": "Give me ideas for next week's planning",
  "payload": {},                    // optional structured data

  // Token control (for message:send)
  "messageTokens": [
    { "widgetId": "widget-c-id", "order": 0, "status": "pending" },
    { "widgetId": "widget-b-id", "order": 1, "status": "pending" }
  ],

  // References
  "inReplyTo": null,               // msg_id this responds to
  "clusterTokenHolder": "widget-a-id",  // who holds the cluster token after this event
  "successor": "widget-c-id"       // designated next priority holder if current holder leaves (optional, set by priority holder)
}
```

### Event Types

| Type | Description | Emitted by |
|------|-------------|------------|
| `cluster:created` | New cluster formed from connections | Server (on connector creation) |
| `cluster:priority` | Declares the priority holder | Server (on cluster creation) |
| `cluster:priority:transfer` | Priority transferred (holder left/deleted) | Server |
| `cluster:dissolved` | All connections removed | Server |
| `conversation:start` | New conversation opened with a goal | Priority holder |
| `conversation:finality` | Conversation complete, goal reached | Priority holder |
| `conversation:reopen` | Finalized conversation reopened | Priority holder |
| `conversation:timeout` | Conversation auto-finalized due to timeout | Server |
| `cluster:token:assign` | Cluster token passed to a widget | Current token holder |
| `message:send` | A widget sends a message with message tokens | Any token-holding widget |
| `message:received` | Acknowledges receipt of a message | Recipient widget |
| `message:response` | A widget responds (consumes its message token) | Token-holding recipient |
| `message:token:skipped` | Message token skipped (recipient left) | Server |
| `system:widget:joined` | Widget connected to cluster | Server |
| `system:widget:left` | Widget disconnected from cluster | Server |
| `system:widget:deleted` | Widget deleted from canvas | Server |
| `system:widget:rejoined` | Undo of disconnect/delete (Cmd+Z) | Server |
| `system:widget:ready` | Agent reports passive member is done | Agent (on behalf of passive member) |

### Cluster State (derived from log replay)

Cluster state is never stored separately — it's computed by replaying the JSONL. A helper materializes:

```js
{
  clusterId: "cluster_abc123",
  canvasId: "viewfinder-redesign",
  priorityHolder: "widget-a-id",
  members: ["widget-a-id", "widget-b-id", "widget-c-id"],
  goal: "Get ideas for next week's planning",
  clusterTokenHolder: "widget-a-id",
  designatedSuccessor: "widget-c-id",  // most recently designated fallback priority holder
  status: "active",               // active | dissolved
  activeConversation: {            // null if no conversation is active
    conversationId: "conv_01HABC...",
    goal: "Get ideas for next week's planning",
    status: "active",             // active | finalized | timed_out | reopened
    startedAt: "2026-04-23T18:01:00.000Z",
  },
  conversations: [                 // all conversations in this cluster (summary)
    { conversationId: "conv_01HABC...", goal: "...", status: "active", startedAt: "...", finalizedAt: null },
  ],
  createdAt: "2026-04-23T18:00:00.000Z",
  lastActivityAt: "2026-04-23T18:04:13.510Z",
  // Pending message tokens for the current message round
  pendingMessageTokens: [
    { widgetId: "widget-b-id", messageId: "msg_01HXYZ...", order: 1, status: "pending" }
  ]
}
```

---

## File Structure

```
packages/core/src/canvas/messaging/
  index.js              — Public API re-exports
  message-log.js        — JSONL read/write, append, replay, query
  cluster-manager.js    — Cluster lifecycle: create, dissolve, compute connected components
  token-manager.js      — Message token + cluster token assignment, resolution, validation
  message-schema.js     — Envelope schema, validation, ULID generation
  message-routes.js     — Express route handlers for the messaging API
```

### Integration points in existing code

| File | Change |
|------|--------|
| `packages/core/src/canvas/server.js` | Mount message routes; hook connector create/remove to cluster manager |
| `packages/core/src/canvas/terminal-config.js` | Add `cluster` field to terminal config (clusterId, role, goal) |
| `packages/core/src/configSchema.js` | Add `canvas.messaging` config section |
| `packages/core/src/canvas/terminal-server.js` | On agent connect, deliver cluster context + pending message tokens |

---

## API Endpoints

All routes under `/_storyboard/messages/`.

### `POST /_storyboard/messages/send`

Send a message into a cluster. The sender must hold either the cluster token or a pending message token. If no active conversation exists, this implicitly starts one.

```jsonc
// Request body
{
  "canvasId": "viewfinder-redesign",
  "clusterId": "cluster_abc123",
  "conversationId": "conv_01HABC...",  // current conversation (auto-created if omitted)
  "senderId": "widget-a-id",
  "body": "Give me ideas for next week's planning",
  "payload": {},                    // optional
  "messageTokens": ["widget-c-id", "widget-b-id"],  // ordered recipients
  "inReplyTo": null                 // or a message ID for responses
}
```

```jsonc
// Response
{
  "messageId": "msg_01HXYZ...",
  "nextTokenHolder": "widget-c-id"
}
```

### `POST /_storyboard/messages/respond`

Respond to a message (consumes your message token).

```jsonc
{
  "canvasId": "viewfinder-redesign",
  "messageId": "msg_01HXYZ...",     // the message being responded to
  "senderId": "widget-c-id",
  "body": "Here are some ideas: ..."
}
```

### `GET /_storyboard/messages/:canvasId`

Read the message log for a canvas. Supports filters:

```
?clusterId=cluster_abc123           // filter by cluster
?conversationId=conv_01HABC...     // filter by conversation
?since=msg_01HXYZ...               // messages after this ID (for polling)
?senderId=widget-a-id              // filter by sender
```

### `POST /_storyboard/messages/cluster/token`

Assign the cluster token to a peer.

```jsonc
{
  "canvasId": "viewfinder-redesign",
  "clusterId": "cluster_abc123",
  "fromWidgetId": "widget-a-id",
  "toWidgetId": "widget-c-id"
}
```

### `POST /_storyboard/messages/conversation/finality`

Signal that the current conversation is complete. Only the priority holder can do this.

```jsonc
{
  "canvasId": "viewfinder-redesign",
  "clusterId": "cluster_abc123",
  "conversationId": "conv_01HABC...",
  "senderId": "widget-a-id",
  "summary": "Planning ideas collected from B and C",
  "successor": "widget-c-id"       // optional — designate next priority holder
}
```

### `POST /_storyboard/messages/conversation/reopen`

Reopen a finalized conversation. Preserves all history; new messages append to it.

```jsonc
{
  "canvasId": "viewfinder-redesign",
  "clusterId": "cluster_abc123",
  "conversationId": "conv_01HABC...",
  "senderId": "widget-a-id",
  "body": "Actually, let's revisit the planning ideas"
}
```

### `GET /_storyboard/messages/cluster/:canvasId`

Get materialized cluster states for a canvas.

```
?clusterId=cluster_abc123           // specific cluster
?status=active                      // filter by status
```

---

## Agent Integration

### Terminal Config Extension

Each terminal's `.storyboard/terminals/{widget}.json` gains a `clusters` array (a widget can belong to multiple clusters):

```jsonc
{
  // ... existing fields ...
  "clusters": [
    {
      "clusterId": "cluster_abc123",
      "role": "priority",            // "priority" | "member" | "passive"
      "goal": "Get ideas for next week's planning",
      "peers": [
        { "widgetId": "widget-b-id", "displayName": "Agent B", "role": "member" },
        { "widgetId": "widget-c-id", "displayName": "Agent C", "role": "member" },
        { "widgetId": "proto-xyz",   "displayName": "Auth Prototype", "role": "passive" }
      ],
      "messageLogPath": ".storyboard/messages/viewfinder-redesign.jsonl",
      "activeConversationId": "conv_01HABC...",  // current active conversation (null if none)
      "hasClusterToken": true,
      "pendingMessageToken": null     // or { messageId, order }
    }
  ]
}
```

### Agent Skill Behavior

The agent skill (injected into each terminal agent's system prompt) will instruct agents to:

1. **On receiving a user message (priority holder):**
   - Define the cluster goal via `POST /cluster/goal`
   - Send the message to peers with ordered message tokens via `POST /messages/send`
   - Wait for responses by polling `GET /messages/:canvasId?since=...`

2. **On receiving a message token:**
   - Read the message log to see the original message + prior peer responses
   - Formulate response via `POST /messages/respond`

3. **After all message tokens resolve:**
   - Priority holder reads all responses
   - Decides: assign cluster token to a peer, send another message, or signal finality

4. **Bias to visual action:**
   - After processing, the agent should produce visible output (add widgets, edit markdown, write code)
   - The finality signal can include a summary of what was produced

### Message Delivery

Two delivery mechanisms coexist:

1. **Pull-based (primary):** Agents poll the JSONL log via `GET /messages/:canvasId?since=...` to discover new messages
2. **Push notification (optimization):** Server sends a Vite HMR event `storyboard:message` when a new message is appended, so agents can react immediately without polling

For the initial implementation, push is optional — pull with a 1-2 second interval is sufficient. The HMR event can be added as an optimization later.

---

## Config Schema Addition

```jsonc
// storyboard.config.json
{
  "canvas": {
    "messaging": {
      "conversationTimeoutMinutes": 30,
      "messageTokenTimeoutSeconds": 120,
      "pollIntervalMs": 2000,
      "maxMessagesPerCluster": 200
    }
  }
}
```

---

## Cluster Lifecycle

### Formation

1. User drags a connector from widget A to widget B
2. Server fires `connector_added` event (existing behavior)
3. **New:** Server calls `clusterManager.onConnectorAdded(connector)`
4. Cluster manager computes connected components from all connectors
5. If A and B are in a new component → create cluster, A gets priority (it's `conn.start`)
6. If A or B joins an existing component → add to cluster, priority unchanged
7. Append `cluster:created` + `cluster:priority` events to JSONL

### Adding a third widget

1. User drags connector from A to C (or C to B, etc.)
2. If C joins an existing cluster → append updated membership, no priority change
3. C's terminal config gets the `cluster` field

### Dissolution

1. User removes a connector
2. Server calls `clusterManager.onConnectorRemoved(connectorId)`
3. Recompute connected components
4. If the component splits → the sub-component without the priority holder becomes a new cluster (new priority = widget that was `start` of the oldest remaining connector in that sub-component)
5. If a widget is fully disconnected → it leaves all clusters
6. If no connections remain in a cluster → append `cluster:dissolved`

### Finality (Conversation-level)

1. Priority holder sends `POST /messages/conversation/finality`
2. Append `conversation:finality` event with `conversationId`, `summary`, and `successor`
3. Conversation status becomes `finalized`
4. The cluster remains `active` — a new user message starts a new conversation (`conversation:start`)

### Reopen

1. Priority holder sends `POST /messages/conversation/reopen` with `conversationId`
2. Append `conversation:reopen` event
3. Conversation status becomes `reopened` (treated as `active` for token routing)
4. New members who joined after finality can read the full conversation history to catch up

---

## Implementation Todos

### Phase 1: Core Infrastructure
1. **message-schema** — ULID generation, envelope validation, event type constants
2. **message-log** — JSONL append/read/replay, file management per canvasId, directory scaffolding
3. **cluster-manager** — Connected component computation from connectors, cluster lifecycle (create/dissolve/split), priority assignment
4. **token-manager** — Message token assignment/resolution, cluster token transfer, timeout enforcement

### Phase 2: Server Integration
5. **message-routes** — Express route handlers for all API endpoints
6. **server.js hooks** — Mount routes, wire connector add/remove to cluster manager
7. **terminal-config extension** — Add `cluster` field to terminal config, update on cluster changes
8. **config schema** — Add `canvas.messaging` section to configSchema.js

### Phase 3: Agent Integration
9. **Agent skill update** — Update terminal agent system prompt with messaging protocol instructions
10. **Delivery bridge** — Connect message log events to terminal session delivery (translate JSONL events → tmux injection for agents that need it)
11. **Startup context** — On agent connect, deliver cluster context + any pending message tokens

### Phase 4: Polish & Safety
12. **Timeout enforcement** — Background interval checks for timed-out clusters and message tokens
13. **HMR push notifications** — Vite HMR `storyboard:message` event for real-time reactivity
14. **Cleanup** — Dissolve clusters on canvas close, prune old finalized logs

---

## Passive Cluster Members

Non-agent widgets (prototypes, markdown blocks, images, stories) are **passive cluster members**. They are part of the cluster, visible in the JSONL log, but they **never hold message tokens or cluster tokens**.

### Membership Rules

- When an agent creates a widget and connects to it, the new widget joins the agent's cluster automatically
- Passive members appear in the cluster's `members` list with `role: "passive"`
- They show up in the JSONL log when referenced (e.g., "I finished updating the prototype")
- They cannot send messages or respond — they have no compute

### Readiness Signals

When an agent works on a passive member (writes code into a prototype, updates a markdown block), the **agent speaks for the passive member** by emitting a system message:

```jsonc
{
  "type": "system:widget:ready",
  "senderId": "agent-a-id",           // the agent that did the work
  "targetWidgetId": "prototype-xyz",   // the passive member
  "body": "Prototype updated with new authentication flow",
  "payload": { "action": "update", "widgetType": "prototype" }
}
```

This "readiness signal" tells the rest of the cluster: this passive member has been updated and is ready. It's not a message *from* the prototype — it's the agent reporting on behalf of the prototype.

### Agent-Created Widgets

**Bias to visual action:** Objects created by agents should be:
1. Connected to the agent that created them (auto-connector)
2. Positioned adjacent to the agent widget on the canvas (not at 0,0)
3. Automatically added to the agent's cluster as passive members

This follows the existing principle that agents produce visible results on the canvas, not just terminal output.

---

## System Messages

System messages are events emitted by the server (not agents) to communicate structural changes to the cluster. They appear in the JSONL log alongside regular messages.

### Event Types

| Type | Trigger | Effect |
|------|---------|--------|
| `system:widget:joined` | Widget connected to cluster | New member added |
| `system:widget:left` | Widget disconnected from cluster | Member removed; skip their pending message token if any |
| `system:widget:deleted` | Widget deleted from canvas | Same as `left`, but permanent |
| `system:widget:rejoined` | Undo of disconnect/delete (Cmd+Z) | Member restored; if their message token was pending and not yet skipped, they're back in queue |
| `system:widget:ready` | Agent reports passive member is done | Readiness signal for non-agent widgets |

### Undo Behavior

Disconnections and deletions are **undoable with Cmd+Z**. When undone:

1. A `system:widget:rejoined` event is appended (the original `left`/`deleted` event stays — append-only log)
2. If the widget had a pending message token that was skipped, it is **not** re-queued (the round has moved on)
3. If the widget had a pending message token that has **not yet been reached** in the sequence, they remain in order as if they never left
4. The widget resumes cluster membership from the current state forward

Think of it like someone leaving a room and coming back:
- If it wasn't their turn yet → they're still in line
- If their turn was skipped → the conversation moved on, they catch up by reading the log
- Either way, no error is thrown

---

## Scope Exclusions

### Prompt Widgets (deferred)

Prompt widgets (branch `4.3.0--prompt-widget`) are background-ish tmux sessions with a different UI. They are technically terminal agents and *should* be viable cluster members, but they are **excluded from this plan's scope** to manage complexity. They can be integrated in a follow-up once the core messaging bus is stable.

### JSONL Compaction (v2)

Over time, message logs grow. After finality, old rounds could be compacted into a summary event. Not needed for v1.

### HMR Push (v1 optimization)

Push notifications via Vite HMR (`storyboard:message`) are an optimization over polling. Designed for but not required in the initial implementation — polling at 2s intervals is sufficient for v1.

---

## Resolved Design Decisions

1. **Passive members:** Non-agent widgets are passive cluster members — visible in the log, never hold tokens. Agents speak for them via readiness signals.

2. **Multiple clusters per widget:** Supported. A widget can be in multiple clusters simultaneously. Terminal config uses a `clusters` array.

3. **Cluster priority transfer:** The priority holder proactively designates a `successor` in their JSONL events. If they're removed, the server reads the most recent successor designation and transfers priority. Falls back to oldest remaining agent. Compute-less clusters (no agents) are valid but inert.

4. **Agent API access:** Agents call the messaging API via `curl` to the local server. A `storyboard message` CLI command may be added later as a convenience wrapper.

5. **Turn-taking model:** Per-sender FIFO with message tokens for ordered responses within a round. The priority holder uses agent discretion to decide token order and when to signal finality.

6. **Auto-connection of agent outputs:** Widgets created by agents are auto-connected and auto-positioned adjacent to the creating agent. They join the cluster as passive members.
