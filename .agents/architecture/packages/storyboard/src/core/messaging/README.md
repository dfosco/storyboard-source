# Messaging Bus Architecture

## Overview

The messaging bus is a shared JSONL-backed event system for inter-agent communication. It replaces the point-to-point `pendingMessages` JSON + tmux send-keys approach with a pub/sub event bus that provides:

- Durable, queryable message history
- Server-sent events (SSE) for browser subscribers
- WebSocket push for real-time updates
- Presence registry for agent availability
- Delivery bridge with durable cursors for tmux injection

## Module Map

| Module | Purpose |
|--------|---------|
| `bus.js` | Core pub/sub: publish, subscribe, read, readMulti |
| `schema.js` | Event envelope validation + inline ULID generation |
| `toon.js` | TOON wire format serializer/deserializer |
| `storage/jsonl-adapter.js` | JSONL persistence (one file per channel) |
| `presence.js` | Heartbeat-based agent presence registry |
| `delivery.js` | Server-side bridge: bus → tmux send-keys |
| `routes.js` | HTTP endpoints for messaging API |
| `index.js` | Public re-exports |

## Data Flow

```
CLI (storyboard terminal send)
  → POST /_storyboard/canvas/terminal/send
    → resolves channel from terminal config
    → bus.publish(channel, envelope)
      → JSONL append
      → in-process subscribers notified:
        → DeliveryBridge: tmux send-keys + cursor advance + ack
        → SSE connections: push event
        → WebSocket clients: push event
```

## Channel Naming

Channels are scoped to prevent cross-branch/canvas collisions:

- **Terminal inbox**: `terminal:{branch}:{canvasId}:{widgetId}`
- **Presence**: `presence:{branch}:{canvasId}`

Channel names containing `:` are URL-encoded in HTTP paths and sanitized for filenames (`:` → `--`).

## Presence Registry (`presence.js`)

Crash-safe presence tracking with no explicit deregister:

- **Join**: `joinPresence()` publishes `presence:join` and starts 30s heartbeat
- **Heartbeat**: Timer publishes `presence:heartbeat` every 30s
- **Expiry**: Entries expire after 90s without heartbeat (3 missed = gone)
- **Leave**: `leavePresence()` stops heartbeat and removes from registry (called on ws close)
- **Sweep**: Background timer checks for expired entries every 15s
- **Rehydrate**: On startup, rebuilds registry from persisted JSONL log

The registry updates the in-memory Map both via bus subscription AND directly in `joinPresence()` to ensure availability regardless of subscription state.

## Delivery Bridge (`delivery.js`)

Server-side subscriber that delivers bus messages to tmux terminals:

- **Bind**: `bindWidget()` subscribes to the widget's inbox channel
- **Backfill**: On bind, reads from durable cursor position, delivers missed messages
- **Live**: Subscribes for new events, injects via `tmux send-keys`
- **Cursor**: Persisted at `.storyboard/messages/cursors/{widgetId}.json`
- **Ack**: On successful delivery, publishes `message:delivered` on the channel
- **Failure**: On tmux failure, publishes `message:failed` (cursor not advanced)
- **Rebind**: `rebindWidget()` updates tmux target without re-subscribing (hot-pool)
- **Unbind**: `unbindWidget()` unsubscribes from channel

### At-Least-Once Delivery

Cursor only advances after successful tmux injection. On failure during backfill, processing stops and will retry on next bind. This ensures messages are never silently lost.

## HTTP Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/_storyboard/messages/publish` | Publish event to channel |
| GET | `/_storyboard/messages/read/:channel` | Read channel history |
| GET | `/_storyboard/messages/subscribe/:channel` | SSE subscription |
| GET | `/_storyboard/messages/presence/:canvasId` | Get present agents |
| GET | `/_storyboard/messages/presence/:canvasId/:widgetId` | Check specific agent |
| GET | `/_storyboard/messages/bindings` | Get all delivery bindings |

## Storage

All messaging data is stored under `.storyboard/messages/`:

```
.storyboard/messages/
├── channels/
│   ├── terminal--main--canvas-1--widget-a.jsonl
│   ├── presence--main--canvas-1.jsonl
│   └── ...
└── cursors/
    ├── widget-a.json
    └── ...
```

## Integration Points

- **`server-plugin.js`**: Initializes bus, presence, delivery bridge on Vite server start
- **`terminal-server.js`**: Binds/unbinds widgets on session lifecycle, joins/leaves presence
- **`server.js`**: Terminal/send handler publishes to bus with delivery ack wait
- **`terminal-messaging.js`**: CLI posts to server's terminal/send endpoint

## Key Invariants

1. Every message is durably persisted in JSONL before delivery is attempted
2. Cursor advances only on confirmed delivery (at-least-once guarantee)
3. Presence entries expire naturally — no reliance on explicit deregister
4. Channel subscriptions are in-process (same Vite server), not over network
5. The `.storyboard/messages` directory is excluded from Vite's file watcher
