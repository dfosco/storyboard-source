# `packages/storyboard/src/core/messaging/schema.test.js`

<!--
source: packages/storyboard/src/core/messaging/schema.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/schema.test.js`](./schema.test.js.md) guards the foundational message-envelope invariants: ULID format and monotonicity, valid status constants, validation failures, and preservation of extension fields during normalization.

## Composition

The tests directly exercise the three schema exports:

```js
const id = generateId()
expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)

const { valid } = validateEnvelope({ ...validEvent, status })
const env = createEnvelope({ channel: 'test', type: 'message:request', senderId: 'widget-a' })
```

## Dependencies

- [`packages/storyboard/src/core/messaging/schema.js`](./schema.js.md)
- Vitest.

## Dependents

- No production dependents; this file is test-only.

## Notes

- Because ids are expected to sort lexicographically, the monotonicity test is a direct architectural guarantee for read cursors and replay ordering.

