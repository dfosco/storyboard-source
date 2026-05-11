# `packages/storyboard/src/core/messaging/schema.js`

<!--
source: packages/storyboard/src/core/messaging/schema.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md) defines the canonical shape of a messaging envelope. It is responsible for monotonic id generation, allowed status values, validation rules, and normalization of optional fields before anything reaches the bus or storage layer.

## Composition

The file embeds a small monotonic ULID implementation so the core messaging layer stays dependency-free:

```js
export function generateId() {
  let now = Date.now()
  if (now === lastTime) {
    for (let i = 15; i >= 0; i--) {
      if (lastRandom[i] < 31) { lastRandom[i]++; break }
      lastRandom[i] = 0
    }
  }
  return ts + rand
}
```

Validation and envelope construction are separate steps. Validation enforces required fields, namespaced `type` values, and known statuses, while `createEnvelope()` fills defaults and passes through domain extension fields unchanged:

```js
export function validateEnvelope(event) {
  if (event.type && typeof event.type === 'string' && !event.type.includes(':')) {
    errors.push(`Event type must be namespaced (namespace:action), got: ${event.type}`)
  }
}

export function createEnvelope(fields) {
  return {
    id: fields.id || generateId(),
    timestamp: fields.timestamp || new Date().toISOString(),
    ...Object.fromEntries(Object.entries(fields).filter(([k]) => !CORE_FIELDS.has(k))),
  }
}
```

## Dependencies

- No runtime imports; this file is intentionally self-contained.

## Dependents

- [`packages/storyboard/src/core/messaging/bus.js`](./bus.js.md) — uses validation and envelope creation on every publish.
- [`packages/storyboard/src/core/messaging/token-manager.js`](./token-manager.js.md) — uses ULIDs for token ids.
- [`packages/storyboard/src/core/messaging/hub-manager.js`](./hub-manager.js.md) — lazily generates conversation ids.
- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md) and [`packages/storyboard/src/core/messaging/schema.test.js`](./schema.test.js.md).

## Notes

- Extension-field passthrough is what lets domain-specific events add hub or presence metadata without changing the core schema file every time a new event family appears.

