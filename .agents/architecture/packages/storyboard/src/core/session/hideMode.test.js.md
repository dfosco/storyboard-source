# `packages/storyboard/src/core/session/hideMode.test.js`

<!--
source: packages/storyboard/src/core/session/hideMode.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Extensive executable spec for hide mode. It tests the toggle flow, snapshot history model, undo/redo behavior, shadow writes, and synchronization between URL changes and stored history.

## Composition

The suite is organized by responsibility, making the history rules explicit. For example, timeline forking after undo is captured directly:

```js
pushSnapshot('a=1', '/')
pushSnapshot('b=2', '/')
undo()
pushSnapshot('d=4', '/')
expect(canRedo()).toBe(false)
```

Later cases verify refresh behavior while hide mode is active so empty hashes do not overwrite shadow data.

## Dependencies

- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md).
- jsdom URL state and Vitest assertions.

## Dependents

- Consumed only by tests.

## Notes

This file is larger than the implementation's siblings because it documents the hidden state machine through tests rather than through extra runtime abstractions.
