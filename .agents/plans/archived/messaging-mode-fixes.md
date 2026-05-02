# Messaging Mode Fixes + Skill Injection

## Issues Fixed

### 1. Both terminals share the mode
The connector is shared — `meta.messagingMode` is stored on the connector object. Both sides' 💬 menus read the same value. The `connectorKey` prop (changed from `connectorCount`) now includes messaging mode in its value, so ChromeWrappedWidget re-renders when mode changes via HMR push.

### 2. Inject messaging skill via tmux when mode changes
When user changes a connector's messaging mode via the 💬 menu:
- Server PATCHes the connector
- Server detects both endpoints are terminal/agent widgets
- Server sends a formatted skill message to BOTH terminals via tmux send-keys

Message format per mode:
- **Two-way ↔**: Both get full instructions (send, save output, read peer output, check status)
- **One-way →**: Source gets send instructions, receiver gets read instructions
- **None**: Both get "Messaging disabled" notification

### 3. UI refresh on meta changes
Changed `connectorCount` (number) to `connectorKey` (string with `id:mode` pairs) so the memo re-runs when connector meta changes, not just when connectors are added/removed.

## Implementation
- `PATCH /connector` handler in server.js: after updating connector, inject skill message to both terminal tmux sessions
- `connectorKey` prop replaces `connectorCount` for proper reactivity
- Agent type label: "Agent · name" instead of "Terminal · name" for agent widgets
- Broadcast icon (Primer) for messaging menu
