# `packages/storyboard/src/core/session/bodyClasses.test.js`

<!--
source: packages/storyboard/src/core/session/bodyClasses.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Test suite for the body-class projection layer. It confirms that URL or hide-mode overrides map to stable `sb-*` classes, that scene classes are managed independently, and that unrelated storyboard body classes are preserved.

## Composition

The cases are grouped by concern: override classes, non-override preservation, flow classes, deprecated alias coverage, hide mode, and installation behavior.

```js
window.location.hash = '#theme=dark&sidebar=collapsed'
syncOverrideClasses()
expect(getSbClasses()).toContain('sb-theme--dark')
```

The suite also proves dots and special characters are sanitized before becoming class names.

## Dependencies

- [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md).
- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) helpers for hide-mode scenarios.
- jsdom `document.body.classList`.

## Dependents

- Consumed only by tests.

## Notes

By filtering only `sb-` classes from `document.body`, the helper assertions stay aligned with the production class namespace instead of depending on unrelated DOM state.
