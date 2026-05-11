# `packages/storyboard/src/core/messaging/token-manager.js`

<!--
source: packages/storyboard/src/core/messaging/token-manager.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md) manages ordered response turns inside hub conversations. When a hub request is sent, it creates one token per recipient, activates them sequentially, pauses timeouts during delegation, and tracks whether the full response round has completed.

## Composition

The module stores token state in three related indexes: token id → token, message id → ordered token ids, and hub id → active messages.

```js
const tokens = new Map()
const messageTokens = new Map()
const hubMessages = new Map()
```

`createMessageTokens()` sorts recipients by order and activates only the first token immediately:

```js
const token = {
  tokenId: `tok_${generateId()}`,
  messageId,
  hubId,
  widgetId,
  order,
  status: order === 0 ? 'active' : 'pending',
}
```

Resolution, delegation, and timeout helpers then advance the round:

```js
export function resolveToken(tokenId, responseId) { /* mark resolved + activateNextPending */ }
export function delegateToken(tokenId) { /* pause timeout */ }
export function undelegateToken(tokenId) { /* resume timeout */ }
```

## Dependencies

- [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md) — generates stable token ids.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) — creates, resolves, delegates, and reports tokens through hub endpoints.
- [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) — lazily calls `cleanupHub()` when dissolving hubs.

## Notes

- Timeout callbacks are local side effects, not persisted events; callers that need visible timeout notifications must layer that behavior on top.

